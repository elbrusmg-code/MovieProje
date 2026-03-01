const API_BASE   = 'https://api.tvmaze.com';
	const PAGE_SIZE  = 12; 

	// ── State ──────────────────────────────────────────────
	let allShows   = [];          
	let watchlist  = JSON.parse(localStorage.getItem('flixgo_wl') || '[]');

	const tabState = {
		all:    { filtered: [], offset: 0 },
		drama:  { filtered: [], offset: 0 },
		comedy: { filtered: [], offset: 0 },
		action: { filtered: [], offset: 0 },
	};

	function esc(str) {
		return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
	}

	function isInWatchlist(id) {
		return watchlist.some(w => w.id === id);
	}

	function saveWatchlist() {
		localStorage.setItem('flixgo_wl', JSON.stringify(watchlist));
	}

	function toggleWatchlist(show, btnEl) {
		const idx = watchlist.findIndex(w => w.id === show.id);
		if (idx === -1) {
			watchlist.push({
				id:     show.id,
				name:   show.name,
				image:  show.image?.medium || '',
				rating: show.rating?.average || null,
				year:   (show.premiered || '').slice(0, 4),
			});
		} else {
			watchlist.splice(idx, 1);
		}
		saveWatchlist();
		updateWatchlistBadge();
		renderWatchlistPanel();

		document.querySelectorAll(`.item__bookmark[data-id="${show.id}"]`).forEach(btn => {
			btn.classList.toggle('active', isInWatchlist(show.id));
		});
	}

	function updateWatchlistBadge() {
		document.getElementById('watchlistBadge').textContent = watchlist.length;
	}

	function renderWatchlistPanel() {
		const body = document.getElementById('watchlistBody');
		if (!watchlist.length) {
			body.innerHTML = '<div class="watchlist-panel__empty">Your watchlist is empty.<br>Click the bookmark icon on any show.</div>';
			return;
		}
		body.innerHTML = watchlist.map(w => `
			<div class="watchlist-item" data-id="${w.id}">
				<img class="watchlist-item__img" src="${esc(w.image)}" alt="${esc(w.name)}"
					onerror="this.style.visibility='hidden'">
				<div class="watchlist-item__info">
					<div class="watchlist-item__name">${esc(w.name)}</div>
					<div class="watchlist-item__meta">${w.year || ''}${w.year && w.rating ? ' · ' : ''}${w.rating ? '★ ' + w.rating : ''}</div>
				</div>
				<button class="watchlist-item__remove" data-id="${w.id}" title="Remove">✕</button>
			</div>
		`).join('');

		body.querySelectorAll('.watchlist-item').forEach(el => {
			el.addEventListener('click', e => {
				if (!e.target.closest('.watchlist-item__remove')) {
					window.location.href = `details.html?id=${el.dataset.id}`;
				}
			});
		});
		body.querySelectorAll('.watchlist-item__remove').forEach(btn => {
			btn.addEventListener('click', e => {
				e.stopPropagation();
				const id = parseInt(btn.dataset.id);
				watchlist = watchlist.filter(w => w.id !== id);
				saveWatchlist();
				updateWatchlistBadge();
				renderWatchlistPanel();
				document.querySelectorAll(`.item__bookmark[data-id="${id}"]`).forEach(b => b.classList.remove('active'));
			});
		});
	}

	document.getElementById('watchlistToggleBtn').addEventListener('click', () => {
		document.getElementById('watchlistPanel').classList.toggle('open');
	});
	document.getElementById('watchlistCloseBtn').addEventListener('click', () => {
		document.getElementById('watchlistPanel').classList.remove('open');
	});

	function buildCardHTML(show, variant = 'grid') {
		const img      = show.image?.medium || show.image?.original || '';
		const rating   = show.rating?.average || '';
		const year     = (show.premiered || '').slice(0, 4);
		const genres   = (show.genres || []).slice(0, 2);
		const inWl     = isInWatchlist(show.id);
		const detailHref = `details.html?id=${show.id}`;

		const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18.54,9,8.88,3.46a3.42,3.42,0,0,0-5.13,3V17.58A3.42,3.42,0,0,0,7.17,21a3.43,3.43,0,0,0,1.71-.46L18.54,15a3.42,3.42,0,0,0,0-5.92Zm-1,4.19L7.88,18.81a1.44,1.44,0,0,1-1.42,0,1.42,1.42,0,0,1-.71-1.23V6.42a1.42,1.42,0,0,1,.71-1.23A1.51,1.51,0,0,1,7.17,5a1.54,1.54,0,0,1,.71.19l9.66,5.58a1.42,1.42,0,0,1,0,2.46Z"/></svg>`;

		const bookmarkIcon = `<svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;

		const imgEl = img
			? `<img src="${esc(img)}" alt="${esc(show.name)}" loading="lazy">`
			: `<img src="img/covers/1.png" alt="${esc(show.name)}" loading="lazy">`;

		const bmBtn = `<button class="item__bookmark ${inWl ? 'active' : ''}" data-id="${show.id}" title="Watchlist">${bookmarkIcon}</button>`;

		if (variant === 'hero') {
			return `
				<div class="item item--big">
					<a href="${detailHref}" class="item__cover">
						${imgEl}
						<span class="item__play">${playIcon}</span>
					</a>
					${bmBtn}
					<div class="item__content">
						<h3 class="item__title"><a href="${detailHref}">${esc(show.name)}</a></h3>
						<span class="item__category">${genres.map(g => `<a href="#">${esc(g)}</a>`).join('')}</span>
						${rating ? `<span class="item__rate">${rating}</span>` : ''}
					</div>
				</div>`;
		}

		if (variant === 'carousel') {
			return `
				<div class="item item--carousel">
					<a href="${detailHref}" class="item__cover">
						${imgEl}
						<span class="item__play">${playIcon}</span>
					</a>
					${bmBtn}
					<div class="item__content">
						<h3 class="item__title"><a href="${detailHref}">${esc(show.name)}</a></h3>
						<span class="item__category">${genres.map(g => `<a href="#">${esc(g)}</a>`).join('')}</span>
						${rating ? `<span class="item__rate">${rating}</span>` : ''}
					</div>
				</div>`;
		}

		return `
			<div class="col-6 col-sm-4 col-lg-3 col-xl-2">
				<div class="item">
					<a href="${detailHref}" class="item__cover">
						${imgEl}
						<span class="item__play">${playIcon}</span>
					</a>
					${bmBtn}
					<div class="item__content">
						<h3 class="item__title"><a href="${detailHref}">${esc(show.name)}</a></h3>
						<span class="item__category">${genres.map(g => `<a href="#">${esc(g)}</a>`).join('')}</span>
						<span class="item__rate">${rating || '—'}</span>
					</div>
				</div>
			</div>`;
	}

	function bindBookmarks(container) {
		container.querySelectorAll('.item__bookmark').forEach(btn => {
			btn.addEventListener('click', e => {
				e.preventDefault();
				e.stopPropagation();
				const id   = parseInt(btn.dataset.id);
				const show = allShows.find(s => s.id === id);
				if (show) toggleWatchlist(show, btn);
			});
		});
	}

	function renderTab(key, gridId, lmId) {
		const state  = tabState[key];
		const grid   = document.getElementById(gridId);
		const lmWrap = document.getElementById(lmId);
		const slice  = state.filtered.slice(state.offset, state.offset + PAGE_SIZE);

		if (state.offset === 0) grid.innerHTML = '';  // fresh render

		if (!slice.length && state.offset === 0) {
			grid.innerHTML = '<div class="no-results">No results found.</div>';
			lmWrap.style.display = 'none';
			return;
		}

		slice.forEach(show => {
			grid.insertAdjacentHTML('beforeend', buildCardHTML(show, 'grid'));
		});
		bindBookmarks(grid);

		state.offset += slice.length;
		lmWrap.style.display = state.offset < state.filtered.length ? 'block' : 'none';
	}

	function applyFiltersAndSort() {
		const q    = document.getElementById('searchInput').value.trim().toLowerCase();
		const sort = document.getElementById('sortSelect').value;

		function process(list) {
			let r = q ? list.filter(s => (s.name || '').toLowerCase().includes(q)) : [...list];
			switch (sort) {
				case 'rating-desc': r.sort((a,b) => (b.rating?.average||0)-(a.rating?.average||0)); break;
				case 'rating-asc':  r.sort((a,b) => (a.rating?.average||0)-(b.rating?.average||0)); break;
				case 'name-asc':    r.sort((a,b) => (a.name||'').localeCompare(b.name||'')); break;
				case 'name-desc':   r.sort((a,b) => (b.name||'').localeCompare(a.name||'')); break;
				case 'year-desc':   r.sort((a,b) => (b.premiered||'').localeCompare(a.premiered||'')); break;
				case 'year-asc':    r.sort((a,b) => (a.premiered||'').localeCompare(b.premiered||'')); break;
				default:            r.sort((a,b) => (b.rating?.average||0)-(a.rating?.average||0));
			}
			return r;
		}

		tabState.all.filtered    = process(allShows);
		tabState.drama.filtered  = process(allShows.filter(s => (s.genres||[]).includes('Drama')));
		tabState.comedy.filtered = process(allShows.filter(s => (s.genres||[]).includes('Comedy')));
		tabState.action.filtered = process(allShows.filter(s => (s.genres||[]).includes('Action')));

		Object.values(tabState).forEach(t => t.offset = 0);

		renderTab('all',    'grid-all',    'lm-all');
		renderTab('drama',  'grid-drama',  'lm-drama');
		renderTab('comedy', 'grid-comedy', 'lm-comedy');
		renderTab('action', 'grid-action', 'lm-action');
	}

	document.getElementById('loadMoreAll').addEventListener('click', () => renderTab('all',    'grid-all',    'lm-all'));
	document.getElementById('loadMoreDrama').addEventListener('click', () => renderTab('drama',  'grid-drama',  'lm-drama'));
	document.getElementById('loadMoreComedy').addEventListener('click', () => renderTab('comedy', 'grid-comedy', 'lm-comedy'));
	document.getElementById('loadMoreAction').addEventListener('click', () => renderTab('action', 'grid-action', 'lm-action'));

	let searchTimer;
	document.getElementById('searchInput').addEventListener('input', () => {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(applyFiltersAndSort, 300);
	});
	document.getElementById('sortSelect').addEventListener('change', applyFiltersAndSort);

	let heroSplide = null;
	function buildHeroCarousel(shows) {
		const list = document.getElementById('heroList');
		const top  = shows.filter(s => (s.rating?.average || 0) >= 8).slice(0, 10);
		list.innerHTML = top.map(s => `<li class="splide__slide">${buildCardHTML(s, 'hero')}</li>`).join('');
		bindBookmarks(list);

		if (heroSplide) heroSplide.destroy();
		heroSplide = new Splide('#heroCarousel', {
			type: 'loop', perPage: 5, drag: true, pagination: false,
			autoWidth: false, speed: 800, gap: 32, focus: 0,
			breakpoints: {
				575: { perPage: 2, gap: 16, pagination: true },
				767: { perPage: 3, gap: 20, pagination: true },
				991: { perPage: 3, gap: 24, pagination: true },
				1199: { perPage: 4, gap: 24, pagination: true },
			}
		}).mount();
	}

	let nwSplide = null;
	function buildNowWatchingCarousel(shows) {
		const list = document.getElementById('nowWatchingList');
		const picks = shows.filter(s => s.status === 'Running').slice(0, 12);
		list.innerHTML = picks.map(s => `<li class="splide__slide">${buildCardHTML(s, 'carousel')}</li>`).join('');
		bindBookmarks(list);

		if (nwSplide) nwSplide.destroy();
		nwSplide = new Splide('#nowWatchingCarousel', {
			type: 'loop', perPage: 6, drag: true, pagination: false,
			speed: 800, gap: 24, focus: 0,
			breakpoints: {
				575: { perPage: 2, gap: 16, pagination: true },
				767: { perPage: 3, gap: 20, pagination: true },
				991: { perPage: 3, gap: 24, pagination: true },
				1199: { perPage: 4, gap: 24, pagination: true },
			}
		}).mount();
	}

	document.getElementById('headerSearchInput').addEventListener('input', e => {
		document.getElementById('searchInput').value = e.target.value;
		clearTimeout(searchTimer);
		searchTimer = setTimeout(applyFiltersAndSort, 300);
		document.querySelector('.content').scrollIntoView({ behavior: 'smooth' });
	});

	async function fetchShows() {
		try {
			const [r0, r1] = await Promise.all([
				fetch(`${API_BASE}/shows?page=0`),
				fetch(`${API_BASE}/shows?page=1`),
			]);
			const [d0, d1] = await Promise.all([r0.json(), r1.json()]);
			allShows = [...d0, ...d1];

			buildHeroCarousel(allShows);
			buildNowWatchingCarousel(allShows);
			applyFiltersAndSort();
		} catch (err) {
			['grid-all','grid-drama','grid-comedy','grid-action'].forEach(id => {
				const el = document.getElementById(id);
				if (el) el.innerHTML = '<div class="no-results">Failed to load data. Check your connection.</div>';
			});
		}
	}

	updateWatchlistBadge();
	renderWatchlistPanel();

	const urlQ = new URLSearchParams(location.search).get("q");
	if (urlQ) {
		document.getElementById("searchInput").value = urlQ;
		document.getElementById("headerSearchInput").value = urlQ;
	}

	fetchShows();

	(function() {
		const headerBtn = document.querySelector('.header__btn');
		const menu      = document.querySelector('.menu');
		if (headerBtn && menu) {
			headerBtn.addEventListener('click', () => {
				headerBtn.classList.toggle('header__btn--active');
				menu.classList.toggle('menu--active');
			});
		}

		if (document.getElementById('plan-modal')) {
			const modalEl = document.getElementById('plan-modal');
			modalEl.addEventListener('show.bs.modal', () => {
				if (window.innerWidth > 1200) {
					const header = document.querySelector('.header');
					const sw = window.innerWidth - document.documentElement.clientWidth;
					header.style.paddingRight = sw + 'px';
				}
			});
			modalEl.addEventListener('hidden.bs.modal', () => {
				if (window.innerWidth > 1200) {
					document.querySelector('.header').style.paddingRight = '';
				}
			});
		}
	})();