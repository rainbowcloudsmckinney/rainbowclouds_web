let cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartContainer = document.getElementById("cart-items");
const totalContainer = document.getElementById("cart-total");

function renderCart() {
  cartContainer.innerHTML = "";

  if (cart.length === 0) {
    cartContainer.innerHTML = `<p>Your cart is empty.</p>`;
    totalContainer.innerHTML = "";
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    const row = document.createElement("div");
    row.classList.add("cart-row");

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
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("qty-btn")) {
    const index = e.target.dataset.index;
    const action = e.target.dataset.action;

    if (action === "plus") cart[index].qty++;
    if (action === "minus") cart[index].qty--;

    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
  }

  if (e.target.classList.contains("remove-btn")) {
    const index = e.target.dataset.index;
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
  }
});

renderCart();