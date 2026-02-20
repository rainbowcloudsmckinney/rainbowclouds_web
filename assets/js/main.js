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

    // Use safe DOM manipulation instead of innerHTML to prevent XSS
    const wrapper = document.createElement('div');
    wrapper.style.padding = '12px';

    const titleDiv = document.createElement('div');
    titleDiv.style.fontWeight = '800';
    titleDiv.style.fontSize = '18px';
    titleDiv.textContent = `${eventType} — x${qty}`;

    const messageDiv = document.createElement('div');
    messageDiv.style.marginTop = '8px';
    messageDiv.style.fontSize = '14px';
    messageDiv.textContent = message || 'Your message here';

    const logoMock = document.createElement('div');
    logoMock.id = 'logo-mock';
    logoMock.style.marginTop = '10px';

    wrapper.appendChild(titleDiv);
    wrapper.appendChild(messageDiv);
    wrapper.appendChild(logoMock);

    previewArea.innerHTML = '';
    previewArea.appendChild(wrapper);
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

    // Only show standalone total if shipping section doesn't exist
    // (shipping section already displays subtotal + shipping + grand total)
    if (!document.getElementById("shipping-section")) {
      totalContainer.innerHTML = `<h2>Total: $${total.toFixed(2)}</h2>`;
    } else {
      totalContainer.innerHTML = "";
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
  // SHIPPING CALCULATION
  // ---------------------------------
  const FLAT_SHIPPING = 15;
  const MIN_ORDER = 6;

  function updateTotals() {
    const cart = getCart();
    const shippingSection = document.getElementById("shipping-section");
    const subtotalDisplay = document.getElementById("subtotal-display");
    const shippingDisplay = document.getElementById("shipping-display");
    const grandTotalDisplay = document.getElementById("grand-total-display");
    const checkoutBtn = document.getElementById("checkout-btn");
    const minOrderMsg = document.getElementById("min-order-msg");

    if (!shippingSection) return;

    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

    if (cart.length === 0) {
      shippingSection.style.display = "none";
      if (checkoutBtn) checkoutBtn.style.display = "none";
      if (minOrderMsg) minOrderMsg.style.display = "none";
      return;
    }

    shippingSection.style.display = "block";
    if (checkoutBtn) checkoutBtn.style.display = "block";

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const grandTotal = subtotal + FLAT_SHIPPING;

    if (subtotalDisplay) subtotalDisplay.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingDisplay) shippingDisplay.textContent = `$${FLAT_SHIPPING.toFixed(2)}`;
    if (grandTotalDisplay) grandTotalDisplay.textContent = `$${grandTotal.toFixed(2)}`;

    // Minimum order messaging
    if (minOrderMsg) {
      minOrderMsg.style.display = "block";
      if (totalQty < MIN_ORDER) {
        const remaining = MIN_ORDER - totalQty;
        minOrderMsg.className = "min-order-msg warning";
        minOrderMsg.textContent = `Add ${remaining} more item${remaining === 1 ? '' : 's'} to meet the minimum order of ${MIN_ORDER}`;
        if (checkoutBtn) {
          checkoutBtn.disabled = true;
          checkoutBtn.style.opacity = "0.5";
          checkoutBtn.style.cursor = "not-allowed";
        }
      } else {
        minOrderMsg.className = "min-order-msg ok";
        minOrderMsg.textContent = `✓ Minimum order met (${totalQty} items)`;
        if (checkoutBtn) {
          checkoutBtn.disabled = false;
          checkoutBtn.style.opacity = "1";
          checkoutBtn.style.cursor = "pointer";
        }
      }
    }
  }

  // Initial totals update
  updateTotals();

  // ---------------------------------
  // STRIPE CHECKOUT (via Serverless API)
  // ---------------------------------
  // API endpoint - works locally with vercel dev, or deployed on Vercel
  const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api/create-checkout'
    : '/api/create-checkout';

  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", async () => {
      const cart = getCart();

      if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
      }

      const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
      if (totalQty < MIN_ORDER) {
        alert(`Minimum order is ${MIN_ORDER} items. You currently have ${totalQty}.`);
        return;
      }

      // Show loading state
      const originalText = checkoutBtn.textContent;
      checkoutBtn.textContent = "Processing...";
      checkoutBtn.disabled = true;

      try {
        // Call the secure serverless function
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            items: cart.map(item => ({
              name: item.name,
              price: item.price,
              qty: item.qty
            })),
            successUrl: `${window.location.origin}/success.html`,
            cancelUrl: `${window.location.origin}/cancel.html`
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout');
        }

        // Redirect to Stripe Checkout
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL received');
        }

      } catch (error) {
        console.error('Checkout error:', error);
        alert(`Checkout error: ${error.message}\n\nMake sure the API is running (vercel dev) and STRIPE_SECRET_KEY is set.`);
        checkoutBtn.textContent = originalText;
        checkoutBtn.disabled = false;
      }
    });
  }

  // Override renderCart to also update totals
  const originalRenderCart = renderCart;
  if (typeof renderCart === 'function') {
    // Re-attach event to update totals after cart changes
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("qty-btn") || e.target.classList.contains("remove-btn")) {
        setTimeout(updateTotals, 100);
      }
    });
  }
  // ---------------------------------
  // FORM HELPERS (shared by catering + labels)
  // ---------------------------------
  // Old Google Apps Script endpoint (kept for reference):
  // const FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbznd0Fft_iiPx1hm19YI2X2jM3isTMx65aW6mK5ho9uRXCTL6QYiiXJZrDZZuZ-F2Cn_Q/exec";
  const FORM_ENDPOINT = "https://api.web3forms.com/submit";

  function setStatus(el, message, type) {
    if (!el) return;
    el.classList.remove("success", "error", "sending");
    if (type) el.classList.add(type);
    el.textContent = message;
    el.classList.add("show");
  }

  function hideStatusAfter(el, ms) {
    if (!el) return;
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => {
      el.classList.remove("show", "success", "error", "sending");
    }, ms);
  }

  async function submitForm(form, statusEl, btn, defaultBtnText, beforeSubmit) {
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (btn) {
        btn.disabled = true;
        btn.dataset.originalText = btn.textContent;
        btn.textContent = "Sending...";
      }

      setStatus(statusEl, "Submitting your request...", "sending");

      try {
        const formData = new FormData(form);

        // Optional pre-processing before submission
        if (beforeSubmit) beforeSubmit(formData);

        const response = await fetch(FORM_ENDPOINT, {
          method: "POST",
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          setStatus(statusEl, "✅ Your request has been submitted. We'll get back to you soon. Thank you!", "success");
          form.reset();
          hideStatusAfter(statusEl, 5000);
        } else {
          setStatus(statusEl, "❌ Submission failed. Please try again.", "error");
          hideStatusAfter(statusEl, 5000);
        }
      } catch (err) {
        setStatus(statusEl, "❌ Network error. Please try again.", "error");
        hideStatusAfter(statusEl, 5000);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = btn.dataset.originalText || defaultBtnText;
        }
      }
    });
  }

  // ---------------------------------
  // CATERING FORM
  // ---------------------------------
  submitForm(
    document.getElementById("catering-form"),
    document.getElementById("form-status"),
    document.getElementById("catering-submit"),
    "Send Inquiry"
  );

  // ---------------------------------
  // LABEL FORM
  // ---------------------------------
  submitForm(
    document.getElementById("label-form"),
    document.getElementById("label-status"),
    document.getElementById("label-submit"),
    "Request Sample",
    (formData) => {
      // Bundle label details into the 'message' field the script expects
      const eventType = formData.get("event_type") || "N/A";
      const customMsg = formData.get("custom_message") || "N/A";
      const colors = formData.get("preferred_colors") || "N/A";
      const font = formData.get("font_style") || "N/A";
      const qty = formData.get("quantity_needed") || "N/A";

      const message = `[LABEL INQUIRY]\nEvent Type: ${eventType}\nCustom Message: ${customMsg}\nPreferred Colors: ${colors}\nFont Style: ${font}\nQuantity: ${qty}`;
      formData.set("message", message);
    }
  );

});