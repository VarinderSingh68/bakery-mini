(function () {
  "use strict";

  const dataApi = window.BakeryData;
  let data = dataApi.load();
  let cart = dataApi.getCart();
  const selectedVariants = {};
  let activeSpecialId = "";
  let selectedSpecialVariantIndex = 0;
  let activeBannerIndex = 0;
  let bannerTimer;
  let catalogRefreshTimer;
  let productSearchTerm = "";
  let categoriesInitialized = false;
  const openCategories = new Set();

  const elements = {
    productGrid: document.getElementById("productGrid"),
    specialTrack: document.getElementById("specialTrack"),
    specialPreview: document.getElementById("specialPreview"),
    specialPreviewClose: document.getElementById("specialPreviewClose"),
    specialPreviewImage: document.getElementById("specialPreviewImage"),
    specialPreviewDate: document.getElementById("specialPreviewDate"),
    specialPreviewTitle: document.getElementById("specialPreviewTitle"),
    specialPreviewCakeName: document.getElementById("specialPreviewCakeName"),
    specialPreviewCategory: document.getElementById("specialPreviewCategory"),
    specialPreviewMessage: document.getElementById("specialPreviewMessage"),
    specialPreviewDetails: document.getElementById("specialPreviewDetails"),
    specialVariantOptions: document.getElementById("specialVariantOptions"),
    addSpecialToCart: document.getElementById("addSpecialToCart"),
    heroCake: document.getElementById("heroCake"),
    heroEyebrow: document.getElementById("heroEyebrow"),
    heroTitle: document.getElementById("heroTitle"),
    heroDescription: document.getElementById("heroDescription"),
    heroCta: document.getElementById("heroCta"),
    heroDots: document.getElementById("heroDots"),
    heroPrevious: document.getElementById("heroPrevious"),
    heroNext: document.getElementById("heroNext"),
    openCart: document.getElementById("openCart"),
    closeCart: document.getElementById("closeCart"),
    cartDrawer: document.getElementById("cartDrawer"),
    cartItems: document.getElementById("cartItems"),
    cartCount: document.getElementById("cartCount"),
    cartTotal: document.getElementById("cartTotal"),
    checkoutForm: document.getElementById("checkoutForm"),
    addonList: document.getElementById("addonList"),
    checkoutMessage: document.getElementById("checkoutMessage"),
    placeOrder: document.getElementById("placeOrder"),
    footerContact: document.getElementById("footerContact"),
    productSearch: document.getElementById("productSearch"),
    kgFilter: document.getElementById("kgFilter"),
    catalogCount: document.getElementById("catalogCount")
  };

  function init() {
    pullCloudThenRender();
    renderBrand();
    renderHero();
    renderSpecials();
    renderProducts();
    renderCart();
    renderAddOns();
    bindEvents();
    startCatalogRefresh();
  }

  function activeProducts() {
    return data.products.filter((product) => product.active !== false);
  }

  async function pullCloudThenRender() {
    // Pull the shared catalog from the server (if any device saved one) and
    // re-render so every phone shows the same menu as the admin panel.
    try {
      const cloud = await dataApi.pullCloudData();
      if (cloud) {
        data = cloud;
        cart = dataApi.getCart();
        activeBannerIndex = 0;
        renderBrand();
        renderHero();
        renderSpecials();
        renderProducts();
        renderAddOns();
        closeSpecialPreview();
      }
    } catch (error) {
      // offline or static hosting - local catalog already rendered
    }
  }

  function startCatalogRefresh() {
    window.clearInterval(catalogRefreshTimer);
    catalogRefreshTimer = window.setInterval(pullCloudThenRender, 60000);
    window.addEventListener("focus", pullCloudThenRender);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        pullCloudThenRender();
      }
    });
  }

  function renderBrand() {
    const settings = data.settings;
    document.title = settings.bakeryName;
    document.querySelectorAll("[data-brand-name], [data-brand-heading], [data-brand-footer]").forEach((node) => {
      node.textContent = settings.bakeryName;
    });
    elements.footerContact.textContent = `${settings.phone || ""} ${settings.address ? " | " + settings.address : ""}`;
  }

  function renderHero() {
    const banners = (data.banners || []).filter((banner) => banner.active !== false);
    if (!banners.length) {
      return;
    }

    elements.heroDots.innerHTML = banners
      .map((banner, index) => `<button class="hero-dot ${index === activeBannerIndex ? "active" : ""}" type="button" data-banner-index="${index}" aria-label="Show ${dataApi.escapeHtml(banner.title)}"></button>`)
      .join("");
    elements.heroDots.querySelectorAll("[data-banner-index]").forEach((dot) => {
      dot.addEventListener("click", () => showBanner(Number(dot.dataset.bannerIndex)));
    });
    showBanner(activeBannerIndex, banners);
    window.clearInterval(bannerTimer);
    bannerTimer = window.setInterval(() => showBanner(activeBannerIndex + 1, banners), 5000);
  }

  function showBanner(index, banners = (data.banners || []).filter((banner) => banner.active !== false)) {
    if (!banners.length) {
      return;
    }

    activeBannerIndex = (index + banners.length) % banners.length;
    const banner = banners[activeBannerIndex];
    elements.heroEyebrow.textContent = banner.eyebrow;
    // Render the last word of the title as an italic gold accent — the small
    // typographic flourish that makes the hero feel like a luxury brand.
    const titleWords = String(banner.title || "").split(/\s+/);
    const accent = titleWords.length > 1 ? titleWords.pop() : "";
    elements.heroTitle.innerHTML =
      dataApi.escapeHtml(titleWords.join(" ")) + (accent ? " <em>" + dataApi.escapeHtml(accent) + "</em>" : "");
    elements.heroDescription.textContent = banner.description;
    elements.heroCta.textContent = banner.buttonLabel;
    elements.heroCta.href = "#cakes";
    elements.heroCake.classList.add("changing");
    window.setTimeout(() => {
      elements.heroCake.src = banner.image || dataApi.getProductImage({
        name: banner.title,
        accent: banner.accent,
        frosting: banner.frosting,
        cakeColor: banner.cakeColor
      });
      elements.heroCake.alt = banner.title;
      elements.heroCake.classList.remove("changing");
    }, 140);
    elements.heroDots.querySelectorAll(".hero-dot").forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === activeBannerIndex);
    });
  }

  function getSpecialImage(special) {
    return special.image || dataApi.getProductImage({
      name: special.cakeName,
      accent: special.accent || "#b23a48",
      frosting: "#fff1f3",
      cakeColor: "#7b2d26"
    });
  }

  function renderSpecials() {
    const specials = data.specials.filter((special) => special.active !== false);
    const strip = document.querySelector(".special-strip");

    if (!specials.length) {
      strip.hidden = true;
      return;
    }

    strip.hidden = false;
    const slides = [...specials, ...specials];
    elements.specialTrack.innerHTML = slides
      .map((special) => {
        const image = getSpecialImage(special);
        const firstVariant = special.variants[0] || { kg: "1 kg", price: 0 };

        return `
          <article
            class="special-card"
            role="button"
            tabindex="0"
            data-special-id="${dataApi.escapeHtml(special.id)}"
            aria-label="Preview ${dataApi.escapeHtml(special.cakeName)}"
          >
            <img src="${dataApi.escapeHtml(image)}" alt="${dataApi.escapeHtml(special.cakeName)}" />
            <div>
              <span>${dataApi.escapeHtml(special.dateLabel)}</span>
              <strong>${dataApi.escapeHtml(special.title)}</strong>
              <p>${dataApi.escapeHtml(special.message)}</p>
              <b>From ${dataApi.formatPrice(firstVariant.price)} | ${dataApi.escapeHtml(firstVariant.kg)}</b>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function hasVariantKg(product, kg) {
    const target = Number(kg);
    return (product.variants || []).some((variant) => Math.abs(parseFloat(variant.kg) - target) < 0.01);
  }

  function renderProducts() {
    const products = activeProducts();
    const filteredProducts = products.filter((product) => {
      if (!productSearchTerm) {
        return true;
      }
      const searchableText = [product.name, product.category, product.description, product.details]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchableText.includes(productSearchTerm);
    });

    const filterLabel = "";
    elements.catalogCount.textContent = productSearchTerm
      ? `${filteredProducts.length} of ${products.length} items found`
      : `${products.length} items available`;

    // Group the filtered cakes by their category, preserving the category
    // order managed in the admin panel.
    const order = (data.categories || []).map((name) => name.toLowerCase());
    const groups = new Map();
    filteredProducts.forEach((product) => {
      const name = (product.category || "More Cakes").trim() || "More Cakes";
      const key = name.toLowerCase();
      if (!groups.has(key)) {
        groups.set(key, { name, order: order.indexOf(key), items: [] });
      }
      groups.get(key).items.push(product);
    });

    const sections = Array.from(groups.values()).sort((a, b) => {
      const rankA = a.order === -1 ? 999 : a.order;
      const rankB = b.order === -1 ? 999 : b.order;
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return a.name.localeCompare(b.name);
    });

    // Show every category from the admin list even when it has no cakes yet
    // (a brand-new flavor reads as "coming soon" instead of vanishing).
    if (!productSearchTerm) {
      (data.categories || []).forEach((name, rank) => {
        const key = String(name).trim().toLowerCase();
        if (!groups.has(key)) {
          sections.push({ name: String(name).trim(), order: rank, items: [] });
        }
      });
    }

    const searchActive = Boolean(productSearchTerm);

    if (!categoriesInitialized) {
      categoriesInitialized = true;
      if (!searchActive && sections.length) {
        openCategories.add(sections[0].name.toLowerCase());
      }
    }

    if (!filteredProducts.length) {
      elements.productGrid.innerHTML = `
        <div class="empty-state catalog-empty">
          <strong>No items found</strong>
          <p>Try another item name, flavor, or category.</p>
        </div>
      `;
      return;
    }

    let staggerIndex = 0;
    elements.productGrid.innerHTML = sections
      .map((section, sectionIndex) => {
        const key = section.name.toLowerCase();
        const isOpen = searchActive ? true : openCategories.has(key);
        // Empty categories still get art: generate a default cake image from
        // the category name so the header never shows a broken icon.
        const thumb = dataApi.getProductImage(section.items[0] || { name: section.name });
        const isCustom = section.name.trim().toLowerCase() === "customized cakes";
        const deliveryTag = isCustom ? "" : `<span class="category-delivery">60 min delivery</span>`;
        const countLabel = section.items.length
          ? `${section.items.length} ${section.items.length === 1 ? "item" : "items"}`
          : "Coming soon";
        const cards = section.items.length
          ? section.items.map((product) => productCardTemplate(product, staggerIndex++)).join("")
          : `<p class="category-empty-note">Fresh bakes are landing in this dropdown soon.</p>`;
        return `
          <section class="category-block ${isOpen ? "open" : ""}" data-category-name="${dataApi.escapeHtml(section.name)}">
            <button class="category-head" type="button" data-category-toggle aria-expanded="${isOpen}" aria-controls="categoryBody${sectionIndex}">
              <img class="category-thumb" src="${dataApi.escapeHtml(thumb)}" alt="" loading="lazy" />
              <h3>${dataApi.escapeHtml(section.name)}</h3>
              <span class="category-head-meta">
                ${deliveryTag}
                <span class="category-count">${countLabel}</span>
              </span>
              <span class="category-chevron" aria-hidden="true">&#9662;</span>
            </button>
            <div class="category-body" id="categoryBody${sectionIndex}">
              <div class="category-body-inner">
                <div class="product-grid">${cards}</div>
              </div>
            </div>
          </section>
        `;
      })
      .join("");

    revealCards();
  }

  function productCardTemplate(product, index) {
    const variants = Array.isArray(product.variants) && product.variants.length ? product.variants : [];
    const selectedIndex = selectedVariants[product.id] ?? 0;
    const selected = variants[selectedIndex] || variants[0] || { kg: "1 kg", price: 0 };
    const variantsHtml = variants
      .map((variant, variantIndex) => {
        const isActive = variantIndex === selectedIndex ? "active" : "";
        return `
          <button
            class="kg-option ${isActive}"
            type="button"
            data-action="variant"
            data-product-id="${dataApi.escapeHtml(product.id)}"
            data-variant-index="${variantIndex}"
          >
            <span>${dataApi.escapeHtml(variant.kg)}</span>
            <strong>${dataApi.formatPrice(variant.price)}</strong>
          </button>
        `;
      })
      .join("");

    return `
      <article class="product-card reveal" style="--delay: ${Math.min(index * 35, 420)}ms">
        <img class="product-image" src="${dataApi.escapeHtml(dataApi.getProductImage(product))}" alt="${dataApi.escapeHtml(product.name)}" />
        <div class="product-body">
          <p class="category-label">${dataApi.escapeHtml(product.category)}</p>
          <h3>${dataApi.escapeHtml(product.name)}</h3>
          <p>${dataApi.escapeHtml(product.description)}</p>
          <p class="details-line">${dataApi.escapeHtml(product.details || "")}</p>
          <div class="kg-options" aria-label="Cake size and price">
            ${variantsHtml}
          </div>
          <div class="product-action">
            <span>${dataApi.escapeHtml(selected.kg)} starts here</span>
            ${productActionHtml(product, selected)}
          </div>
        </div>
      </article>
    `;
  }

  function popConfetti(originEl) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const rect = originEl.getBoundingClientRect();
    const colors = ["#2e7d3a", "#46a05a", "#72b84a", "#f7c948", "#1f3527", "#d9f0de"];
    const burst = document.createElement("div");
    burst.className = "confetti-burst";
    burst.setAttribute("aria-hidden", "true");
    burst.style.left = `${rect.left + rect.width / 2}px`;
    burst.style.top = `${rect.top + rect.height / 2}px`;

    for (let i = 0; i < 12; i += 1) {
      const bit = document.createElement("i");
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
      const dist = 46 + Math.random() * 34;
      bit.style.setProperty("--dx", `${Math.round(Math.cos(angle) * dist)}px`);
      bit.style.setProperty("--dy", `${Math.round(Math.sin(angle) * dist - 26)}px`);
      bit.style.setProperty("--rot", `${Math.round(Math.random() * 420 - 210)}deg`);
      bit.style.background = colors[i % colors.length];
      if (i % 3 === 0) {
        bit.style.borderRadius = "50%";
      }
      burst.appendChild(bit);
    }

    document.body.appendChild(burst);
    window.setTimeout(() => burst.remove(), 520);
  }

  function productActionHtml(product, selected) {
    const key = findCartKey(product.id);
    const qty = key ? cart.find((item) => item.key === key)?.qty || 0 : 0;

    if (!qty) {
      return `
        <button class="primary-button" type="button" data-action="add" data-product-id="${dataApi.escapeHtml(product.id)}">
          Add ${dataApi.formatPrice(selected.price)}
        </button>
      `;
    }

    return `
      <div class="qty-stepper" role="group" aria-label="${dataApi.escapeHtml(product.name)} quantity">
        <button type="button" data-action="decrease" data-product-id="${dataApi.escapeHtml(product.id)}" aria-label="Remove one">−</button>
        <span>${qty}</span>
        <button type="button" data-action="increase" data-product-id="${dataApi.escapeHtml(product.id)}" aria-label="Add one more">+</button>
      </div>
    `;
  }

  function bindEvents() {
    elements.productGrid.addEventListener("click", handleProductClick);
    elements.productGrid.addEventListener("click", handleCategoryToggle);
    elements.specialTrack.addEventListener("click", handleSpecialTrackClick);
    elements.specialTrack.addEventListener("keydown", handleSpecialTrackKeydown);
    elements.specialPreview.addEventListener("click", handleSpecialPreviewClick);
    elements.specialPreviewClose.addEventListener("click", closeSpecialPreview);
    elements.addSpecialToCart.addEventListener("click", addPreviewSpecialToCart);
    elements.openCart.addEventListener("click", openCart);
    elements.closeCart.addEventListener("click", closeCart);
    elements.cartDrawer.addEventListener("click", handleDrawerClick);
    elements.cartItems.addEventListener("click", handleCartClick);
    elements.checkoutForm.addEventListener("submit", placeOrder);
    elements.addonList.addEventListener("click", handleAddonClick);
    elements.productSearch.addEventListener("input", (event) => {
      productSearchTerm = event.target.value.trim().toLowerCase();
      renderProducts();
    });
    elements.heroPrevious.addEventListener("click", () => showBanner(activeBannerIndex - 1));
    elements.heroNext.addEventListener("click", () => showBanner(activeBannerIndex + 1));

    window.addEventListener("storage", (event) => {
      if (event.key === dataApi.STORAGE_KEY) {
        data = dataApi.load();
        renderBrand();
        renderHero();
        renderSpecials();
        renderProducts();
        renderAddOns();
        renderHero();
        closeSpecialPreview();
      }
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeSpecialPreview();
      }
    });
  }

  function handleCategoryToggle(event) {
    const head = event.target.closest("[data-category-toggle]");
    if (!head) {
      return;
    }

    const block = head.closest(".category-block");
    if (!block) {
      return;
    }

    const key = (block.dataset.categoryName || "").toLowerCase();
    const willOpen = !block.classList.contains("open");
    block.classList.toggle("open", willOpen);
    head.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) {
      openCategories.add(key);
    } else {
      openCategories.delete(key);
    }
  }

  function handleSpecialTrackClick(event) {
    const card = event.target.closest("[data-special-id]");
    if (!card) {
      return;
    }

    openSpecialPreview(card.dataset.specialId);
  }

  function handleSpecialTrackKeydown(event) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const card = event.target.closest("[data-special-id]");
    if (!card) {
      return;
    }

    event.preventDefault();
    openSpecialPreview(card.dataset.specialId);
  }

  function openSpecialPreview(specialId) {
    const special = data.specials.find((item) => item.id === specialId);
    if (!special) {
      return;
    }

    activeSpecialId = specialId;
    selectedSpecialVariantIndex = 0;
    renderSpecialPreview(special);
    elements.specialPreview.classList.add("open");
    elements.specialPreview.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
  }

  function closeSpecialPreview() {
    elements.specialPreview.classList.remove("open");
    elements.specialPreview.setAttribute("aria-hidden", "true");
    if (!elements.cartDrawer.classList.contains("open")) {
      document.body.classList.remove("drawer-open");
    }
  }

  function renderSpecialPreview(special) {
    const variants = special.variants || [];
    const selected = variants[selectedSpecialVariantIndex] || variants[0] || { kg: "1 kg", price: 0 };

    elements.specialPreviewImage.src = getSpecialImage(special);
    elements.specialPreviewImage.alt = special.cakeName;
    elements.specialPreviewDate.textContent = special.dateLabel;
    elements.specialPreviewTitle.textContent = special.title;
    elements.specialPreviewCakeName.textContent = special.cakeName;
    elements.specialPreviewCategory.textContent = special.category || "Special Day Cakes";
    elements.specialPreviewMessage.textContent = special.description || special.message;
    elements.specialPreviewDetails.textContent = special.details || special.message;
    elements.addSpecialToCart.textContent = `Add ${selected.kg} - ${dataApi.formatPrice(selected.price)}`;
    elements.addSpecialToCart.disabled = !variants.length;

    elements.specialVariantOptions.innerHTML = variants
      .map((variant, index) => {
        const isActive = index === selectedSpecialVariantIndex ? "active" : "";
        return `
          <button
            class="kg-option ${isActive}"
            type="button"
            data-preview-variant-index="${index}"
          >
            <span>${dataApi.escapeHtml(variant.kg)}</span>
            <strong>${dataApi.formatPrice(variant.price)}</strong>
          </button>
        `;
      })
      .join("");
  }

  function handleSpecialPreviewClick(event) {
    if (event.target === elements.specialPreview) {
      closeSpecialPreview();
      return;
    }

    const variantButton = event.target.closest("[data-preview-variant-index]");
    if (!variantButton) {
      return;
    }

    const special = data.specials.find((item) => item.id === activeSpecialId);
    if (!special) {
      return;
    }

    selectedSpecialVariantIndex = Number(variantButton.dataset.previewVariantIndex);
    renderSpecialPreview(special);
  }

  function addPreviewSpecialToCart() {
    const special = data.specials.find((item) => item.id === activeSpecialId);
    if (!special) {
      return;
    }

    addSpecialToCart(special);
  }

  function handleProductClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const productId = button.dataset.productId;
    const product = data.products.find((item) => item.id === productId);
    if (!product) {
      return;
    }

    if (button.dataset.action === "variant") {
      selectedVariants[productId] = Number(button.dataset.variantIndex);
      renderProducts();
      return;
    }

    if (button.dataset.action === "add") {
      popConfetti(button);
      addToCart(product);
      return;
    }

    if (button.dataset.action === "increase" || button.dataset.action === "decrease") {
      const key = findCartKey(productId);
      if (key) {
        changeCartQty(key, button.dataset.action === "increase" ? 1 : -1);
      }
    }
  }

  function addSpecialToCart(special) {
    const variant = special.variants[selectedSpecialVariantIndex] || special.variants[0];
    if (!variant) {
      return;
    }

    const key = `special:${special.id}:${variant.kg}:${variant.price}`;
    const existing = cart.find((item) => item.key === key);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        key,
        specialId: special.id,
        name: special.cakeName,
        specialTitle: special.title,
        image: getSpecialImage(special),
        kg: variant.kg,
        price: Number(variant.price) || 0,
        qty: 1
      });
    }

    dataApi.saveCart(cart);
    renderCart();
    closeSpecialPreview();
    openCart();
  }

  function findCartKey(productId) {
    const variantIndex = selectedVariants[productId] ?? 0;
    const product = data.products.find((item) => item.id === productId);
    const variant = product && (product.variants[variantIndex] || product.variants[0]);
    if (!variant) {
      return null;
    }
    return `${productId}:${variant.kg}:${variant.price}`;
  }

  function addToCart(product) {
    const variantIndex = selectedVariants[product.id] ?? 0;
    const variant = product.variants[variantIndex] || product.variants[0];
    if (!variant) {
      return;
    }

    const key = `${product.id}:${variant.kg}:${variant.price}`;
    const existing = cart.find((item) => item.key === key);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        key,
        productId: product.id,
        kg: variant.kg,
        price: Number(variant.price) || 0,
        qty: 1
      });
    }

    dataApi.saveCart(cart);
    renderCart();
  }

  function changeCartQty(key, delta) {
    const item = cart.find((entry) => entry.key === key);
    if (!item) {
      return;
    }

    item.qty += delta;

    if (item.qty <= 0) {
      cart = cart.filter((entry) => entry.key !== key);
    }

    dataApi.saveCart(cart);
    renderCart();
  }

  function updateAllProductActions() {
    elements.productGrid.querySelectorAll(".product-card").forEach((card) => {
      const marker = card.querySelector("[data-product-id]");
      if (marker) {
        updateProductAction(marker.dataset.productId);
      }
    });
  }

  function updateProductAction(productId) {
    const product = data.products.find((item) => item.id === productId);
    if (!product) {
      return;
    }

    const variantIndex = selectedVariants[productId] ?? 0;
    const selected = product.variants[variantIndex] || product.variants[0] || { kg: "1 kg", price: 0 };
    const attribute = dataApi.escapeHtml(productId);
    const marker = elements.productGrid.querySelector(`[data-product-id="${attribute}"]`);
    const card = marker ? marker.closest(".product-card") : null;
    if (!card) {
      return;
    }

    const action = card.querySelector(".product-action");
    if (action) {
      action.innerHTML = `
        <span>${dataApi.escapeHtml(selected.kg)} starts here</span>
        ${productActionHtml(product, selected)}
      `;
    }
  }

  function renderAddOns() {
    const addOns = (data.addOns || []).filter((addOn) => addOn.active !== false);
    elements.addonList.innerHTML = addOns
      .map((addOn) => {
        const image = dataApi.getProductImage(addOn);
        return `
          <article class="addon-card">
            <img src="${dataApi.escapeHtml(image)}" alt="${dataApi.escapeHtml(addOn.name)}" />
            <div class="addon-copy">
              <strong>${dataApi.escapeHtml(addOn.name)}</strong>
              <p>${dataApi.escapeHtml(addOn.description)}</p>
              <span>${dataApi.formatPrice(addOn.price)}</span>
            </div>
            <button class="ghost-button small addon-add" type="button" data-addon-id="${dataApi.escapeHtml(addOn.id)}">Add</button>
          </article>
        `;
      })
      .join("");
  }

  function handleAddonClick(event) {
    const button = event.target.closest("[data-addon-id]");
    if (!button) {
      return;
    }

    const addOn = (data.addOns || []).find((item) => item.id === button.dataset.addonId);
    if (!addOn) {
      return;
    }

    const key = `addon:${addOn.id}`;
    const existing = cart.find((item) => item.key === key);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        key,
        addonId: addOn.id,
        name: addOn.name,
        addonCategory: "Party extra",
        image: dataApi.getProductImage(addOn),
        kg: "1 set",
        price: Number(addOn.price) || 0,
        qty: 1
      });
    }

    dataApi.saveCart(cart);
    renderCart();
    button.textContent = "Added";
    window.setTimeout(() => {
      button.textContent = "Add";
    }, 1200);
  }

  function renderCart() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const total = cartTotal();
    const previousCount = elements.cartCount.textContent;
    elements.cartCount.textContent = String(count);
    elements.cartTotal.textContent = dataApi.formatPrice(total);
    elements.placeOrder.disabled = cart.length === 0;

    if (previousCount !== String(count)) {
      elements.cartCount.classList.remove("pop");
      void elements.cartCount.offsetWidth;
      elements.cartCount.classList.add("pop");
    }

    updateAllProductActions();

    if (!cart.length) {
      elements.cartItems.innerHTML = `
        <div class="empty-state">
          <strong>Your cart is empty</strong>
          <p>Add a cake from the menu to place your order.</p>
        </div>
      `;
      return;
    }

    elements.cartItems.innerHTML = cart
      .map((item) => {
        const product = item.productId ? data.products.find((entry) => entry.id === item.productId) : null;
        const special = item.specialId ? data.specials.find((entry) => entry.id === item.specialId) : null;
        const name = product ? product.name : item.name || special?.cakeName || "Cake";
        const image = product ? dataApi.getProductImage(product) : item.image || (special ? getSpecialImage(special) : dataApi.getProductImage({ name }));
        const label = item.specialTitle || item.addonCategory || special?.title || "Cake menu";
        return `
          <article class="cart-item">
            <img src="${dataApi.escapeHtml(image)}" alt="${dataApi.escapeHtml(name)}" />
            <div>
              <strong>${dataApi.escapeHtml(name)}</strong>
              <span>${dataApi.escapeHtml(label)} | ${dataApi.escapeHtml(item.kg)} | ${dataApi.formatPrice(item.price)}</span>
              <div class="qty-control" aria-label="Quantity controls">
                <button type="button" data-cart-action="decrease" data-key="${dataApi.escapeHtml(item.key)}">-</button>
                <span>${item.qty}</span>
                <button type="button" data-cart-action="increase" data-key="${dataApi.escapeHtml(item.key)}">+</button>
                <button class="remove-button" type="button" data-cart-action="remove" data-key="${dataApi.escapeHtml(item.key)}">Remove</button>
              </div>
            </div>
            <strong>${dataApi.formatPrice(item.price * item.qty)}</strong>
          </article>
        `;
      })
      .join("");
  }

  function cartTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function handleCartClick(event) {
    const button = event.target.closest("button[data-cart-action]");
    if (!button) {
      return;
    }

    const item = cart.find((entry) => entry.key === button.dataset.key);
    if (!item) {
      return;
    }

    if (button.dataset.cartAction === "increase") {
      item.qty += 1;
    }

    if (button.dataset.cartAction === "decrease") {
      item.qty -= 1;
    }

    if (button.dataset.cartAction === "remove" || item.qty <= 0) {
      cart = cart.filter((entry) => entry.key !== item.key);
    }

    dataApi.saveCart(cart);
    renderCart();
  }

  function openCart() {
    elements.cartDrawer.classList.add("open");
    elements.cartDrawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
  }

  function closeCart() {
    elements.cartDrawer.classList.remove("open");
    elements.cartDrawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("drawer-open");
  }

  function handleDrawerClick(event) {
    if (event.target === elements.cartDrawer) {
      closeCart();
    }
  }

  async function placeOrder(event) {
    event.preventDefault();

    if (!cart.length) {
      elements.checkoutMessage.textContent = "Please add at least one cake before checkout.";
      return;
    }

    elements.placeOrder.disabled = true;
    elements.placeOrder.textContent = "Placing order...";
    elements.checkoutMessage.textContent = "";

    const formData = new FormData(elements.checkoutForm);
    const customer = Object.fromEntries(formData.entries());
    const items = cart.map((item) => {
      const product = item.productId ? data.products.find((entry) => entry.id === item.productId) : null;
      const special = item.specialId ? data.specials.find((entry) => entry.id === item.specialId) : null;
      const name = product ? product.name : item.name || special?.cakeName || "Cake";
      return {
        productId: item.productId || "",
        specialId: item.specialId || "",
        name,
        specialTitle: item.specialTitle || special?.title || "",
        kg: item.kg,
        price: item.price,
        qty: item.qty,
        lineTotal: item.price * item.qty
      };
    });

    const order = {
      id: dataApi.createOrderId(),
      createdAt: new Date().toISOString(),
      status: "New",
      paymentMethod: "Order payment",
      customer,
      items,
      total: items.reduce((sum, item) => sum + item.lineTotal, 0)
    };

    let deliveryMessage = "Order saved in this browser.";
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order)
      });
      const result = await response.json();
      if (!response.ok || !result.saved) {
        throw new Error(result.error || "The order could not be saved.");
      }
      deliveryMessage = result.whatsappSent
        ? "Your invoice was sent to WhatsApp. We will contact you very soon."
        : "Your order was saved, but WhatsApp delivery is not configured yet.";
    } catch (error) {
      data = dataApi.load();
      data.orders = [order, ...(data.orders || [])];
      dataApi.save(data);
      const emailResult = await dataApi.sendOrderEmails(order, data);
      deliveryMessage = emailResult.sent
        ? emailResult.message
        : "Your order was saved in this browser. Backend delivery is unavailable.";
      console.error("Backend order save failed", error);
    }

    cart = [];
    dataApi.saveCart(cart);
    renderCart();
    elements.checkoutForm.reset();
    elements.checkoutMessage.textContent = `Order ${order.id} placed. ${deliveryMessage}`;
    elements.placeOrder.textContent = "Place your order";
    elements.placeOrder.disabled = false;
  }

  function revealCards() {
    const cards = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
      cards.forEach((card) => card.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );

    cards.forEach((card) => observer.observe(card));
  }

  init();
})();
