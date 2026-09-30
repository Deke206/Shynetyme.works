const catalogGrid = document.getElementById('catalogGrid');
const categoryFilters = document.getElementById('categoryFilters');
const catalogSearch = document.getElementById('catalogSearch');
const catalogCount = document.getElementById('catalogCount');

const modalElement = document.getElementById('productModal');
const productModal = modalElement ? new bootstrap.Modal(modalElement) : null;
const productModalCategory = document.getElementById('productModalCategory');
const productModalDescription = document.getElementById('productModalDescription');
const productModalImage = document.getElementById('productModalImage');
const productModalSpecs = document.getElementById('productModalSpecs');
const productModalIncluded = document.getElementById('productModalIncluded');

const products = Array.isArray(window.SHYNETYME_PRODUCTS) ? window.SHYNETYME_PRODUCTS : [];
let selectedCategory = 'All';

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function preferredSpecs(product) {
  const preferredKeys = ['Voltage', 'Input voltage', 'Water protection', 'Length', 'LED density', 'Output'];
  return preferredKeys
    .filter((key) => product.specs?.[key])
    .slice(0, 3)
    .map((key) => `<span class="catalog-spec-chip">${escapeHtml(product.specs[key])}</span>`)
    .join('');
}

function visibleProducts() {
  const query = catalogSearch.value.trim().toLowerCase();

  return products.filter((product) => {
    const categoryMatch = selectedCategory === 'All' || product.category === selectedCategory;
    const searchableText = [
      product.name,
      product.category,
      ...Object.values(product.specs || {}),
      ...(product.included || [])
    ].join(' ').toLowerCase();

    return categoryMatch && (!query || searchableText.includes(query));
  });
}

function renderFilters() {
  const categories = ['All', ...new Set(products.map((product) => product.category))];

  categoryFilters.innerHTML = categories.map((category) => {
    const count = category === 'All'
      ? products.length
      : products.filter((product) => product.category === category).length;

    return `
      <button
        class="catalog-filter-button"
        type="button"
        data-category="${escapeHtml(category)}"
        aria-pressed="${category === selectedCategory}">
        ${escapeHtml(category)} · ${count}
      </button>`;
  }).join('');
}

function renderCatalog() {
  const items = visibleProducts();
  catalogCount.textContent = `${items.length} of ${products.length} items`;

  if (!items.length) {
    catalogGrid.innerHTML = `
      <div class="col-12">
        <div class="catalog-empty">
          <strong>No products match that search.</strong><br>
          Try another specification or category.
        </div>
      </div>`;
    return;
  }

  catalogGrid.innerHTML = items.map((product) => `
    <div class="col-sm-6 col-xl-4">
      <article class="catalog-product-card">
        <div class="catalog-product-image-wrap">
          <img
            class="catalog-product-image"
            src="${escapeHtml(product.image)}"
            alt="${escapeHtml(product.name)}"
            loading="lazy">
        </div>
        <div class="catalog-product-body">
          <p class="catalog-product-category">${escapeHtml(product.category)}</p>
          <h2 class="catalog-product-title">${escapeHtml(product.name)}</h2>
          <div class="catalog-product-specs">${preferredSpecs(product)}</div>
          <button
            class="btn btn-neon-cyan catalog-details-button"
            type="button"
            data-product-id="${escapeHtml(product.id)}">
            Product Details
          </button>
        </div>
      </article>
    </div>`).join('');
}

function openProduct(product) {
  productModalCategory.textContent = product.category;
  productModalDescription.textContent = product.name;
  productModalImage.src = product.image;
  productModalImage.alt = product.name;

  productModalSpecs.innerHTML = Object.entries(product.specs || {}).map(([label, value]) => `
    <div class="catalog-spec-row">
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value)}</dd>
    </div>`).join('');

  if (product.included?.length) {
    productModalIncluded.classList.remove('d-none');
    productModalIncluded.innerHTML = `
      <strong>Included / package details</strong>
      <ul>${product.included.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
  } else {
    productModalIncluded.classList.add('d-none');
    productModalIncluded.innerHTML = '';
  }

  productModal.show();
}

categoryFilters.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;

  selectedCategory = button.dataset.category;
  renderFilters();
  renderCatalog();
});

catalogSearch.addEventListener('input', renderCatalog);

catalogGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-product-id]');
  if (!button) return;

  const product = products.find((item) => item.id === button.dataset.productId);
  if (product) openProduct(product);
});

if (products.length) {
  renderFilters();
  renderCatalog();
} else {
  catalogGrid.innerHTML = `
    <div class="col-12">
      <div class="alert alert-danger" role="alert">The catalog data could not be loaded.</div>
    </div>`;
  catalogCount.textContent = 'Catalog unavailable';
}
