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
    total += item.price * item.qty;

    const div = document.createElement("div");
    div.classList.add("cart-item");

    div.innerHTML = `
      <div class="cart-row">
        <div class="cart-name">${item.name}</div>

        <div class="cart-controls">
          <button class="qty-btn" data-index="${index}" data-action="minus">−</button>
          <span class="qty">${item.qty}</span>
          <button class="qty-btn" data-index="${index}" data-action="plus">+</button>
        </div>

        <div class="cart-price">$${item.price * item.qty}</div>

        <button class="remove-btn" data-index="${index}">Remove</button>
      </div>
    `;

    cartContainer.appendChild(div);
  });

  totalContainer.innerHTML = `<h2>Total: $${total}</h2>`;
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("qty-btn")) {
    const index = e.target.dataset.index;
    const action = e.target.dataset.action;

    if (action === "plus") cart[index].qty++;
    if (action === "minus" && cart[index].qty > 1) cart[index].qty--;

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