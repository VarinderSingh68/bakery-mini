(function () {
  "use strict";

  const dataApi = window.BakeryData;
  let data = dataApi.load();
  let currentProductImage = "";
  let currentSpecialImage = "";
  let currentBannerImage = "";

  const newProductColors = [
    ["#b23a48", "#fff1f3", "#80303b"],
    ["#2d7d78", "#effffc", "#1f5b55"],
    ["#c47f22", "#fff3ce", "#8b520d"],
    ["#5661a7", "#edf0ff", "#333b78"],
    ["#6d4c41", "#f6eee8", "#3d2b25"]
  ];

  const elements = {
    loginView: document.getElementById("loginView"),
    dashboardView: document.getElementById("dashboardView"),
    loginForm: document.getElementById("loginForm"),
    loginMessage: document.getElementById("loginMessage"),
    logoutButton: document.getElementById("logoutButton"),
    adminTitle: document.getElementById("adminTitle"),
    navLinks: document.querySelectorAll(".nav-link"),
    panels: document.querySelectorAll(".admin-panel"),
    productForm: document.getElementById("productForm"),
    productFormMessage: document.getElementById("productFormMessage"),
    productFormTitle: document.getElementById("productFormTitle"),
    clearProductForm: document.getElementById("clearProductForm"),
    productList: document.getElementById("productList"),
    variantEditor: document.getElementById("variantEditor"),
    addVariant: document.getElementById("addVariant"),
    productImagePreview: document.getElementById("productImagePreview"),
    categoryForm: document.getElementById("categoryForm"),
    categoryList: document.getElementById("categoryList"),
    specialForm: document.getElementById("specialForm"),
    specialFormMessage: document.getElementById("specialFormMessage"),
    specialFormTitle: document.getElementById("specialFormTitle"),
    clearSpecialForm: document.getElementById("clearSpecialForm"),
    specialVariantEditor: document.getElementById("specialVariantEditor"),
    addSpecialVariant: document.getElementById("addSpecialVariant"),
    specialList: document.getElementById("specialList"),
    specialImagePreview: document.getElementById("specialImagePreview"),
    bannerForm: document.getElementById("bannerForm"),
    bannerFormMessage: document.getElementById("bannerFormMessage"),
    bannerFormTitle: document.getElementById("bannerFormTitle"),
    clearBannerForm: document.getElementById("clearBannerForm"),
    bannerImagePreview: document.getElementById("bannerImagePreview"),
    bannerList: document.getElementById("bannerList"),
    settingsForm: document.getElementById("settingsForm"),
    settingsMessage: document.getElementById("settingsMessage"),
    orderList: document.getElementById("orderList"),
    clearOrders: document.getElementById("clearOrders"),
    resetData: document.getElementById("resetData"),
    cloudSyncStatus: document.getElementById("cloudSyncStatus"),
    cloudSyncButton: document.getElementById("cloudSyncButton"),
    statProducts: document.getElementById("statProducts"),
    statCategories: document.getElementById("statCategories"),
    statSpecials: document.getElementById("statSpecials"),
    statOrders: document.getElementById("statOrders")
  };

  function init() {
    bindEvents();
    migrateStoredImages();
    resetProductForm();
    resetSpecialForm();
    resetBannerForm();
    populateSettingsForm();

    if (sessionStorage.getItem("bakery_admin_authenticated") === "yes") {
      showDashboard();
    }
  }

  function bindEvents() {
    elements.loginForm.addEventListener("submit", handleLogin);
    elements.logoutButton.addEventListener("click", handleLogout);

    elements.navLinks.forEach((button) => {
      button.addEventListener("click", () => showPanel(button.dataset.panel, button.textContent.trim()));
    });

    elements.productForm.addEventListener("submit", handleProductSubmit);
    elements.clearProductForm.addEventListener("click", resetProductForm);
    elements.addVariant.addEventListener("click", () => addVariantRow({ kg: "", price: "" }));
    elements.variantEditor.addEventListener("click", handleVariantClick);
    elements.productForm.elements.image.addEventListener("change", (event) => {
      readImage(event.target.files[0], (image) => {
        currentProductImage = image;
        elements.productImagePreview.src = image;
      });
    });
    elements.productForm.elements.imageUrl.addEventListener("input", handleProductImageUrlInput);
    elements.productList.addEventListener("click", handleProductListClick);

    elements.categoryForm.addEventListener("submit", handleCategorySubmit);
    elements.categoryList.addEventListener("click", handleCategoryClick);

    elements.specialForm.addEventListener("submit", handleSpecialSubmit);
    elements.clearSpecialForm.addEventListener("click", resetSpecialForm);
    elements.addSpecialVariant.addEventListener("click", () => addSpecialVariantRow({ kg: "", price: "" }));
    elements.specialVariantEditor.addEventListener("click", handleSpecialVariantClick);
    elements.specialForm.elements.image.addEventListener("change", (event) => {
      readImage(event.target.files[0], (image) => {
        currentSpecialImage = image;
        elements.specialImagePreview.src = image;
      });
    });
    elements.specialForm.elements.imageUrl.addEventListener("input", handleSpecialImageUrlInput);
    elements.specialList.addEventListener("click", handleSpecialListClick);

    elements.bannerForm.addEventListener("submit", handleBannerSubmit);
    elements.clearBannerForm.addEventListener("click", resetBannerForm);
    elements.bannerForm.elements.image.addEventListener("change", (event) => {
      readImage(event.target.files[0], (image) => {
        currentBannerImage = image;
        elements.bannerImagePreview.src = image;
      });
    });
    elements.bannerForm.elements.imageUrl.addEventListener("input", handleBannerImageUrlInput);
    elements.bannerList.addEventListener("click", handleBannerListClick);

    elements.settingsForm.addEventListener("submit", handleSettingsSubmit);
    elements.resetData.addEventListener("click", handleResetData);
    elements.cloudSyncButton.addEventListener("click", async () => {
      setCloudStatus("Publishing to cloud...");
      const result = await dataApi.pushCloudData(data, data.settings.adminPasscode || "owner123");
      if (result.ok) {
        data.settings.catalogUpdatedAt = new Date().toISOString();
        dataApi.save(data);
        setCloudStatus("Published - all devices now see this menu.");
      } else {
        setCloudStatus(describeSyncError(new Error(result.error || "network")), true);
      }
    });
    elements.clearOrders.addEventListener("click", handleClearOrders);
  }

  function handleLogin(event) {
    event.preventDefault();
    const passcode = elements.loginForm.elements.passcode.value;

    if (passcode === data.settings.adminPasscode) {
      sessionStorage.setItem("bakery_admin_authenticated", "yes");
      elements.loginForm.reset();
      elements.loginMessage.textContent = "";
      showDashboard();
      return;
    }

    elements.loginMessage.textContent = "Wrong passcode. Please try again.";
  }

  function handleLogout() {
    sessionStorage.removeItem("bakery_admin_authenticated");
    elements.dashboardView.hidden = true;
    elements.loginView.hidden = false;
  }

  function showDashboard() {
    elements.loginView.hidden = true;
    elements.dashboardView.hidden = false;
    refreshAll();
    syncOnOpen();
  }

  async function syncOnOpen() {
    setCloudStatus("Checking cloud catalog...");
    try {
      const response = await fetch("/api/catalog", { cache: "no-store" });
      if (!response.ok) { throw new Error("status " + response.status); }
      const body = await response.json();
      if (!body.catalog) {
        // Cloud empty: publish this browser's catalog so other devices get it.
        data.settings.catalogUpdatedAt = new Date().toISOString();
        dataApi.save(data);
        const result = await dataApi.pushCloudData(data, data.settings.adminPasscode || "owner123");
        if (result.ok) {
          setCloudStatus("Published to cloud - all devices now see this menu.");
        } else {
          setCloudStatus(describeSyncError(new Error(result.error || "network")), true);
        }
        return;
      }
      const cloudAt = body.catalog.settings && body.catalog.settings.catalogUpdatedAt;
      const localAt = data.settings && data.settings.catalogUpdatedAt;
      if (cloudAt && (!localAt || cloudAt > localAt)) {
        // Another device saved newer changes: adopt them here too.
        const merged = await dataApi.pullCloudData();
        if (merged) {
          data = merged;
          refreshAll();
          populateSettingsForm();
          setCloudStatus("Updated from cloud (newer edits found).");
          return;
        }
      }
      setCloudStatus("Cloud is up to date with this browser.");
    } catch (error) {
      setCloudStatus(describeSyncError(error), true);
    }
  }

  function describeSyncError(error) {
    const text = String((error && error.message) || error || "");
    if (text.includes("404")) {
      return "This server does not have catalog sync yet - deploy the latest code to Render, then refresh this page.";
    }
    if (text.includes("503")) {
      return "Server database is not connected - add the DATABASE_URL environment variable on Render, then redeploy.";
    }
    if (text.includes("401")) {
      return "Sync rejected: admin passcode does not match the server (ADMIN_PASSCODE).";
    }
    return "Cannot reach the server. Open this admin panel at your Render website address (https://...onrender.com/admin), not a local preview, then try again.";
  }

  function setCloudStatus(message, isError) {
    if (!elements.cloudSyncStatus) { return; }
    elements.cloudSyncStatus.textContent = message || "";
    elements.cloudSyncStatus.classList.toggle("error", Boolean(isError));
  }

  function setFormMessage(element, message) {
    if (element) {
      element.textContent = message || "";
    }
  }

  function showPanel(panelId, title) {
    elements.panels.forEach((panel) => panel.classList.toggle("active", panel.id === panelId));
    elements.navLinks.forEach((button) => button.classList.toggle("active", button.dataset.panel === panelId));
    elements.adminTitle.textContent = title || "Overview";
  }

  function refreshAll() {
    data = dataApi.load();
    document.querySelectorAll("[data-admin-brand]").forEach((node) => {
      node.textContent = data.settings.bakeryName;
    });
    renderStats();
    renderProductList();
    renderCategoryList();
    renderSpecialList();
    renderBannerList();
    renderOrderList();
    populateSettingsForm();
    loadRemoteOrders();
  }

  async function loadRemoteOrders() {
    try {
      const response = await fetch("../api/orders", {
        headers: { "x-admin-passcode": data.settings.adminPasscode }
      });
      if (!response.ok) {
        return;
      }
      const result = await response.json();
      data.orders = Array.isArray(result.orders) ? result.orders : data.orders;
      renderStats();
      renderOrderList();
    } catch (error) {
      console.warn("Remote orders unavailable", error);
    }
  }

  function renderStats() {
    elements.statProducts.textContent = String(data.products.length);
    elements.statCategories.textContent = String(data.categories.length);
    elements.statSpecials.textContent = String(data.specials.length);
    elements.statOrders.textContent = String(data.orders.length);
  }

  function resetBannerForm() {
    currentBannerImage = "";
    setFormMessage(elements.bannerFormMessage, "");
    elements.bannerForm.reset();
    elements.bannerForm.elements.id.value = "";
    elements.bannerForm.elements.active.checked = true;
    elements.bannerFormTitle.textContent = "Add banner";
    elements.bannerImagePreview.src = dataApi.getProductImage({ name: "Banner", accent: "#d64f7f" });
  }

  function handleBannerSubmit(event) {
    event.preventDefault();
    const form = elements.bannerForm;
    const id = form.elements.id.value;
    const existing = data.banners.find((banner) => banner.id === id);
    const fallback = newProductColors[data.banners.length % newProductColors.length];
    const banner = {
      id: id || dataApi.createId("banner"),
      eyebrow: form.elements.eyebrow.value.trim(),
      title: form.elements.title.value.trim(),
      description: form.elements.description.value.trim(),
      buttonLabel: form.elements.buttonLabel.value.trim(),
      image: currentBannerImage,
      accent: existing?.accent || fallback[0],
      frosting: existing?.frosting || fallback[1],
      cakeColor: existing?.cakeColor || fallback[2],
      active: form.elements.active.checked
    };

    data.banners = existing
      ? data.banners.map((item) => (item.id === id ? banner : item))
      : [...data.banners, banner];
    const result = saveAndRefresh();
    if (!result.ok) {
      setFormMessage(elements.bannerFormMessage, result.error);
      return;
    }
    resetBannerForm();
    setFormMessage(elements.bannerFormMessage, result.warning || "Banner saved.");
  }

  function renderBannerList() {
    if (!data.banners.length) {
      elements.bannerList.innerHTML = `<div class="empty-state"><strong>No banners yet</strong><p>Add a banner for the homepage slider.</p></div>`;
      return;
    }

    elements.bannerList.innerHTML = data.banners
      .map((banner) => `
        <article class="admin-item">
          <img src="${dataApi.escapeHtml(banner.image || dataApi.getProductImage({ name: banner.title, accent: banner.accent }))}" alt="${dataApi.escapeHtml(banner.title)}" />
          <div>
            <strong>${dataApi.escapeHtml(banner.title)}</strong>
            <span>${dataApi.escapeHtml(banner.eyebrow)}</span>
            <p class="admin-item-details">${dataApi.escapeHtml(banner.description)}</p>
            <small>${banner.active === false ? "Hidden from homepage" : "Visible on homepage"}</small>
          </div>
          <div class="item-actions">
            <button class="ghost-button small" type="button" data-banner-action="edit" data-id="${dataApi.escapeHtml(banner.id)}">Edit</button>
            <button class="ghost-button small" type="button" data-banner-action="toggle" data-id="${dataApi.escapeHtml(banner.id)}">${banner.active === false ? "Show" : "Hide"}</button>
            <button class="danger-button small" type="button" data-banner-action="delete" data-id="${dataApi.escapeHtml(banner.id)}">Delete</button>
          </div>
        </article>
      `)
      .join("");
  }

  function handleBannerListClick(event) {
    const button = event.target.closest("[data-banner-action]");
    if (!button) {
      return;
    }

    const banner = data.banners.find((item) => item.id === button.dataset.id);
    if (!banner) {
      return;
    }

    if (button.dataset.bannerAction === "edit") {
      currentBannerImage = banner.image || "";
      elements.bannerFormTitle.textContent = "Edit banner";
      elements.bannerForm.elements.id.value = banner.id;
      elements.bannerForm.elements.eyebrow.value = banner.eyebrow;
      elements.bannerForm.elements.title.value = banner.title;
      elements.bannerForm.elements.description.value = banner.description;
      elements.bannerForm.elements.buttonLabel.value = banner.buttonLabel;
      elements.bannerForm.elements.image.value = "";
      elements.bannerForm.elements.active.checked = banner.active !== false;
      elements.bannerImagePreview.src = banner.image || dataApi.getProductImage({ name: banner.title, accent: banner.accent });
      showPanel("bannersPanel", "Banners");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (button.dataset.bannerAction === "toggle") {
      banner.active = banner.active === false;
      saveAndRefresh();
    }

    if (button.dataset.bannerAction === "delete") {
      const ok = window.confirm(`Delete ${banner.title}?`);
      if (ok) {
        data.banners = data.banners.filter((item) => item.id !== banner.id);
        saveAndRefresh();
        resetBannerForm();
      }
    }
  }

  function resetProductForm() {
    currentProductImage = "";
    setFormMessage(elements.productFormMessage, "");
    elements.productForm.reset();
    elements.productForm.elements.id.value = "";
    elements.productForm.elements.active.checked = true;
    elements.productFormTitle.textContent = "Add product";
    elements.productImagePreview.src = dataApi.getProductImage({ name: "New Cake" });
    renderVariantEditor([
      { kg: "0.5 kg", price: "" },
      { kg: "1 kg", price: "" }
    ]);
  }

  function renderVariantEditor(variants) {
    elements.variantEditor.innerHTML = "";
    variants.forEach((variant) => addVariantRow(variant));
  }

  function addVariantRow(variant) {
    const row = document.createElement("div");
    row.className = "variant-row";
    row.innerHTML = `
      <input class="variant-kg" type="text" placeholder="Example: 1 kg" value="${dataApi.escapeHtml(variant.kg || "")}" required />
      <input class="variant-price" type="number" min="1" step="1" placeholder="Price" value="${dataApi.escapeHtml(variant.price || "")}" required />
      <button class="ghost-button small" type="button" data-variant-remove>Remove</button>
    `;
    elements.variantEditor.appendChild(row);
  }

  function handleVariantClick(event) {
    const button = event.target.closest("[data-variant-remove]");
    if (!button) {
      return;
    }

    if (elements.variantEditor.children.length > 1) {
      button.closest(".variant-row").remove();
    }
  }

  function getVariantValues() {
    return Array.from(elements.variantEditor.querySelectorAll(".variant-row"))
      .map((row) => {
        return {
          kg: row.querySelector(".variant-kg").value.trim(),
          price: Number(row.querySelector(".variant-price").value)
        };
      })
      .filter((variant) => variant.kg && variant.price > 0);
  }

  function handleProductSubmit(event) {
    event.preventDefault();
    const form = elements.productForm;
    const id = form.elements.id.value;
    const variants = getVariantValues();

    if (!variants.length) {
      alert("Please add at least one kg and price row.");
      return;
    }

    setFormMessage(elements.productFormMessage, "Saving...");

    const existing = data.products.find((product) => product.id === id);
    const colorSet = existing ? [existing.accent, existing.frosting, existing.cakeColor] : newProductColors[data.products.length % newProductColors.length];
    const product = {
      id: id || dataApi.createId("cake"),
      name: form.elements.name.value.trim(),
      category: form.elements.category.value.trim(),
      description: form.elements.description.value.trim(),
      details: form.elements.details.value.trim(),
      variants,
      image: currentProductImage,
      accent: colorSet[0],
      frosting: colorSet[1],
      cakeColor: colorSet[2],
      active: form.elements.active.checked
    };

    if (existing) {
      data.products = data.products.map((item) => (item.id === id ? product : item));
    } else {
      data.products.push(product);
    }

    ensureCategory(product.category);
    const result = saveAndRefresh();
    if (!result.ok) {
      setFormMessage(elements.productFormMessage, result.error); // keep the form filled so nothing is lost
      return;
    }
    resetProductForm();
    setFormMessage(elements.productFormMessage, result.warning || `"${product.name}" saved.`);
  }

  function renderProductList() {
    if (!data.products.length) {
      elements.productList.innerHTML = `<div class="empty-state"><strong>No cakes yet</strong><p>Add your first product with the form.</p></div>`;
      return;
    }

    elements.productList.innerHTML = data.products
      .map((product) => {
        const prices = product.variants.map((variant) => dataApi.formatPrice(variant.price)).join(", ");
        return `
          <article class="admin-item">
            <img src="${dataApi.escapeHtml(dataApi.getProductImage(product))}" alt="${dataApi.escapeHtml(product.name)}" />
            <div>
              <strong>${dataApi.escapeHtml(product.name)}</strong>
              <span>${dataApi.escapeHtml(product.category)} | ${prices}</span>
              <small>${product.active === false ? "Hidden from website" : "Visible on website"}</small>
            </div>
            <div class="item-actions">
              <button class="ghost-button small" type="button" data-product-action="edit" data-id="${dataApi.escapeHtml(product.id)}">Edit</button>
              <button class="ghost-button small" type="button" data-product-action="toggle" data-id="${dataApi.escapeHtml(product.id)}">${product.active === false ? "Show" : "Hide"}</button>
              <button class="danger-button small" type="button" data-product-action="delete" data-id="${dataApi.escapeHtml(product.id)}">Delete</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function handleProductListClick(event) {
    const button = event.target.closest("[data-product-action]");
    if (!button) {
      return;
    }

    const product = data.products.find((item) => item.id === button.dataset.id);
    if (!product) {
      return;
    }

    if (button.dataset.productAction === "edit") {
      fillProductForm(product);
    }

    if (button.dataset.productAction === "toggle") {
      product.active = product.active === false;
      saveAndRefresh();
    }

    if (button.dataset.productAction === "delete") {
      const ok = window.confirm(`Delete ${product.name}?`);
      if (ok) {
        data.products = data.products.filter((item) => item.id !== product.id);
        saveAndRefresh();
        resetProductForm();
      }
    }
  }

  function fillProductForm(product) {
    currentProductImage = product.image || "";
    elements.productFormTitle.textContent = "Edit product";
    elements.productForm.elements.id.value = product.id;
    elements.productForm.elements.name.value = product.name;
    elements.productForm.elements.category.value = product.category;
    elements.productForm.elements.description.value = product.description;
    elements.productForm.elements.details.value = product.details || "";
    elements.productForm.elements.active.checked = product.active !== false;
    elements.productForm.elements.image.value = "";
    elements.productImagePreview.src = dataApi.getProductImage(product);
    renderVariantEditor(product.variants);
    showPanel("productsPanel", "Products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function ensureCategory(categoryName) {
    const exists = data.categories.some((category) => category.toLowerCase() === categoryName.toLowerCase());
    if (!exists) {
      data.categories.push(categoryName);
    }
  }

  function handleCategorySubmit(event) {
    event.preventDefault();
    const name = elements.categoryForm.elements.name.value.trim();
    if (!name) {
      return;
    }

    ensureCategory(name);
    elements.categoryForm.reset();
    saveAndRefresh();
  }

  function renderCategoryList() {
    elements.categoryList.innerHTML = data.categories
      .map((category) => {
        return `
          <span class="category-pill">
            ${dataApi.escapeHtml(category)}
            <button type="button" aria-label="Remove ${dataApi.escapeHtml(category)}" data-category="${dataApi.escapeHtml(category)}">x</button>
          </span>
        `;
      })
      .join("");
  }

  function handleCategoryClick(event) {
    const button = event.target.closest("[data-category]");
    if (!button) {
      return;
    }

    const category = button.dataset.category;
    const ok = window.confirm(`Remove category ${category}? Products already using it will keep the text.`);
    if (ok) {
      data.categories = data.categories.filter((item) => item !== category);
      saveAndRefresh();
    }
  }

  function renderSpecialVariantEditor(variants) {
    elements.specialVariantEditor.innerHTML = "";
    variants.forEach((variant) => addSpecialVariantRow(variant));
  }

  function addSpecialVariantRow(variant) {
    const row = document.createElement("div");
    row.className = "variant-row";
    row.innerHTML = `
      <input class="variant-kg" type="text" placeholder="Example: 1 kg" value="${dataApi.escapeHtml(variant.kg || "")}" required />
      <input class="variant-price" type="number" min="1" step="1" placeholder="Price" value="${dataApi.escapeHtml(variant.price || "")}" required />
      <button class="ghost-button small" type="button" data-special-variant-remove>Remove</button>
    `;
    elements.specialVariantEditor.appendChild(row);
  }

  function handleSpecialVariantClick(event) {
    const button = event.target.closest("[data-special-variant-remove]");
    if (!button) {
      return;
    }

    if (elements.specialVariantEditor.children.length > 1) {
      button.closest(".variant-row").remove();
    }
  }

  function getSpecialVariantValues() {
    return Array.from(elements.specialVariantEditor.querySelectorAll(".variant-row"))
      .map((row) => {
        return {
          kg: row.querySelector(".variant-kg").value.trim(),
          price: Number(row.querySelector(".variant-price").value)
        };
      })
      .filter((variant) => variant.kg && variant.price > 0);
  }

  function resetSpecialForm() {
    currentSpecialImage = "";
    setFormMessage(elements.specialFormMessage, "");
    elements.specialForm.reset();
    elements.specialForm.elements.id.value = "";
    elements.specialForm.elements.active.checked = true;
    elements.specialFormTitle.textContent = "Add special day item";
    elements.specialImagePreview.src = dataApi.getProductImage({ name: "Special Cake", accent: "#d64f7f" });
    renderSpecialVariantEditor([
      { kg: "0.5 kg", price: "" },
      { kg: "1 kg", price: "" }
    ]);
  }

  function handleSpecialSubmit(event) {
    event.preventDefault();
    const form = elements.specialForm;
    const id = form.elements.id.value;
    const variants = getSpecialVariantValues();

    if (!variants.length) {
      alert("Please add at least one special kg and price row.");
      return;
    }

    setFormMessage(elements.specialFormMessage, "Saving...");

    const existing = data.specials.find((special) => special.id === id);
    const special = {
      id: id || dataApi.createId("special"),
      title: form.elements.title.value.trim(),
      cakeName: form.elements.cakeName.value.trim(),
      dateLabel: form.elements.dateLabel.value.trim(),
      message: form.elements.message.value.trim(),
      category: "Special Day Cakes",
      description: form.elements.description.value.trim(),
      details: form.elements.details.value.trim(),
      variants,
      image: currentSpecialImage,
      accent: existing ? existing.accent : newProductColors[data.specials.length % newProductColors.length][0],
      active: form.elements.active.checked
    };

    if (existing) {
      data.specials = data.specials.map((item) => (item.id === id ? special : item));
    } else {
      data.specials.push(special);
    }

    const result = saveAndRefresh();
    if (!result.ok) {
      setFormMessage(elements.specialFormMessage, result.error);
      return;
    }
    resetSpecialForm();
    setFormMessage(elements.specialFormMessage, result.warning || "Special item saved.");
  }

  function renderSpecialList() {
    if (!data.specials.length) {
      elements.specialList.innerHTML = `<div class="empty-state"><strong>No special day items</strong><p>Add one to start the homepage slider.</p></div>`;
      return;
    }

    elements.specialList.innerHTML = data.specials
      .map((special) => {
        const prices = special.variants
          .map((variant) => `${dataApi.escapeHtml(variant.kg)} ${dataApi.formatPrice(variant.price)}`)
          .join(", ");
        return `
          <article class="admin-item">
            <img src="${dataApi.escapeHtml(special.image || dataApi.getProductImage({ name: special.cakeName, accent: special.accent }))}" alt="${dataApi.escapeHtml(special.cakeName)}" />
            <div>
              <strong>${dataApi.escapeHtml(special.title)}</strong>
              <span>${dataApi.escapeHtml(special.cakeName)} | ${dataApi.escapeHtml(special.dateLabel)}</span>
              <span class="special-price-list">${prices}</span>
              <p class="admin-item-details"><strong>Message:</strong> ${dataApi.escapeHtml(special.message || "")}</p>
              <p class="admin-item-details"><strong>Description:</strong> ${dataApi.escapeHtml(special.description || "")}</p>
              <p class="admin-item-details"><strong>Details:</strong> ${dataApi.escapeHtml(special.details || "")}</p>
              <small>${special.active === false ? "Hidden from slider" : "Visible in slider"}</small>
            </div>
            <div class="item-actions">
              <button class="ghost-button small" type="button" data-special-action="edit" data-id="${dataApi.escapeHtml(special.id)}">Edit</button>
              <button class="ghost-button small" type="button" data-special-action="toggle" data-id="${dataApi.escapeHtml(special.id)}">${special.active === false ? "Show" : "Hide"}</button>
              <button class="danger-button small" type="button" data-special-action="delete" data-id="${dataApi.escapeHtml(special.id)}">Delete</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function handleSpecialListClick(event) {
    const button = event.target.closest("[data-special-action]");
    if (!button) {
      return;
    }

    const special = data.specials.find((item) => item.id === button.dataset.id);
    if (!special) {
      return;
    }

    if (button.dataset.specialAction === "edit") {
      fillSpecialForm(special);
    }

    if (button.dataset.specialAction === "toggle") {
      special.active = special.active === false;
      saveAndRefresh();
    }

    if (button.dataset.specialAction === "delete") {
      const ok = window.confirm(`Delete ${special.title}?`);
      if (ok) {
        data.specials = data.specials.filter((item) => item.id !== special.id);
        saveAndRefresh();
        resetSpecialForm();
      }
    }
  }

  function fillSpecialForm(special) {
    currentSpecialImage = special.image || "";
    elements.specialFormTitle.textContent = "Edit special day item";
    elements.specialForm.elements.id.value = special.id;
    elements.specialForm.elements.title.value = special.title;
    elements.specialForm.elements.cakeName.value = special.cakeName;
    elements.specialForm.elements.dateLabel.value = special.dateLabel;
    elements.specialForm.elements.message.value = special.message;
    elements.specialForm.elements.description.value = special.description || special.message || "";
    elements.specialForm.elements.details.value = special.details || "";
    elements.specialForm.elements.active.checked = special.active !== false;
    elements.specialForm.elements.image.value = "";
    elements.specialImagePreview.src = special.image || dataApi.getProductImage({ name: special.cakeName, accent: special.accent });
    renderSpecialVariantEditor(special.variants || [{ kg: "1 kg", price: "" }]);
    showPanel("specialsPanel", "Special days");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function populateSettingsForm() {
    const form = elements.settingsForm;
    form.elements.bakeryName.value = data.settings.bakeryName;
    form.elements.ownerEmail.value = data.settings.ownerEmail;
    form.elements.phone.value = data.settings.phone || "";
    form.elements.adminPasscode.value = data.settings.adminPasscode;
    form.elements.address.value = data.settings.address || "";
    form.elements.emailPublicKey.value = data.settings.emailjs.publicKey || "";
    form.elements.emailServiceId.value = data.settings.emailjs.serviceId || "";
    form.elements.customerTemplateId.value = data.settings.emailjs.customerTemplateId || "";
    form.elements.ownerTemplateId.value = data.settings.emailjs.ownerTemplateId || "";
  }

  function handleSettingsSubmit(event) {
    event.preventDefault();
    const form = elements.settingsForm;
    data.settings = {
      ...data.settings,
      bakeryName: form.elements.bakeryName.value.trim(),
      ownerEmail: form.elements.ownerEmail.value.trim(),
      phone: form.elements.phone.value.trim(),
      address: form.elements.address.value.trim(),
      adminPasscode: form.elements.adminPasscode.value,
      emailjs: {
        publicKey: form.elements.emailPublicKey.value.trim(),
        serviceId: form.elements.emailServiceId.value.trim(),
        customerTemplateId: form.elements.customerTemplateId.value.trim(),
        ownerTemplateId: form.elements.ownerTemplateId.value.trim()
      }
    };
    const result = saveAndRefresh();
    elements.settingsMessage.textContent = result.ok ? "Settings saved." : "Settings were not saved.";
    setTimeout(() => {
      elements.settingsMessage.textContent = "";
    }, 2500);
  }

  function renderOrderList() {
    if (!data.orders.length) {
      elements.orderList.innerHTML = `<div class="empty-state"><strong>No orders yet</strong><p>New customer orders from the website will appear here.</p></div>`;
      return;
    }

    elements.orderList.innerHTML = data.orders
      .map((order) => {
        const items = order.items
          .map((item) => {
            return `<li>${dataApi.escapeHtml(item.name)} (${dataApi.escapeHtml(item.kg)}) x ${item.qty} - ${dataApi.formatPrice(item.lineTotal)}</li>`;
          })
          .join("");
        const customer = order.customer || {};
        return `
          <article class="order-card">
            <div class="card-head">
              <div>
                <p class="eyebrow">${dataApi.escapeHtml(order.status || "New")}</p>
                <h3>${dataApi.escapeHtml(order.id)}</h3>
              </div>
              <strong>${dataApi.formatPrice(order.total)}</strong>
            </div>
            <p><strong>${dataApi.escapeHtml(customer.name || "")}</strong> | ${dataApi.escapeHtml(customer.phone || "")} | ${dataApi.escapeHtml(customer.email || "")}</p>
            <p>${dataApi.escapeHtml(customer.address || "")}</p>
            <p>${dataApi.escapeHtml(customer.city || "")}, ${dataApi.escapeHtml(customer.state || "")} ${dataApi.escapeHtml(customer.pincode || "")}</p>
            <p>Delivery date: ${dataApi.escapeHtml(customer.deliveryDate || "")}</p>
            <p>Instructions: ${dataApi.escapeHtml(customer.instructions || "None")}</p>
            <ul>${items}</ul>
            <small>${new Date(order.createdAt).toLocaleString()} | ${dataApi.escapeHtml(order.paymentMethod)}</small>
          </article>
        `;
      })
      .join("");
  }

  function handleClearOrders() {
    if (!data.orders.length) {
      return;
    }

    const ok = window.confirm("Clear all saved orders from this browser?");
    if (ok) {
      data.orders = [];
      saveAndRefresh();
    }
  }

  function handleResetData() {
    const ok = window.confirm("Reset products, categories, specials, orders, and settings to demo data?");
    if (ok) {
      data = dataApi.reset();
      resetProductForm();
      resetSpecialForm();
      refreshAll();
      elements.settingsMessage.textContent = "Demo data restored.";
    }
  }

  function normalizeImageUrl(value) {
    let url = String(value || "").trim();
    if (!url) { return ""; }
    const driveMatch = url.match("/drive\.google\.com\/file\/d\/([^/]+)");
    if (driveMatch) { url = "https://drive.google.com/uc?export=view&id=" + driveMatch[1]; }
    return url;
  }

  function applyImageUrlInput(value, setImage, previewElement, fallbackItem) {
    const url = normalizeImageUrl(value);
    const usable = RegExp("^https?://").test(url);
    setImage(usable ? url : "");
    previewElement.src = usable ? url : dataApi.getProductImage(fallbackItem);
  }

  function handleProductImageUrlInput(event) {
    applyImageUrlInput(event.target.value, (url) => { currentProductImage = url; }, elements.productImagePreview, { name: "New Cake" });
  }

  function handleSpecialImageUrlInput(event) {
    applyImageUrlInput(event.target.value, (url) => { currentSpecialImage = url; }, elements.specialImagePreview, { name: "Special Cake", accent: "#d64f7f" });
  }

  function handleBannerImageUrlInput(event) {
    applyImageUrlInput(event.target.value, (url) => { currentBannerImage = url; }, elements.bannerImagePreview, { name: "Banner", accent: "#d64f7f" });
  }

  function drawScaledCanvas(sourceWidth, sourceHeight, draw) {
    // Phone photos are 2-5 MB, but browser storage only holds ~5 MB TOTAL.
    // Downscale to 900px and re-encode as JPEG so a whole photo catalog fits.
    const maxSide = 900;
    const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    draw(context, width, height);
    return canvas.toDataURL("image/jpeg", 0.75);
  }

  function compressImageFile(file, dataUrl) {
    // createImageBitmap is missing/throws on some browsers (older iOS Safari),
    // so fall back to a plain <img> decode. Either way, oversized raw data
    // URLs must never be stored.
    return new Promise((resolve) => {
      const finish = (value) => resolve(typeof value === "string" && value.startsWith("data:") ? value : dataUrl);

      const tryBitmap = typeof window.createImageBitmap === "function"
        ? window.createImageBitmap(file)
            .then((bitmap) => {
              const result = drawScaledCanvas(bitmap.width, bitmap.height, (context, width, height) => context.drawImage(bitmap, 0, 0, width, height));
              bitmap.close?.();
              return result;
            })
        : Promise.reject(new Error("createImageBitmap unavailable"));

      const tryImageElement = () => new Promise((imgResolve, imgReject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
          URL.revokeObjectURL(url);
          try {
            imgResolve(drawScaledCanvas(image.naturalWidth, image.naturalHeight, (context, width, height) => context.drawImage(image, 0, 0, width, height)));
          } catch (error) {
            imgReject(error);
          }
        };
        image.onerror = () => {
          URL.revokeObjectURL(url);
          imgReject(new Error("image decode failed"));
        };
        image.src = url;
      });

      tryBitmap
        .catch(() => tryImageElement())
        .then((result) => finish(result))
        .catch(() => finish(dataUrl));
    });
  }

  function readImage(file, onLoad) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const dataUrl = String(reader.result || "");
      compressImageFile(file, dataUrl).then((compressed) => {
        const chosen = compressed.length < dataUrl.length ? compressed : dataUrl;
        if (chosen.length > 1024 * 1024) {
          alert("This image is still very large after compression and may not save. Try a different photo, or use an image link (URL) instead of an upload.");
        }
        onLoad(chosen);
      });
    });
    reader.readAsDataURL(file);
  }

  function recompressStoredImage(dataUrl) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        try {
          const result = drawScaledCanvas(image.naturalWidth, image.naturalHeight, (context, width, height) => context.drawImage(image, 0, 0, width, height));
          resolve(result && result.length < dataUrl.length ? result : null);
        } catch (error) {
          resolve(null);
        }
      };
      image.onerror = () => resolve(null);
      image.src = dataUrl;
    });
  }

  function migrateStoredImages() {
    // Storage filled up with full-size base64 images before compression was
    // added. Shrink any stored image over ~400 KB once so saves stop failing.
    const LIMIT = 400 * 1024;
    const jobs = [];
    let changed = 0;
    [data.products, data.specials, data.banners].forEach((items) => {
      items.forEach((item) => {
        const image = item && typeof item.image === "string" ? item.image : "";
        if (!image.startsWith("data:image/") || image.length <= LIMIT) {
          return;
        }
        jobs.push(
          recompressStoredImage(image).then((compressed) => {
            if (compressed) {
              item.image = compressed;
              changed += 1;
            }
          })
        );
      });
    });
    if (!jobs.length) {
      return;
    }
    console.info(`Bakery admin: shrinking ${jobs.length} oversized stored image(s)...`);
    Promise.all(jobs).then(() => {
      if (!changed) {
        return;
      }
      const result = dataApi.save(data);
      if (result.ok) {
        console.info(`Bakery admin: ${changed} image(s) recompressed to free storage space.`);
        refreshAll();
      }
    });
  }

  function saveAndRefresh() {
    const result = dataApi.save(data);
    refreshAll();
    if (!result.ok) {
      alert(result.error);
    } else if (result.warning) {
      alert(result.warning);
    }
    syncToCloud();
    return result;
  }

  let cloudSyncTimer = 0;
  function syncToCloud() {
    clearTimeout(cloudSyncTimer);
    cloudSyncTimer = setTimeout(async () => {
      try {
        data.settings.catalogUpdatedAt = new Date().toISOString();
        dataApi.save(data);
        const passcode = data.settings.adminPasscode || "owner123";
        const result = await dataApi.pushCloudData(data, passcode);
        if (result && result.ok) {
          console.info("Catalog synced to cloud.");
        } else if (result && result.error) {
          console.warn("Catalog cloud sync failed:", result.error);
        }
      } catch (error) {
        // offline or server down - local save already succeeded
      }
    }, 600);
  }

  init();
})();
