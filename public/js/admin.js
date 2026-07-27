/* ---------- Forsidetekst ---------- */
async function loadContent() {
  const response = await fetch('/api/content');
  const data = await response.json();

  document.getElementById('welcomeTitle').value = data.welcomeTitle;
  document.getElementById('welcomeText1').value = data.welcomeText1;
  document.getElementById('welcomeText2').value = data.welcomeText2;
}

document.getElementById('contentForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    welcomeTitle: document.getElementById('welcomeTitle').value,
    welcomeText1: document.getElementById('welcomeText1').value,
    welcomeText2: document.getElementById('welcomeText2').value
  };

  const response = await fetch('/api/admin/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const saveMessage = document.getElementById('saveMessage');

  if (response.ok) {
    saveMessage.textContent = 'Ændringerne er gemt.';
    saveMessage.classList.remove('error');
  } else {
    saveMessage.textContent = 'Noget gik galt. Teksten blev ikke gemt.';
    saveMessage.classList.add('error');
  }
});

/* ---------- Produkter ---------- */
let boxes = [];

async function loadProducts() {
  const response = await fetch('/api/products');
  const data = await response.json();
  boxes = data.boxes || [];

  fillBoxSelect();
  renderProductList(data.products || []);
}

function fillBoxSelect() {
  const select = document.getElementById('productBox');
  const current = select.value;
  select.textContent = '';

  boxes.forEach((box) => {
    const option = document.createElement('option');
    option.value = box.id;
    option.textContent = box.title;
    select.appendChild(option);
  });

  if (current) select.value = current;
}

function renderProductList(products) {
  const container = document.getElementById('productList');
  container.textContent = '';

  if (products.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-note';
    empty.textContent = 'Ingen produkter endnu.';
    container.appendChild(empty);
    return;
  }

  boxes.forEach((box) => {
    const inBox = products.filter((p) => p.box === box.id);
    if (inBox.length === 0) return;

    const group = document.createElement('div');
    group.className = 'product-group';

    const heading = document.createElement('h3');
    heading.textContent = box.title;
    group.appendChild(heading);

    inBox.forEach((product) => {
      group.appendChild(buildAdminRow(product));
    });

    container.appendChild(group);
  });
}

function buildAdminRow(product) {
  const row = document.createElement('div');
  row.className = 'product-row';

  const name = document.createElement('span');
  name.className = 'p-name';
  name.textContent = product.name;

  const price = document.createElement('span');
  price.className = 'p-price';
  price.textContent = product.price;

  row.appendChild(name);

  if (product.description && product.description.trim()) {
    const badge = document.createElement('span');
    badge.className = 'p-desc-badge';
    badge.textContent = '📝';
    badge.title = product.description;
    row.appendChild(badge);
  }

  row.appendChild(price);

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'btn-delete';
  del.textContent = 'Slet';
  del.addEventListener('click', () => deleteProduct(product.id, product.name));
  row.appendChild(del);

  return row;
}

document.getElementById('productForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    name: document.getElementById('productName').value,
    price: document.getElementById('productPrice').value,
    description: document.getElementById('productDescription').value,
    box: document.getElementById('productBox').value
  };

  const message = document.getElementById('productMessage');

  const response = await fetch('/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    message.textContent = 'Produktet er tilføjet.';
    message.classList.remove('error');
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productDescription').value = '';
    await loadProducts();
  } else {
    message.textContent = 'Kunne ikke tilføje produktet.';
    message.classList.add('error');
  }
});

async function deleteProduct(id, name) {
  if (!confirm('Slet "' + name + '"?')) return;

  const message = document.getElementById('productMessage');

  const response = await fetch('/api/admin/products/' + id, {
    method: 'DELETE'
  });

  if (response.ok) {
    message.textContent = 'Produktet er slettet.';
    message.classList.remove('error');
    await loadProducts();
  } else {
    message.textContent = 'Kunne ikke slette produktet.';
    message.classList.add('error');
  }
}

/* ---------- Init ---------- */
loadContent();
loadProducts();
