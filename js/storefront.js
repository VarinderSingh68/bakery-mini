(function () {
  "use strict";

  const dataApi = window.BakeryData;
  let data = dataApi.load();
  let cart = dataApi.getCart();
  const selectedVariants = {};
  let activeSpecialId = "";
  let selectedSpecialVariantIndex = 0;

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
    openCart: document.getElementById("openCart"),
    closeCart: document.getElementById("closeCart"),
    cartDrawer: document.getElementById("cartDrawer"),
    cartItems: document.getElementById("cartItems"),
    cartCount: document.getElementById("cartCount"),
    cartTotal: document.getElementById("cartTotal"),
    checkoutForm: document.getElementById("checkoutForm"),
    checkoutMessage: document.getElementById("checkoutMessage"),
    placeOrder: document.getElementById("placeOrder"),
    footerContact: document.getElementById("footerContact")
  };

  function init() {
    renderBrand();
    renderHero();
    renderSpecials();
    renderProducts();
    renderCart();
    bindEvents();
  }

  function activeProducts() {
    return data.products.filter((product) => product.active !== false);
  }

  function renderBrand() {
    const settings = data.settings;
    document.title = `${settings.bakeryName} | Cakes`;
    document.querySelectorAll("[data-brand-name], [data-brand-heading], [data-brand-footer]").forEach((node) => {
      node.textContent = settings.bakeryName;
    });
    elements.footerContact.textContent = `${settings.phone || ""} ${settings.address ? " | " + settings.address : ""}`;
  }

  function renderHero() {
    const product = activeProducts()[0] || data.products[0];
    if (product) {
      elements.heroCake.src = dataApi.getProductImage(product);
    }
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

  function renderProducts() {
    const products = activeProducts();
    const eyebrow = document.querySelector(".catalog-section .eyebrow");
    if (eyebrow) {
      eyebrow.textContent = `${products.length} cakes available`;
    }

    elements.productGrid.innerHTML = products
      .map((product, index) => productCardTemplate(product, index))
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
            <button class="primary-button" type="button" data-action="add" data-product-id="${dataApi.escapeHtml(product.id)}">
              Add ${dataApi.formatPrice(selected.price)}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function bindEvents() {
    elements.productGrid.addEventListener("click", handleProductClick);
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

    window.addEventListener("storage", (event) => {
      if (event.key === dataApi.STORAGE_KEY) {
        data = dataApi.load();
        renderBrand();
        renderHero();
        renderSpecials();
        renderProducts();
        closeSpecialPreview();
      }
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeSpecialPreview();
      }
    });
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
      addToCart(product);
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
    openCart();
  }

  function renderCart() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const total = cartTotal();
    elements.cartCount.textContent = String(count);
    elements.cartTotal.textContent = dataApi.formatPrice(total);
    elements.placeOrder.disabled = cart.length === 0;

    if (!cart.length) {
      elements.cartItems.innerHTML = `
        <div class="empty-state">
          <strong>Your cart is empty</strong>
          <p>Add a cake from the menu to place a Cash on Delivery order.</p>
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
        const label = item.specialTitle || special?.title || "Cake menu";
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
      paymentMethod: "Cash on Delivery",
      customer,
      items,
      total: items.reduce((sum, item) => sum + item.lineTotal, 0)
    };

    data = dataApi.load();
    data.orders = [order, ...(data.orders || [])];
    dataApi.save(data);

    const emailResult = await dataApi.sendOrderEmails(order, data);

    cart = [];
    dataApi.saveCart(cart);
    renderCart();
    elements.checkoutForm.reset();
    elements.checkoutMessage.textContent = `Order ${order.id} placed. ${emailResult.message}`;
    elements.placeOrder.textContent = "Place COD order";
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
