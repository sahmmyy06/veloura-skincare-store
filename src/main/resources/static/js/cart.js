/* Keeps the bag between visits; checkout prices and stock are verified by Java. */
const cartKey = 'veloura-html-cart';
let cart = loadCart();

function loadCart() {
  // localStorage keeps text, so JSON converts it back to a list of bag items.
  // A damaged saved value should not prevent the shop from opening.
  try {
    const savedCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    if (Array.isArray(savedCart)) {
      return savedCart;
    }
  } catch {
    return [];
  }
  return [];
}

function money(value) {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  });
  return formatter.format(value);
}

function cartNotice(message, type = 'success') {
  if (window.VelouraNotify) {
    window.VelouraNotify.show(message, type);
  } else {
    document.getElementById('cart-message').textContent = message;
  }
}

function saveCart() {
  localStorage.setItem(cartKey, JSON.stringify(cart));
  let itemCount = 0;
  for (const item of cart) {
    itemCount += item.quantity;
  }
  for (const badge of document.querySelectorAll('[data-cart-count]')) {
    badge.textContent = itemCount;
  }
}

for (const image of document.querySelectorAll('[data-product-image]')) {
  function showPlaceholder() {
    image.src = '/products/placeholder.svg';
  }
  // Listen once so a missing placeholder cannot trigger an endless retry.
  image.addEventListener('error', showPlaceholder, { once: true });
  if (image.complete && image.naturalWidth === 0) {
    showPlaceholder();
  }
}

function addProductToCart(event) {
  // data-* attributes come from the HTML rendered by Thymeleaf.
  const button = event.currentTarget;
  const productId = Number(button.dataset.add);
  const availableStock = Number(button.dataset.stock);
  let existingItem = null;
  for (const item of cart) {
    if (item.id === productId) {
      existingItem = item;
      break;
    }
  }
  if (existingItem && existingItem.quantity >= availableStock) {
    cartNotice('You have added all available stock for this product.', 'error');
    return;
  }
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: productId,
      name: button.dataset.name,
      price: Number(button.dataset.price),
      quantity: 1,
    });
  }
  saveCart();
  cartNotice(`${button.dataset.name} added to your bag.`);
}

for (const button of document.querySelectorAll('[data-add]')) {
  button.addEventListener('click', addProductToCart);
}

function renderCart() {
  const container = document.getElementById('cart-items');
  // The same script runs on shop pages, which do not have a checkout bag list.
  if (!container) {
    return;
  }
  container.replaceChildren();
  if (cart.length === 0) {
    container.textContent = 'Your bag is empty.';
  }
  let total = 0;
  for (const item of cart) {
    total += item.price * item.quantity;
    container.append(createCartRow(item));
  }
  document.getElementById('cart-total').textContent = 'Total: ' + money(total);
  document.querySelector('#checkout-form button').disabled = cart.length === 0;
}

function createCartRow(item) {
  const row = document.createElement('div');
  row.className = 'html-cart-row';
  const name = document.createElement('strong');
  name.textContent = item.name;
  const quantity = document.createElement('input');
  quantity.type = 'number';
  quantity.min = '1';
  quantity.step = '1';
  quantity.value = item.quantity;
  quantity.setAttribute('aria-label', `Quantity for ${item.name}`);
  // This callback remembers the item belonging to this particular row.
  quantity.addEventListener('change', function () {
    const newQuantity = Number(quantity.value);
    if (Number.isSafeInteger(newQuantity) && newQuantity > 0) {
      item.quantity = newQuantity;
    }
    saveCart();
    renderCart();
  });
  const price = document.createElement('span');
  price.textContent = money(item.price * item.quantity);
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'button-secondary button-small';
  remove.textContent = 'Remove';
  const removeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  removeIcon.classList.add('icon');
  removeIcon.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '/icons.svg#trash');
  removeIcon.append(use);
  remove.prepend(removeIcon);
  remove.addEventListener('click', function () {
    const remainingItems = [];
    for (const product of cart) {
      if (product.id !== item.id) {
        remainingItems.push(product);
      }
    }
    cart = remainingItems;
    saveCart();
    renderCart();
    cartNotice(`${item.name} removed from your bag.`);
  });
  row.append(name, quantity, price, remove);
  return row;
}

async function placeOrder(event) {
  // Stop the normal page reload: we send the form to Spring's JSON API instead.
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button');
  const message = document.getElementById('checkout-message');
  const body = {};
  for (const [fieldName, fieldValue] of new FormData(form)) {
    body[fieldName] = fieldValue;
  }
  body.items = [];
  // Only send IDs and quantities. Java looks up trusted prices and current stock.
  for (const item of cart) {
    body.items.push({ id: item.id, quantity: item.quantity });
  }
  button.disabled = true;
  message.textContent = 'Placing your order…';
  try {
    // await waits for the response without freezing the rest of the page.
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Could not place order.');
    }
    cart = [];
    saveCart();
    renderCart();
    form.hidden = true;
    message.textContent = `Thank you! Your order ${result.orderNumber} has been placed. `
      + `Total: ${money(result.total)}. Status: ${result.status}.`;
    window.VelouraNotify?.show('Your order has been placed. Thank you!');
  } catch (error) {
    message.textContent = error.message;
    window.VelouraNotify?.show(error.message, 'error');
    button.disabled = false;
  }
}

const checkoutForm = document.getElementById('checkout-form');
if (checkoutForm) {
  checkoutForm.addEventListener('submit', placeOrder);
}

// Restore the header count and, on checkout, draw the saved bag.
saveCart();
renderCart();
