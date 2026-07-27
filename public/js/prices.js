document.addEventListener('DOMContentLoaded', async () => {
  const lists = {
    1: document.getElementById('box1List'),
    2: document.getElementById('box2List')
  };
  const titles = {
    1: document.getElementById('box1Title'),
    2: document.getElementById('box2Title')
  };

  try {
    const response = await fetch('/api/products');
    const data = await response.json();

    // Opdater bokstitler ud fra serveren
    (data.boxes || []).forEach((box) => {
      if (titles[box.id]) {
        titles[box.id].textContent = box.title;
      }
    });

    // Ryd lister
    Object.values(lists).forEach((ul) => {
      if (ul) ul.textContent = '';
    });

    // Byg produkter
    (data.products || []).forEach((product) => {
      const ul = lists[product.box];
      if (ul) ul.appendChild(buildProductItem(product));
    });
  } catch (error) {
    console.error('Kunne ikke indlæse priser:', error);
  }
});

function buildProductItem(product) {
  const hasDesc = !!(product.description && product.description.trim());

  const li = document.createElement('li');
  li.className = 'PriceItem' + (hasDesc ? ' has-desc' : '');

  // Interaktiv knap hvis der er en beskrivelse, ellers en statisk række
  const row = document.createElement(hasDesc ? 'button' : 'div');
  row.className = 'PriceRow';
  if (hasDesc) row.type = 'button';

  const service = document.createElement('span');
  service.className = 'service';
  service.textContent = product.name;

  const price = document.createElement('span');
  price.className = 'price';
  price.textContent = product.price;

  row.appendChild(service);
  row.appendChild(price);
  li.appendChild(row);

  if (hasDesc) {
    const chevron = document.createElement('span');
    chevron.className = 'chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.innerHTML =
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" ' +
      'stroke="currentColor" stroke-width="2.4" stroke-linecap="round" ' +
      'stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
    row.appendChild(chevron);
    row.setAttribute('aria-expanded', 'false');

    const desc = document.createElement('div');
    desc.className = 'PriceDesc';
    const p = document.createElement('p');
    p.textContent = product.description;
    desc.appendChild(p);
    li.appendChild(desc);

    row.addEventListener('click', () => {
      const open = li.classList.toggle('open');
      row.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  return li;
}
