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
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(rootDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-cache");
    }
  }
}));

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function normalizePhone(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function createInvoicePdf(order) {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ margin: 48 });
    const chunks = [];
    document.on("data", (chunk) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document.fontSize(24).fillColor("#9f3449").text("Well Baked");
    document.moveDown(0.4);
    document.fontSize(18).fillColor("#222222").text("Order Invoice");
    document.moveDown();
    document.fontSize(10).fillColor("#555555");
    document.text(`Order ID: ${order.id}`);
    document.text(`Order date: ${new Date(order.createdAt).toLocaleString("en-IN")}`);
    document.text(`Payment: ${order.paymentMethod}`);
    document.moveDown();

    document.fontSize(13).fillColor("#222222").text("Customer details");
    document.fontSize(10).fillColor("#555555");
    document.text(`Name: ${order.customer.name || ""}`);
    document.text(`Email: ${order.customer.email || ""}`);
    document.text(`Phone: ${order.customer.phone || ""}`);
    document.text(`Address: ${order.customer.address || ""}`);
    document.text(`Instructions: ${order.customer.instructions || "None"}`);
    document.moveDown();

    document.fontSize(13).fillColor("#222222").text("Items");
    document.moveDown(0.3);
    order.items.forEach((item) => {
      const label = item.specialTitle ? `${item.name} - ${item.specialTitle}` : item.name;
      document.fontSize(10).fillColor("#555555").text(`${label} | ${item.kg} | Qty: ${item.qty} | ${money(item.lineTotal)}`);
    });
    document.moveDown();
    document.fontSize(16).fillColor("#9f3449").text(`Total: ${money(order.total)}`);
    document.fontSize(10).fillColor("#555555").moveDown().text("Thank you for your order. We will contact you very soon.");
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
  const ownerNumber = requiredEnv("OWNER_WHATSAPP_NUMBER");
  const customerNumber = order.customer.whatsapp || order.customer.phone;
  const ownerTemplate = requiredEnv("WHATSAPP_OWNER_TEMPLATE");
  const customerTemplate = requiredEnv("WHATSAPP_CUSTOMER_TEMPLATE");
  const mediaId = await uploadPdf(pdf);
  const details = `${order.id} | ${order.customer.name} | ${money(order.total)}`;
  await Promise.all([
    sendWhatsAppMessage(customerNumber, customerTemplate, [order.customer.name, order.id]),
    sendWhatsAppDocument(customerNumber, mediaId, "Your Well Baked invoice"),
    sendWhatsAppMessage(ownerNumber, ownerTemplate, [order.id, order.customer.name, order.customer.phone, money(order.total), details]),
    sendWhatsAppDocument(ownerNumber, mediaId, "New bakery order invoice")
  ]);
}

function catalogPasscodeValid(request) {
  return request.get("x-admin-passcode") === (process.env.ADMIN_PASSCODE || "owner123");
}

app.get("/api/catalog", async (_request, response) => {
  if (!pool) {
    return response.json({ catalog: null });
  }
  try {
    const result = await pool.query("SELECT value FROM app_state WHERE key = 'catalog'");
    response.json({ catalog: result.rows[0]?.value ?? null });
  } catch (error) {
    console.error("Catalog lookup failed", error);
    response.status(500).json({ error: "Catalog could not be loaded." });
  }
});

app.put("/api/catalog", async (request, response) => {
  if (!pool) {
    return response.status(503).json({ error: "Database not configured on this server (DATABASE_URL missing)." });
  }
  if (!catalogPasscodeValid(request)) {
    return response.status(401).json({ error: "Unauthorized" });
  }
  const catalog = request.body;
  if (!catalog || !Array.isArray(catalog.products)) {
    return response.status(400).json({ error: "Invalid catalog payload." });
  }
  try {
    await pool.query(
      `INSERT INTO app_state (key, value, updated_at) VALUES ('catalog', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [JSON.stringify(catalog)]
    );
    response.json({ saved: true });
  } catch (error) {
    console.error("Catalog save failed", error);
    response.status(500).json({ error: "Catalog could not be saved." });
  }
});

app.get("/api/health", async (_request, response) => {
  response.json({ ok: true, databaseConfigured: Boolean(pool) });
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
      [order.id, order.createdAt, order.status || "New", order.paymentMethod || "Order payment", order.customer, order.items, order.total]
    );
    const pdf = await createInvoicePdf(order);
    await deliverOrderOnWhatsApp(order, pdf);
    await pool.query("UPDATE orders SET pdf_sent = TRUE WHERE id = $1", [order.id]);
    response.status(201).json({ saved: true, whatsappSent: true, orderId: order.id });
  } catch (error) {
    console.error("Order delivery failed", error);
    response.status(502).json({ saved: true, whatsappSent: false, orderId: order.id, error: error.message });
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
