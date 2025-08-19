const grid = document.getElementById('grid');
const searchInput = document.getElementById('search');
const typeFilter = document.getElementById('typeFilter');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const pageNumbersDiv = document.getElementById('pageNumbers');

let currentPage = 1;
const limit = 10;
const totalCount = 1118;

function showLoading() {
  loadingDiv.style.display = 'block';
  errorDiv.style.display = 'none';
  grid.style.display = 'none';
  togglePagination(false);
}

function hideLoading() {
  loadingDiv.style.display = 'none';
  grid.style.display = 'grid';
  togglePagination(true);
}

function showError(msg) {
  errorDiv.textContent = msg;
  errorDiv.style.display = 'block';
  grid.style.display = 'none';
  togglePagination(false);
  loadingDiv.style.display = 'none';
}

function togglePagination(show) {
  prevBtn.style.display = show ? 'inline-block' : 'none';
  nextBtn.style.display = show ? 'inline-block' : 'none';
  pageNumbersDiv.style.display = show ? 'flex' : 'none';
}

async function fetchPokemonPage(page) {
  const offset = (page - 1) * limit;
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
  const data = await res.json();
  return data.results;
}

async function fetchDetails(url) {
  const res = await fetch(url);
  return res.json();
}

async function fetchByName(name) {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`);
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

async function renderList(list) {
  grid.innerHTML = '';
  if (!list || list.length === 0) {
    showError('No Pokémon found.');
    return;
  }
  errorDiv.style.display = 'none';
  for (const item of list) {
    const p = item.url ? await fetchDetails(item.url) : item;
    const typesHTML = p.types.map(t => `<div class="type-badge ${t.type.name}">${t.type.name}</div>`).join('');
    const imgURL = p.sprites.other['official-artwork'].front_default || p.sprites.front_default;
    grid.insertAdjacentHTML('beforeend', `
      <div class="card">
        <h3>${capitalize(p.name)}</h3>
        <img src="${imgURL}" alt="${p.name}" />
        <div>${typesHTML}</div>
        <p>Height: ${p.height}</p>
        <p>Weight: ${p.weight}</p>
        <p>Base XP: ${p.base_experience}</p>
      </div>
    `);
  }
}

function renderPagination() {
  pageNumbersDiv.innerHTML = '';
  const totalPages = Math.ceil(totalCount / limit);
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;

  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = 'page-num' + (i === currentPage ? ' active' : '');
    btn.onclick = () => { currentPage = i; loadPage(); };
    pageNumbersDiv.appendChild(btn);
  }
}

async function loadPage() {
  showLoading();
  const list = await fetchPokemonPage(currentPage);
  await renderList(list);
  renderPagination();
  hideLoading();
}

searchInput.addEventListener('input', handleFilters);
typeFilter.addEventListener('change', handleFilters);

async function handleFilters() {
  const name = searchInput.value.trim();
  const type = typeFilter.value;
  if (name === '' && type === '') {
    loadPage();
    return;
  }
  showLoading();
  if (name) {
    const p = await fetchByName(name);
    if (p && (!type || p.types.some(t => t.type.name === type))) {
      renderList([p]);
    } else {
      showError(`No Pokémon${type ? ' of type ' + type : ''} named "${name}".`);
    }
    hideLoading();
    return;
  }
  if (type) {
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
      const data = await res.json();
      const sliceList = data.pokemon.slice(0, 20);
      const detailed = await Promise.all(sliceList.map(p => fetchDetails(p.pokemon.url)));
      await renderList(detailed);
    } catch {
      showError('Error fetching type data.');
    }
    hideLoading();
  }
}

prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; loadPage(); } };
nextBtn.onclick = () => {
  const max = Math.ceil(totalCount / limit);
  if (currentPage < max) { currentPage++; loadPage(); }
};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

loadPage();
