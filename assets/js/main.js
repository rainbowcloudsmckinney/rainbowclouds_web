// -----------------------------
// LABEL PREVIEW FUNCTIONALITY
// -----------------------------
document.addEventListener('DOMContentLoaded', function () {

  const previewArea = document.getElementById('label-preview');
  const inputs = document.querySelectorAll('.label-input');
  const logoInput = document.getElementById('logo-input');

  function updatePreview() {
    if (!previewArea) return;

    const eventType = document.getElementById('event-type')?.value || "";
    const message = document.getElementById('custom-message')?.value || "";
    const colors = document.getElementById('preferred-colors')?.value || "";
    const font = document.getElementById('font-style')?.value || "";
    const qty = document.getElementById('quantity-needed')?.value || "1";

    previewArea.style.background = colors || 'linear-gradient(90deg,#ffd1dc,#ffd9a6)';
    previewArea.style.fontFamily = font;

    previewArea.innerHTML = `
      <div style="padding:12px">
        <div style="font-weight:800;font-size:18px">${eventType} — x${qty}</div>
        <div style="margin-top:8px;font-size:14px">${message || 'Your message here'}</div>
        <div id="logo-mock" style="margin-top:10px"></div>
      </div>
    `;
  }

  inputs.forEach(i => i.addEventListener('input', updatePreview));

  if (logoInput) {
    logoInput.addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (ev) {
        const img = new Image();
        img.src = ev.target.result;
        img.style.maxHeight = '60px';
        img.style.maxWidth = '160px';

        const logoMock = document.getElementById('logo-mock');
        if (logoMock) {
          logoMock.innerHTML = '';
          logoMock.appendChild(img);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  updatePreview();


  // -----------------------------
  // CART BADGE UPDATE
  // -----------------------------
  function updateCartButton() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const count = cart.reduce((sum, item) => sum + item.qty, 0);

    const badge = document.getElementById("cart-count");
    const button = document.querySelector(".cart-button");

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

  updateCartButton();


  // -----------------------------
  // CARD CLICK (NO ALERTS)
  // -----------------------------
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.qty-controls')) return;
      if (e.target.classList.contains('add-to-cart')) return;

      const name = card.dataset.name;
      console.log("Card clicked:", name);
    });
  });


  // -----------------------------
  // ADD TO CART + QUANTITY BUTTONS
  // -----------------------------
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  document.querySelectorAll(".card").forEach(card => {
    const addBtn = card.querySelector(".add-to-cart");
    const qtyBox = card.querySelector(".qty-controls");
    const qtyNum = card.querySelector(".qty-number");
    const minusBtn = card.querySelector(".qty-minus");
    const plusBtn = card.querySelector(".qty-plus");

    const name = card.dataset.name;
    const price = Number(addBtn.dataset.price);

    // If item already in cart, show qty controls
    const existing = cart.find(i => i.name === name);
    if (existing) {
      addBtn.classList.add("hidden");
      qtyBox.classList.remove("hidden");
      qtyNum.textContent = existing.qty;
    }

    // Add to Cart → show quantity controls
    addBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      addBtn.classList.add("hidden");
      qtyBox.classList.remove("hidden");
const img = card.querySelector("img").src;
cart.push({ name, price, qty: 1, img });
      // cart.push({ name, price, qty: 1 });
      qtyNum.textContent = 1;

      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartButton();
    });

    // Increase quantity
    plusBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      const item = cart.find(i => i.name === name);
      item.qty++;

      qtyNum.textContent = item.qty;
      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartButton();
    });

    // Decrease quantity
    minusBtn.addEventListener("click", (e) => {
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

      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartButton();
    });
  });

});