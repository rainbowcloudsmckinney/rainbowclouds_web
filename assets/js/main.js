// =================================================
// GLOBAL CART HELPERS
// =================================================
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// =================================================
// CART BADGE (HEADER)
// =================================================
function updateCartButton() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.qty, 0);

  const badge = document.getElementById("cart-count");
  const button = document.querySelector("a[href='cart.html']");

  if (!badge || !button) return;

  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove("hidden");
    button.classList.add("has-items");
  } else {
    badge.classList.add("hidden");
    button.classList.remove("has-items");
  }
}

// =================================================
// DOM READY
// =================================================
document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------
  // LABEL PREVIEW
  // ---------------------------------
  const previewArea = document.getElementById("label-preview");
  const inputs      = document.querySelectorAll(".label-input");
  const logoInput   = document.getElementById("logo-input");

  // Persists across re-renders so the logo survives updatePreview() calls
  let logoDataUrl = null;

  const SHAPES = {
    rectangle: { borderRadius: "18px", clipPath: "",                aspectRatio: "4/3" },
    circle:    { borderRadius: "50%",  clipPath: "",                aspectRatio: "1/1" },
    oval:      { borderRadius: "50%",  clipPath: "",                aspectRatio: "2/1" },
    cloud:     { borderRadius: "0",    clipPath: "url(#cloud-clip)", aspectRatio: "5/3" },
  };

  function updatePreview() {
    if (!previewArea) return;

    const title    = document.getElementById("label-title")?.value.trim()    || "";
    const message  = document.getElementById("custom-message")?.value.trim() || "";
    const shape    = document.getElementById("label-shape")?.value            || "rectangle";
    const font     = document.getElementById("font-style")?.value             || "Inter, system-ui, sans-serif";
    const bgColor  = document.getElementById("bg-color")?.value               || "#ffd1dc";
    const txtColor = document.getElementById("font-color")?.value             || "#311b92";
    const s = SHAPES[shape] || SHAPES.rectangle;

    const logoHtml = logoDataUrl
      ? `<div class="label-shape-logo"><img src="${logoDataUrl}" alt="Custom logo"></div>`
      : `<div class="label-img-placeholder">Your Image</div>`;

    const clipStyle = s.clipPath ? `clip-path:${s.clipPath};` : "";

    previewArea.innerHTML = `
      <div class="label-shape" style="
        background:${bgColor};
        color:${txtColor};
        font-family:${font};
        border-radius:${s.borderRadius};
        aspect-ratio:${s.aspectRatio};
        ${clipStyle}
      ">
        <div class="label-shape-inner">
          <div class="label-shape-title">${title || "Your Title"}</div>
          ${logoHtml}
          <div class="label-shape-message">${message || "Your Message"}</div>
        </div>
      </div>
    `;
  }

  inputs.forEach(i => i.addEventListener("input", updatePreview));

  if (logoInput) {
    logoInput.addEventListener("change", function () {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        logoDataUrl = e.target.result;
        updatePreview();
      };
      reader.readAsDataURL(file);
    });
  }

  updatePreview();

  // ---------------------------------
  // PRODUCT CARDS (SHOP PAGE)
  // ---------------------------------
  let cart = getCart();

  document.querySelectorAll(".card").forEach(card => {
    const addBtn = card.querySelector(".add-to-cart");
    const qtyBox = card.querySelector(".qty-controls");
    const qtyNum = card.querySelector(".qty-number");
    const minusBtn = card.querySelector(".qty-minus");
    const plusBtn = card.querySelector(".qty-plus");

    if (!addBtn) return;

    const name = card.dataset.name;
    const price = Number(addBtn.dataset.price);
    const img = card.querySelector("img")?.src || "";

    const existing = cart.find(i => i.name === name);
    if (existing) {
      addBtn.classList.add("hidden");
      qtyBox.classList.remove("hidden");
      qtyNum.textContent = existing.qty;
    }

    addBtn.addEventListener("click", e => {
      e.stopPropagation();

      cart.push({ name, price, qty: 1, img });
      saveCart(cart);

      addBtn.classList.add("hidden");
      qtyBox.classList.remove("hidden");
      qtyNum.textContent = 1;

      updateCartButton();
    });

    plusBtn?.addEventListener("click", e => {
      e.stopPropagation();
      const item = cart.find(i => i.name === name);
      item.qty++;
      qtyNum.textContent = item.qty;
      saveCart(cart);
      updateCartButton();
    });

    minusBtn?.addEventListener("click", e => {
      e.stopPropagation();
      const item = cart.find(i => i.name === name);
      item.qty--;

      if (item.qty <= 0) {
        cart = cart.filter(i => i.name !== name);
        qtyBox.classList.add("hidden");
        addBtn.classList.remove("hidden");
      } else {
        qtyNum.textContent = item.qty;
      }

      saveCart(cart);
      updateCartButton();
    });
  });

  updateCartButton();

  // ---------------------------------
  // CART PAGE RENDERING
  // ---------------------------------
  const cartContainer = document.getElementById("cart-items");
  const totalContainer = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout-btn");

  const MIN_ORDER = 30;

  function renderCart() {
    if (!cartContainer || !totalContainer) return;

    cart = getCart();
    cartContainer.innerHTML = "";

    if (cart.length === 0) {
      cartContainer.innerHTML = "<p>Your cart is empty.</p>";
      totalContainer.innerHTML = "";
      if (checkoutBtn) checkoutBtn.disabled = true;
      updateCartButton();
      return;
    }

    let total = 0;

    cart.forEach((item, index) => {
      const itemTotal = item.price * item.qty;
      total += itemTotal;

      const row = document.createElement("div");
      row.className = "cart-row";

      row.innerHTML = `
        <button class="remove-btn" data-index="${index}">×</button>

        <div class="cart-cell image">
          <img src="${item.img}" class="cart-img" alt="${item.name}">
        </div>

        <div class="cart-cell name">${item.name}</div>
        <div class="cart-cell price">$${item.price.toFixed(2)}</div>

        <div class="cart-cell qty">
          <button class="qty-btn" data-index="${index}" data-action="minus">−</button>
          <span class="qty-number">${item.qty}</span>
          <button class="qty-btn" data-index="${index}" data-action="plus">+</button>
        </div>

        <div class="cart-cell subtotal">$${itemTotal.toFixed(2)}</div>
      `;

      cartContainer.appendChild(row);
    });

    const remaining = MIN_ORDER - total;
    if (remaining > 0) {
      totalContainer.innerHTML = `
        <h2>Total: $${total.toFixed(2)}</h2>
        <p class="cart-min-notice">Add $${remaining.toFixed(2)} more to unlock checkout (minimum $${MIN_ORDER})</p>
      `;
      if (checkoutBtn) checkoutBtn.disabled = true;
    } else {
      totalContainer.innerHTML = `<h2>Total: $${total.toFixed(2)}</h2>`;
      if (checkoutBtn) checkoutBtn.disabled = false;
    }

    updateCartButton();
  }

  document.addEventListener("click", e => {
    if (!e.target.dataset.index) return;

    const index = Number(e.target.dataset.index);
    cart = getCart();

    if (e.target.classList.contains("qty-btn")) {
      const action = e.target.dataset.action;
      if (action === "plus") cart[index].qty++;
      if (action === "minus") cart[index].qty--;

      if (cart[index].qty <= 0) cart.splice(index, 1);
      saveCart(cart);
      renderCart();
    }

    if (e.target.classList.contains("remove-btn")) {
      cart.splice(index, 1);
      saveCart(cart);
      renderCart();
    }
  });

  renderCart();
    // ---------------------------------
  // GOOGLE APPS SCRIPT — SHARED ENDPOINT
  // All forms post to the same script; form_type field tells the sheet which tab to use
  // ---------------------------------
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyEiox1ZgLZ_rmnAlEmKIUt1hJoO0nuxls_wA5zMn4WD1LVKytuSs3XQpAMbnD7pGdFAw/exec";

  function showStatus(el, message, type) {
    if (!el) return;
    el.classList.remove("success", "error", "sending");
    if (type) el.classList.add(type);
    el.textContent = message;
    el.classList.add("show");
  }

  function autoHideStatus(el, ms) {
    if (!el) return;
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => {
      el.classList.remove("show", "success", "error", "sending");
    }, ms);
  }

  async function handleFormSubmit(form, statusEl, btnEl, defaultBtnText, successMsg) {
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (btnEl) {
        btnEl.disabled = true;
        btnEl.dataset.orig = btnEl.textContent;
        btnEl.textContent = "Sending...";
      }

      showStatus(statusEl, "Submitting your request...", "sending");

      try {
        const response = await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          body: new FormData(form)
        });

        const result = await response.json();

        if (result.success) {
          showStatus(statusEl, successMsg, "success");
          form.reset();
          autoHideStatus(statusEl, 6000);
        } else {
          showStatus(statusEl, "❌ Submission failed. Please try again.", "error");
          autoHideStatus(statusEl, 5000);
        }
      } catch (err) {
        showStatus(statusEl, "❌ Network error. Please try again.", "error");
        autoHideStatus(statusEl, 5000);
      } finally {
        if (btnEl) {
          btnEl.disabled = false;
          btnEl.textContent = btnEl.dataset.orig || defaultBtnText;
        }
      }
    });
  }

  // Catering form
  handleFormSubmit(
    document.getElementById("catering-form"),
    document.getElementById("form-status"),
    document.getElementById("catering-submit"),
    "Send Inquiry",
    "✅ Your catering inquiry has been submitted. We’ll get back to you soon. Thank you!"
  );

  // Label quote form
  handleFormSubmit(
    document.getElementById("label-form"),
    document.getElementById("label-status"),
    document.getElementById("label-submit"),
    "Request Quote",
    "✅ Your label quote request has been submitted. We’ll be in touch soon. Thank you!"
  );

  // Contact form
  handleFormSubmit(
    document.getElementById("contact-form"),
    document.getElementById("contact-status"),
    document.getElementById("contact-submit"),
    "Send Message",
    "✅ Your message has been sent. We’ll get back to you soon. Thank you!"
  );

});