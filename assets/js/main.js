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
  const inputs = document.querySelectorAll(".label-input");
  const logoInput = document.getElementById("logo-input");

  function updatePreview() {
    if (!previewArea) return;

    const eventType = document.getElementById("event-type")?.value || "";
    const message = document.getElementById("custom-message")?.value || "";
    const colors = document.getElementById("preferred-colors")?.value || "";
    const font = document.getElementById("font-style")?.value || "";
    const qty = document.getElementById("quantity-needed")?.value || "1";

    previewArea.style.background =
      colors || "linear-gradient(90deg,#ffd1dc,#ffd9a6)";
    previewArea.style.fontFamily = font;

    previewArea.innerHTML = `
      <div style="padding:12px">
        <div style="font-weight:800;font-size:18px">${eventType} — x${qty}</div>
        <div style="margin-top:8px;font-size:14px">
          ${message || "Your message here"}
        </div>
        <div id="logo-mock" style="margin-top:10px"></div>
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
        const img = new Image();
        img.src = e.target.result;
        img.style.maxHeight = "60px";
        img.style.maxWidth = "160px";

        const logoMock = document.getElementById("logo-mock");
        if (logoMock) {
          logoMock.innerHTML = "";
          logoMock.appendChild(img);
        }
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

  function renderCart() {
    if (!cartContainer || !totalContainer) return;

    cart = getCart();
    cartContainer.innerHTML = "";

    if (cart.length === 0) {
      cartContainer.innerHTML = "<p>Your cart is empty.</p>";
      totalContainer.innerHTML = "";
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

    totalContainer.innerHTML = `<h2>Total: $${total.toFixed(2)}</h2>`;
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
  // CATERING FORM (GOOGLE APPS SCRIPT)
  // ---------------------------------
  const cateringForm = document.getElementById("catering-form");
  const formStatus = document.getElementById("form-status");
  const submitBtn = document.getElementById("catering-submit");

  // ✅ PASTE YOUR DEPLOYED WEB APP URL HERE
  const CATERING_ENDPOINT = "https://script.google.com/macros/s/AKfycbznd0Fft_iiPx1hm19YI2X2jM3isTMx65aW6mK5ho9uRXCTL6QYiiXJZrDZZuZ-F2Cn_Q/exec";

  function setStatus(message, type) {
    if (!formStatus) return;

    formStatus.classList.remove("success", "error", "sending");
    if (type) formStatus.classList.add(type);

    formStatus.textContent = message;
    formStatus.classList.add("show");
  }

  function hideStatusAfter(ms) {
    if (!formStatus) return;
    clearTimeout(hideStatusAfter._t);
    hideStatusAfter._t = setTimeout(() => {
      formStatus.classList.remove("show", "success", "error", "sending");
    }, ms);
  }

  if (cateringForm) {
    cateringForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!CATERING_ENDPOINT || CATERING_ENDPOINT.includes("PASTE_")) {
        setStatus("❌ Missing form endpoint URL in main.js", "error");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = "Sending...";
      }

      setStatus("Submitting your request...", "sending");

      try {
        const formData = new FormData(cateringForm);

        const response = await fetch(CATERING_ENDPOINT, {
          method: "POST",
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          setStatus("✅ Your query has been submitted. We’ll get back to you soon. Thank you!", "success");
          cateringForm.reset();
          hideStatusAfter(5000);
        } else {
          setStatus("❌ Submission failed. Please try again.", "error");
          hideStatusAfter(5000);
        }
      } catch (err) {
        setStatus("❌ Network error. Please try again.", "error");
        hideStatusAfter(5000);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.originalText || "Send Inquiry";
        }
      }
    });
  }

});