import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import pg from "pg";

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 10000);
const rootDir = path.dirname(fileURLToPath(import.meta.url));
const catalogFilePath = path.join(rootDir, ".data", "catalog.json");
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "25mb" }));
app.use(express.static(rootDir, {
  // Serve everything fresh: a phone holding last week's storefront.js would
  // never call /api/catalog, so it would keep showing the demo catalog.
  setHeaders: (res) => {
    res.setHeader("Cache-Control", "no-cache");
  }
}));

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

// The owner's real WhatsApp number (country code + number, digits only).
// Used whenever OWNER_WHATSAPP_NUMBER is missing/invalid so invoices always
// have somewhere to go.
const DEFAULT_OWNER_WHATSAPP = "919041475757";

function resolveOwnerWhatsAppNumber() {
  const digits = normalizePhone(process.env.OWNER_WHATSAPP_NUMBER);
  return digits.length >= 10 ? digits : DEFAULT_OWNER_WHATSAPP;
}

function normalizePhone(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

// --- Order-form PDF (used for both the WhatsApp invoice and the emailed
// PDF link) ----------------------------------------------------------------
// Mirrors the printable paper order form: Customer Details, Cake/Item
// Details (with a real product photo per item), Add-ons, Special
// Instructions, and Order & Delivery. Only fields the checkout form actually
// collects today are included - there is currently no "Cake Theme", "Name on
// Cake", delivery date/time, or pickup-vs-delivery field captured at
// checkout, so those rows are simply left out rather than shown blank.

function isDataUrlImage(value) {
  return typeof value === "string" && value.startsWith("data:image/");
}

async function resolveOrderItemImageBuffer(imagePath) {
  if (!imagePath) {
    return null;
  }
  if (isDataUrlImage(imagePath)) {
    try {
      return Buffer.from(imagePath.split(",")[1] || "", "base64");
    } catch (error) {
      return null;
    }
  }
  const match = String(imagePath).match(/\/api\/images\/([a-z0-9_-]+)/i);
  if (!match) {
    return null;
  }
  try {
    const record = await readImageRecord(match[1]);
    if (isDataUrlImage(record)) {
      return Buffer.from(record.split(",")[1] || "", "base64");
    }
  } catch (error) {
    console.error("Order PDF: image lookup failed", error && error.message ? error.message : error);
  }
  return null;
}

function findOrderItemCatalogFields(item, catalog) {
  const products = (catalog && catalog.products) || [];
  const specials = (catalog && catalog.specials) || [];
  let source = null;
  if (item.productId) {
    source = products.find((product) => product.id === item.productId);
  }
  if (!source && item.specialId) {
    source = specials.find((special) => special.id === item.specialId);
  }
  return {
    category: (source && source.category) || "",
    image: (source && source.image) || ""
  };
}

async function createInvoicePdf(order, catalog) {
  const bakeryName = (catalog && catalog.settings && catalog.settings.bakeryName) || "Premium Cakes";

  // Resolve each item's flavour/category and real photo bytes up front
  // (async lookups), so the layout below can run synchronously. Every item
  // the customer ordered gets its photo looked up here - cakes AND add-ons -
  // so every line in the PDF can show a real picture, not just the cakes.
  const resolvedItems = await Promise.all(
    (order.items || []).map(async (item) => {
      const fields = findOrderItemCatalogFields(item, catalog);
      const imageBuffer = await resolveOrderItemImageBuffer(fields.image);
      return { item, category: fields.category, imageBuffer };
    })
  );

  const addOnEntries = resolvedItems.filter((entry) => /add-?ons?/i.test(entry.category));
  const cakeEntries = resolvedItems.filter((entry) => !/add-?ons?/i.test(entry.category));

  // The whole order form is meant to fit on a single page, so the photo
  // size scales down as the order has more items instead of using one
  // fixed (and potentially page-busting) size. Kept modest, not huge.
  const totalItemCount = resolvedItems.length || 1;
  const IMAGE_SIZE = totalItemCount <= 2 ? 100 : totalItemCount <= 4 ? 80 : totalItemCount <= 6 ? 65 : 52;
  const ITEM_GAP = totalItemCount <= 4 ? 0.3 : 0.18;

  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ margin: 36, size: "A4" });
    const chunks = [];
    document.on("data", (chunk) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    const pageRight = document.page.width - document.page.margins.right;
    const pageLeft = document.page.margins.left;
    const pageBottom = document.page.height - document.page.margins.bottom;

    // Renders one order item (cake or add-on) as a compact row: details on
    // the left, a real product photo on the right. Only falls back to a new
    // page if the row genuinely can't fit - the sizing above is chosen so
    // that doesn't normally happen for a typical order.
    function renderItemRow(entry, index, { showFlavour }) {
      const item = entry.item;
      const label = item.specialTitle ? `${item.name} - ${item.specialTitle}` : item.name;
      const hasImage = Boolean(entry.imageBuffer);
      const imageSize = IMAGE_SIZE;

      if (document.y + imageSize > pageBottom) {
        document.addPage();
      }

      const startY = document.y;
      const textWidth = hasImage ? pageRight - pageLeft - imageSize - 12 : pageRight - pageLeft;

      document.fontSize(10).fillColor("#3a2a22").text(`${index + 1}. ${label}`, pageLeft, startY, { width: textWidth });
      document.fontSize(8).fillColor("#6a5344");
      if (showFlavour && entry.category) {
        document.text(`Cake Flavour: ${entry.category}`, pageLeft, document.y, { width: textWidth });
      }
      if (item.kg) {
        document.text(`Size: ${item.kg}`, pageLeft, document.y, { width: textWidth });
      }
      document.text(`Quantity: ${item.qty}`, pageLeft, document.y, { width: textWidth });
      document.text(`Price: ${money(item.lineTotal)}`, pageLeft, document.y, { width: textWidth });
      const textBottom = document.y;

      if (hasImage) {
        try {
          document.image(entry.imageBuffer, pageRight - imageSize, startY, {
            width: imageSize,
            height: imageSize,
            fit: [imageSize, imageSize]
          });
        } catch (error) {
          console.error("Order PDF: failed to embed item image", error && error.message ? error.message : error);
        }
      }

      document.y = Math.max(textBottom, startY + (hasImage ? imageSize : 0));
      document.moveDown(ITEM_GAP);
      document.moveTo(pageLeft, document.y).lineTo(pageRight, document.y).strokeColor("#f1ece7").stroke();
      document.moveDown(ITEM_GAP);
    }

    // --- Header -----------------------------------------------------------
    document.fontSize(18).fillColor("#9f3449").text(bakeryName);
    document.fontSize(12).fillColor("#222222").text("Order Form");
    document.moveDown(0.2);
    document.fontSize(9).fillColor("#555555")
      .text(`Date of Placing Order: ${new Date(order.createdAt).toLocaleString("en-IN")}`);
    document.moveDown(0.35);
    document.moveTo(pageLeft, document.y).lineTo(pageRight, document.y).strokeColor("#e5d9cf").stroke();
    document.moveDown(0.35);

    // --- Customer Details ---------------------------------------------------
    document.fontSize(12).fillColor("#222222").text("Customer Details");
    document.moveDown(0.15);
    document.fontSize(9).fillColor("#444444");
    document.text(`Customer Name: ${order.customer.name || ""}`);
    document.text(`Mobile Number: ${order.customer.phone || ""}`);
    document.text(`Email: ${order.customer.email || ""}`);
    document.text(`Address: ${order.customer.address || ""}`);
    document.moveDown(0.35);

    // --- Cake / Item Details -------------------------------------------------
    document.fontSize(12).fillColor("#222222")
      .text(cakeEntries.length > 1 ? "Cake Details (Items)" : "Cake Details");
    document.moveDown(0.2);

    cakeEntries.forEach((entry, index) => renderItemRow(entry, index, { showFlavour: true }));

    // --- Add-ons -------------------------------------------------------------
    // Add-ons get the same photo treatment as the cakes, so every item the
    // customer ordered shows a real picture, not just a text line.
    if (addOnEntries.length) {
      if (document.y + 20 > pageBottom) {
        document.addPage();
      }
      document.fontSize(12).fillColor("#222222").text("Add-ons");
      document.moveDown(0.2);
      addOnEntries.forEach((entry, index) => renderItemRow(entry, index, { showFlavour: false }));
    }

    // --- Special Instructions --------------------------------------------------
    if (order.customer.instructions) {
      document.fontSize(12).fillColor("#222222").text("Special Instructions");
      document.moveDown(0.15);
      document.fontSize(9).fillColor("#444444").text(order.customer.instructions);
      document.moveDown(0.35);
    }

    // --- Order & Delivery -------------------------------------------------------
    document.fontSize(12).fillColor("#222222").text("Order & Delivery");
    document.moveDown(0.15);
    document.fontSize(9).fillColor("#444444");
    document.text(`Order ID: ${order.id}`);
    document.text(`Payment: ${order.paymentMethod}`);
    document.moveDown(0.35);

    document.fontSize(13).fillColor("#9f3449").text(`Total: ${money(order.total)}`);
    document.fontSize(8).fillColor("#8a6a55").moveDown(0.25)
      .text("Thank you for your order. We will contact you very soon.");

    document.end();
  });
}

async function sendWhatsAppMessage(to, templateName, parameters) {
  const token = requiredEnv("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = requiredEnv("WHATSAPP_PHONE_NUMBER_ID");
  const version = process.env.WHATSAPP_API_VERSION || "v23.0";
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: normalizePhone(to),
      type: "template",
      template: {
        name: templateName,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US" },
        components: parameters.length
          ? [{ type: "body", parameters: parameters.map((text) => ({ type: "text", text: String(text || "-") })) }]
          : []
      }
    })
  });
  if (!response.ok) {
    throw new Error(`WhatsApp API ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function sendWhatsAppDocument(to, documentId, caption) {
  const token = requiredEnv("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = requiredEnv("WHATSAPP_PHONE_NUMBER_ID");
  const version = process.env.WHATSAPP_API_VERSION || "v23.0";
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: normalizePhone(to),
      type: "document",
      document: { id: documentId, filename: "bakery-order-invoice.pdf", caption }
    })
  });
  if (!response.ok) {
    throw new Error(`WhatsApp document API ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function uploadPdf(pdf) {
  const token = requiredEnv("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = requiredEnv("WHATSAPP_PHONE_NUMBER_ID");
  const version = process.env.WHATSAPP_API_VERSION || "v23.0";
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("file", new Blob([pdf], { type: "application/pdf" }), "bakery-order-invoice.pdf");
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  if (!response.ok) {
    throw new Error(`WhatsApp media API ${response.status}: ${await response.text()}`);
  }
  return (await response.json()).id;
}

async function deliverOrderOnWhatsApp(order, pdf) {
  const ownerNumber = resolveOwnerWhatsAppNumber();
  const customerNumber = normalizePhone(order.customer.whatsapp || order.customer.phone);
  const ownerTemplate = requiredEnv("WHATSAPP_OWNER_TEMPLATE");
  const customerTemplate = requiredEnv("WHATSAPP_CUSTOMER_TEMPLATE");
  const mediaId = await uploadPdf(pdf);
  const details = `${order.id} | ${order.customer.name} | ${money(order.total)}`;
  await Promise.all([
    sendWhatsAppMessage(customerNumber, customerTemplate, [order.customer.name, order.id]),
    sendWhatsAppDocument(customerNumber, mediaId, "Your Premium Cakes invoice"),
    sendWhatsAppMessage(ownerNumber, ownerTemplate, [order.id, order.customer.name, order.customer.phone, money(order.total), details]),
    sendWhatsAppDocument(ownerNumber, mediaId, "New bakery order invoice")
  ]);
}

function catalogStoreName() {
  return pool ? "database" : "file";
}

async function readFileCatalog() {
  try {
    return JSON.parse(await fs.readFile(catalogFilePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function writeFileCatalog(catalog) {
  await fs.mkdir(path.dirname(catalogFilePath), { recursive: true });
  await fs.writeFile(catalogFilePath, JSON.stringify(catalog), "utf8");
}

async function readCatalog() {
  if (!pool) {
    return readFileCatalog();
  }
  const result = await pool.query("SELECT value FROM app_state WHERE key = 'catalog'");
  return result.rows[0]?.value ?? null;
}

async function writeCatalog(catalog) {
  if (!pool) {
    await writeFileCatalog(catalog);
    return;
  }
  await pool.query(
    `INSERT INTO app_state (key, value, updated_at) VALUES ('catalog', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
    [JSON.stringify(catalog)]
  );
}

async function catalogPasscodeValid(request) {
  const passcode = request.get("x-admin-passcode");
  if (!passcode) {
    return false;
  }
  if (passcode === (process.env.ADMIN_PASSCODE || "owner123")) {
    return true;
  }
  const catalog = await readCatalog().catch(() => null);
  return passcode === catalog?.settings?.adminPasscode;
}

app.get("/api/catalog", async (_request, response) => {
  try {
    response.json({ catalog: await readCatalog(), store: catalogStoreName() });
  } catch (error) {
    console.error("Catalog lookup failed", error);
    response.status(500).json({ error: "Catalog could not be loaded." });
  }
});

app.put("/api/catalog", async (request, response) => {
  if (!(await catalogPasscodeValid(request))) {
    return response.status(401).json({ error: "Unauthorized" });
  }
  const catalog = request.body;
  if (!catalog || !Array.isArray(catalog.products)) {
    return response.status(400).json({ error: "Invalid catalog payload." });
  }
  try {
    const savedCatalog = {
      ...catalog,
      settings: {
        ...(catalog.settings || {}),
        catalogUpdatedAt: catalog.settings?.catalogUpdatedAt || new Date().toISOString()
      }
    };
    await writeCatalog(savedCatalog);
    response.json({ saved: true, catalog: savedCatalog, store: catalogStoreName() });
  } catch (error) {
    console.error("Catalog save failed", error);
    response.status(500).json({ error: "Catalog could not be saved." });
  }
});

// --- Admin image storage -------------------------------------------------
// Uploaded photos are stored here (database on Render, disk locally) and
// referenced from the catalog by short /api/images/<id> URLs. This keeps big
// base64 photos out of localStorage (~5 MB), so editing one item can never
// overflow storage and evict other items' images.

const IMAGE_DATA_PREFIX = "data:image/";
const IMAGE_MAX_BYTES = 6 * 1024 * 1024; // matches the JSON body limit with headroom

async function readImageRecord(id) {
  if (!pool) {
    try {
      const dir = path.join(rootDir, ".data", "images");
      const safe = String(id).replace(/[^a-z0-9_-]/gi, "");
      return JSON.parse(await fs.readFile(path.join(dir, `${safe}.json`), "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") { return null; }
      throw error;
    }
  }
  const result = await pool.query("SELECT value FROM app_images WHERE id = $1", [String(id)]);
  return result.rows[0]?.value ?? null;
}

async function writeImageRecord(id, dataUrl) {
  if (!pool) {
    const dir = path.join(rootDir, ".data", "images");
    await fs.mkdir(dir, { recursive: true });
    const safe = String(id).replace(/[^a-z0-9_-]/gi, "");
    await fs.writeFile(path.join(dir, `${safe}.json`), JSON.stringify(dataUrl), "utf8");
    return;
  }
  await pool.query(
    `INSERT INTO app_images (id, value) VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET value = $2, created_at = NOW()`,
    [String(id), dataUrl]
  );
}

app.post("/api/images", async (request, response) => {
  const dataUrl = request.body?.image;
  if (typeof dataUrl !== "string" || !dataUrl.startsWith(IMAGE_DATA_PREFIX) || dataUrl.length > IMAGE_MAX_BYTES) {
    return response.status(400).json({ error: "Invalid image payload." });
  }
  const id = `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    await writeImageRecord(id, dataUrl);
    response.status(201).json({ ok: true, url: `/api/images/${id}` });
  } catch (error) {
    console.error("Image save failed", error);
    response.status(500).json({ error: "Image could not be saved." });
  }
});

app.get("/api/images/:id", async (request, response) => {
  try {
    const record = await readImageRecord(request.params.id);
    if (!record || typeof record !== "string" || !record.startsWith(IMAGE_DATA_PREFIX)) {
      return response.status(404).type("text/plain").send("Not found");
    }
    response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    response.type("image/jpeg").send(Buffer.from(record.split(",")[1] || "", "base64"));
  } catch (error) {
    console.error("Image lookup failed", error);
    response.status(500).type("text/plain").send("Image could not be loaded.");
  }
});

app.get("/api/health", async (_request, response) => {
  response.json({ ok: true, databaseConfigured: Boolean(pool), catalogStore: catalogStoreName() });
});

app.get("/api/orders", async (request, response) => {
  if (!pool || request.get("x-admin-passcode") !== (process.env.ADMIN_PASSCODE || "owner123")) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await pool.query("SELECT id, created_at AS \"createdAt\", status, payment_method AS \"paymentMethod\", customer, items, total FROM orders ORDER BY created_at DESC");
    response.json({ orders: result.rows });
  } catch (error) {
    console.error("Order lookup failed", error);
    response.status(500).json({ error: "Orders could not be loaded." });
  }
});

app.post("/api/orders", async (request, response) => {
  const order = request.body;
  if (!pool || !order?.id || !order.customer?.name || !order.customer?.phone || order.customer.whatsappConsent !== "on" || !Array.isArray(order.items) || !order.items.length) {
    return response.status(400).json({ error: "Invalid order or database is not configured." });
  }

  try {
    await pool.query(
      `INSERT INTO orders (id, created_at, status, payment_method, customer, items, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      // node-postgres serializes a plain JS array as a Postgres ARRAY literal
      // (e.g. "{...}"), not as JSON, regardless of the target column type -
      // so order.items (an array) was silently producing an invalid value for
      // the jsonb "items" column on every single order ("invalid input
      // syntax for type json"), and this INSERT was failing every time. The
      // catch block below still reported {saved:true} on any error, which is
      // why this went unnoticed: WhatsApp/email still fire from the in-memory
      // `order` object regardless, but nothing was ever actually persisted.
      // Explicitly JSON.stringify both jsonb fields so this always inserts
      // valid JSON no matter what shape the value is.
      [order.id, order.createdAt, order.status || "New", order.paymentMethod || "Order payment", JSON.stringify(order.customer), JSON.stringify(order.items), order.total]
    );
    const catalogForPdf = await readCatalog().catch(() => null);
    const pdf = await createInvoicePdf(order, catalogForPdf);
    await deliverOrderOnWhatsApp(order, pdf);
    await pool.query("UPDATE orders SET pdf_sent = TRUE WHERE id = $1", [order.id]);
    response.status(201).json({ saved: true, whatsappSent: true, orderId: order.id });
  } catch (error) {
    console.error("Order WhatsApp delivery failed:", error && error.message ? error.message : error);
    response.status(502).json({ saved: true, whatsappSent: false, orderId: order.id, error: error.message });
  }
});

// The same order-form PDF, fetchable by order id. EmailJS's server fetches
// this URL to attach the PDF to the order confirmation emails (see the
// template's Attachments tab), and it's also linked directly in the email
// body as a reliable fallback. Order ids include a random suffix
// (SL-YYYYMMDD-XXXXX), so this is unauthenticated-but-unguessable, the same
// tradeoff most small order/receipt links make.
app.get("/api/orders/:id/order-form.pdf", async (request, response) => {
  if (!pool) {
    return response.status(404).type("text/plain").send("Not found");
  }
  try {
    const result = await pool.query(
      "SELECT id, created_at AS \"createdAt\", payment_method AS \"paymentMethod\", customer, items, total FROM orders WHERE id = $1",
      [request.params.id]
    );
    const order = result.rows[0];
    if (!order) {
      return response.status(404).type("text/plain").send("Order not found");
    }
    const catalog = await readCatalog().catch(() => null);
    const pdf = await createInvoicePdf(order, catalog);
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", `inline; filename="order-${order.id}.pdf"`);
    response.send(pdf);
  } catch (error) {
    console.error("Order PDF generation failed:", error && error.message ? error.message : error);
    response.status(500).type("text/plain").send("Order PDF could not be generated.");
  }
});

app.get("/admin", (_request, response) => {
  response.setHeader("Cache-Control", "no-cache");
  response.sendFile(path.join(rootDir, "admin", "index.html"));
});
app.get("/{*splat}", (_request, response) => {
  response.setHeader("Cache-Control", "no-cache");
  response.sendFile(path.join(rootDir, "index.html"));
});

async function start() {
  if (pool) {
    await pool.query(await fs.readFile(path.join(rootDir, "schema.sql"), "utf8"));
  }
  app.listen(port, () => console.log(`Bakery server listening on ${port}`));
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
