  const API_BASE  = 'https://api.tvmaze.com';
  const PAGE_SIZE = 20;

  let allShows      = [];
  let filteredShows = [];
  let displayed     = 0;
  let watchlist     = JSON.parse(localStorage.getItem('cinema_watchlist') || '[]');
  let activeGenre   = 'All';

  async function init() {
    renderSkeletons();
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${API_BASE}/shows?page=0`),
        fetch(`${API_BASE}/shows?page=1`)
      ]);
      const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
      allShows = [...d1, ...d2];
      buildGenreFilter();
      setupHero();
      applyFilters();
    } catch(e) {
      document.getElementById('moviesGrid').innerHTML =
        '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted)">Could not load shows. Please try again.</div>';
    }
    updateWLCount();
  }

  function renderSkeletons() {
    document.getElementById('moviesGrid').innerHTML = Array(10).fill(0).map(() => `
      <div class="skeleton-card">
        <div class="sk-poster skeleton"></div>
        <div class="sk-body">
          <div class="sk-title skeleton"></div>
          <div class="sk-meta skeleton"></div>
        </div>
      </div>`).join('');
  }

  function setupHero() {
    const top = allShows.filter(s => s.image?.medium && s.rating?.average)
      .sort((a,b) => b.rating.average - a.rating.average).slice(0, 3);
    document.getElementById('heroCards').innerHTML = top.map(s => `
      <div class="hero-card-mini" onclick="window.location.href='details.html?id=${s.id}'">
        <img src="${s.image.medium}" alt="${esc(s.name)}" loading="lazy">
      </div>`).join('');
    if (top[0]) {
      document.querySelector('.hero-tag').textContent = '\u2726 ' + (top[0].genres?.[0] || 'Featured');
      document.querySelector('.hero-title').innerHTML = `Discover<br><em>${esc(top[0].name.split(' ')[0])}</em>`;
      document.querySelector('.hero-desc').textContent = stripHtml(top[0].summary || '').slice(0, 120) + '\u2026';
    }
  }

  function buildGenreFilter() {
    const genres = ['All', ...new Set(allShows.flatMap(s => s.genres || []))].slice(0, 10);
    document.getElementById('genreFilter').innerHTML = genres.map(g =>
      `<button class="genre-btn${g==='All'?' active':''}" onclick="setGenre('${g}',this)">${g}</button>`
    ).join('');
  }

  function setGenre(genre, btn) {
    activeGenre = genre;
    document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilters();
  }

  let searchTimer;
  function onSearch() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(applyFilters, 280);
  }

  function applyFilters() {
    const q    = document.getElementById('searchInput').value.toLowerCase().trim();
    const sort = document.getElementById('sortSelect').value;

    filteredShows = allShows.filter(s => {
      const mQ = !q || s.name.toLowerCase().includes(q) || (s.genres||[]).some(g => g.toLowerCase().includes(q));
      const mG = activeGenre === 'All' || (s.genres||[]).includes(activeGenre);
      return mQ && mG;
    });

    filteredShows.sort((a, b) => {
      if (sort === 'rating-desc') return (b.rating?.average||0) - (a.rating?.average||0);
      if (sort === 'rating-asc')  return (a.rating?.average||0) - (b.rating?.average||0);
      if (sort === 'name-asc')    return a.name.localeCompare(b.name);
      if (sort === 'name-desc')   return b.name.localeCompare(a.name);
      if (sort === 'year-desc')   return new Date(b.premiered||0) - new Date(a.premiered||0);
      if (sort === 'year-asc')    return new Date(a.premiered||0) - new Date(b.premiered||0);
      return 0;
    });

    displayed = 0;
    document.getElementById('moviesGrid').innerHTML = '';
    document.getElementById('totalCount').textContent = `${filteredShows.length} shows`;

    const el = document.getElementById('resultsInfo');
    if (q || activeGenre !== 'All') {
      el.innerHTML = `Showing <strong>${filteredShows.length}</strong> results${q ? ` for "<strong>${q}</strong>"` : ''}${activeGenre !== 'All' ? ` in <strong>${activeGenre}</strong>` : ''}`;
    } else { el.innerHTML = ''; }

    renderNext();
  }

  function renderNext() {
    const batch = filteredShows.slice(displayed, displayed + PAGE_SIZE);
    const grid  = document.getElementById('moviesGrid');
    batch.forEach((show, i) => grid.appendChild(createCard(show, i)));
    displayed += batch.length;

    const btn = document.getElementById('loadMoreBtn');
    if (displayed < filteredShows.length) {
      btn.style.display = 'inline-block';
      btn.querySelector('span').textContent = `Load More (${filteredShows.length - displayed} remaining)`;
    } else {
      btn.style.display = 'none';
    }
  }

  function loadMore() { renderNext(); }

  function createCard(show, animIdx) {
    const inWL    = watchlist.includes(show.id);
    const rating  = show.rating?.average;
    const year    = show.premiered ? show.premiered.slice(0,4) : '—';
    const stClass = show.status === 'Running' ? 'status-running' : 'status-ended';
    const genre   = (show.genres||[])[0];

    const a = document.createElement('a');
    a.className = 'movie-card';
    a.href = `details.html?id=${show.id}`;
    a.style.animationDelay = `${(animIdx % PAGE_SIZE) * 0.04}s`;

    a.innerHTML = `
      <div class="card-poster">
        ${show.image?.medium
          ? `<img class="card-img" src="${show.image.medium}" alt="${esc(show.name)}" loading="lazy">`
          : `<div class="card-img-placeholder">&#x1F3AC;<span>${esc(show.name[0])}</span></div>`}
        ${rating ? `<div class="card-rating">&#x2605; ${rating}</div>` : ''}
        ${genre  ? `<div class="card-genres"><span class="card-genre-tag">${esc(genre)}</span></div>` : ''}
        <div class="card-overlay">
          <button class="card-play-btn" title="View details">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#000"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
          <button class="card-wl-btn ${inWL ? 'in-watchlist' : ''}" data-id="${show.id}" title="${inWL ? 'Remove from watchlist' : 'Add to watchlist'}">
            ${inWL ? '&#x2713;' : '+'}
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="card-title">${esc(show.name)}</div>
        <div class="card-meta">
          <span>${year}</span>
          <span class="card-meta-dot"></span>
          <span class="card-status ${stClass}">${show.status || 'Unknown'}</span>
        </div>
      </div>`;

    // Watchlist btn — prevent card navigation
    a.querySelector('.card-wl-btn').addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const btn = e.currentTarget;
      const id  = parseInt(btn.dataset.id);
      const idx = watchlist.indexOf(id);
      if (idx === -1) {
        watchlist.push(id);
        btn.classList.add('in-watchlist');
        btn.innerHTML = '&#x2713;';
        showToast('&#x2726;', 'Added to Watchlist');
      } else {
        watchlist.splice(idx, 1);
        btn.classList.remove('in-watchlist');
        btn.innerHTML = '+';
        showToast('&#x2715;', 'Removed from Watchlist');
      }
      localStorage.setItem('cinema_watchlist', JSON.stringify(watchlist));
      updateWLCount();
    });

    return a;
  }

  function updateWLCount() {
    document.getElementById('wlCount').textContent = watchlist.length;
  }

  function renderWatchlist() {
    const grid  = document.getElementById('watchlistGrid');
    const empty = document.getElementById('wlEmpty');
    const shows = allShows.filter(s => watchlist.includes(s.id));
    document.getElementById('wlSubcount').textContent = `${shows.length} title${shows.length !== 1 ? 's' : ''}`;
    if (!shows.length) {
      grid.style.display = 'none'; empty.style.display = 'block'; return;
    }
    grid.style.display = 'grid'; empty.style.display = 'none';
    grid.innerHTML = '';
    shows.forEach((s, i) => grid.appendChild(createCard(s, i)));
  }

  function showMain(btn) {
    document.getElementById('mainPage').classList.remove('hidden');
    document.getElementById('watchlistPage').classList.remove('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    (btn || document.getElementById('navMain')).classList.add('active');
  }

  function showWatchlist(btn) {
    document.getElementById('mainPage').classList.add('hidden');
    document.getElementById('watchlistPage').classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    (btn || document.getElementById('navWL')).classList.add('active');
    renderWatchlist();
  }

  function stripHtml(html) {
    const d = document.createElement('div'); d.innerHTML = html; return d.textContent || '';
  }

  function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function scrollToGrid() {
    document.getElementById('moviesGrid').scrollIntoView({ behavior: 'smooth' });
  }

  let toastTimer;
  function showToast(icon, msg) {
    clearTimeout(toastTimer);
    const t = document.getElementById('toast');
    document.getElementById('toastIcon').innerHTML = icon;
    document.getElementById('toastMsg').textContent = msg;
    t.classList.add('show');
    toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
  }

  init();