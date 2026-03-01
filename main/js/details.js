const API = 'https://api.tvmaze.com';
let WL   = JSON.parse(localStorage.getItem('flixgo_wl') || '[]');
let pool = [];  

const esc  = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const txt  = s => (s||'').replace(/<[^>]+>/g,'');
const inWL = id => WL.some(w => w.id === id);
const save = () => localStorage.setItem('flixgo_wl', JSON.stringify(WL));
const q    = k  => new URLSearchParams(location.search).get(k);

const PLAY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18.54,9,8.88,3.46a3.42,3.42,0,0,0-5.13,3V17.58A3.42,3.42,0,0,0,7.17,21a3.43,3.43,0,0,0,1.71-.46L18.54,15a3.42,3.42,0,0,0,0-5.92Zm-1,4.19L7.88,18.81a1.44,1.44,0,0,1-1.42,0,1.42,1.42,0,0,1-.71-1.23V6.42a1.42,1.42,0,0,1,.71-1.23A1.51,1.51,0,0,1,7.17,5a1.54,1.54,0,0,1,.71.19l9.66,5.58a1.42,1.42,0,0,1,0,2.46Z"/></svg>`;
const BM   = `<svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;

function toggleWL(show) {
	const i = WL.findIndex(w => w.id === show.id);
	if (i === -1) WL.push({ id:show.id, name:show.name, image:show.image?.medium||'', rating:show.rating?.average||null, year:(show.premiered||'').slice(0,4) });
	else WL.splice(i,1);
	save();
	renderBadge();
	renderWLPanel();
	document.querySelectorAll(`.item__bookmark[data-id="${show.id}"]`).forEach(b => b.classList.toggle('active', inWL(show.id)));
	const mb = document.getElementById('mainWLBtn');
	if (mb) refreshMainBtn(show.id);
}

function renderBadge() {
	const el = document.getElementById('wlCount');
	if (el) el.textContent = WL.length;
}

function renderWLPanel() {
	const body = document.getElementById('wlBody');
	if (!WL.length) { body.innerHTML = '<div class="wl-empty">Your watchlist is empty.<br>Bookmark any show to save it here.</div>'; return; }
	body.innerHTML = WL.map(w => `
		<div class="wl-card" data-id="${w.id}">
			<img src="${esc(w.image)}" alt="${esc(w.name)}" onerror="this.style.visibility='hidden'">
			<div class="wl-card-info">
				<div class="wl-card-name">${esc(w.name)}</div>
				<div class="wl-card-meta">${w.year||''}${w.year&&w.rating?' · ':''}${w.rating?'★ '+w.rating:''}</div>
			</div>
			<button class="wl-card-rm" data-id="${w.id}">✕</button>
		</div>`).join('');
	body.querySelectorAll('.wl-card').forEach(el => el.addEventListener('click', e => {
		if (!e.target.closest('.wl-card-rm')) location.href = `details.html?id=${el.dataset.id}`;
	}));
	body.querySelectorAll('.wl-card-rm').forEach(btn => btn.addEventListener('click', e => {
		e.stopPropagation();
		WL = WL.filter(w => w.id !== +btn.dataset.id);
		save(); renderBadge(); renderWLPanel();
		document.querySelectorAll(`.item__bookmark[data-id="${btn.dataset.id}"]`).forEach(b => b.classList.remove('active'));
	}));
}

function refreshMainBtn(id) {
	const btn = document.getElementById('mainWLBtn');
	if (!btn) return;
	const on = inWL(id);
	btn.className = 'btn-wl' + (on ? ' active' : '');
	btn.innerHTML = `<svg viewBox="0 0 24 24" fill="${on?'currentColor':'none'}" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>${on ? 'In Watchlist' : 'Add to Watchlist'}`;
}

document.getElementById('wlToggle').addEventListener('click', () => document.getElementById('wlPanel').classList.toggle('open'));
document.getElementById('wlClose').addEventListener('click',  () => document.getElementById('wlPanel').classList.remove('open'));

function renderDetails(show, cast, episodes) {
	const rating  = show.rating?.average;
	const year    = (show.premiered||'').slice(0,4);
	const ended   = (show.ended||'').slice(0,4);
	const genres  = show.genres||[];
	const summary = txt(show.summary) || 'No description available.';
	const poster  = show.image?.original || show.image?.medium || '';
	const on      = inWL(show.id);

	// seasons
	const seasons = {};
	(episodes||[]).forEach(ep => { if (!seasons[ep.season]) seasons[ep.season]=[]; seasons[ep.season].push(ep); });
	const snums = Object.keys(seasons).map(Number).sort((a,b)=>a-b);

	const seasonsHTML = snums.map((sn,i) => `
		<div class="season-block ${i===0?'open':''}">
			<button class="season-toggle" onclick="this.closest('.season-block').classList.toggle('open')">
				<span>Season ${sn} <small style="color:rgba(255,255,255,.4);font-weight:400">(${seasons[sn].length} ep)</small></span>
				<svg class="season-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
			</button>
			<div class="season-eps">
				<div class="season-eps-inner">
					${seasons[sn].slice(0,20).map(ep=>`
						<div class="ep-row">
							<span class="ep-num">E${ep.number||'?'}</span>
							<span class="ep-name">${esc(ep.name||'TBA')}</span>
							${ep.runtime?`<span class="ep-rt">${ep.runtime}m</span>`:''}
						</div>`).join('')}
					${seasons[sn].length>20?`<div class="ep-row" style="justify-content:center;color:rgba(255,255,255,.3)">+${seasons[sn].length-20} more</div>`:''}
				</div>
			</div>
		</div>`).join('');

	const castHTML = cast.slice(0,8).map(c=>`
		<div class="cast-person">
			<img src="${esc(c.person?.image?.medium||'')}" alt="${esc(c.person?.name||'')}" onerror="this.style.visibility='hidden'">
			<span>${esc(c.person?.name||'')}</span>
		</div>`).join('');

	document.getElementById('root').innerHTML = `
		<div class="details__bg" id="detailsBg">
			<div class="details__bg-img" id="detailsBgImg"></div>
			<div class="container">
				<div class="row">
					<div class="col-12">
						<a href="index.html" class="back-link">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 12H5M12 5l-7 7 7 7"/></svg>
							Back to catalog
						</a>
					</div>

					<div class="col-12 col-xl-9">
						<div class="details__layout">
							<div class="details__poster">
								<img src="${esc(poster||'img/covers/1.png')}" alt="${esc(show.name)}">
							</div>
							<div class="details__info">
								<h1 class="details__title">${esc(show.name)}</h1>

								<div class="details__badges">
									${rating ? `<span class="badge-rate">★ ${rating}</span>` : ''}
									${show.type ? `<span class="badge-tag">${esc(show.type)}</span>` : ''}
									${show.language ? `<span class="badge-tag">${esc(show.language)}</span>` : ''}
									${show.status==='Running' ? `<span class="badge-on">● Running</span>` : show.status ? `<span class="badge-off">■ ${esc(show.status)}</span>` : ''}
								</div>

								${genres.length ? `<div class="details__genres">${genres.map(g=>`<a href="index.html">${esc(g)}</a>`).join('')}</div>` : ''}

								<p class="details__summary">${esc(summary)}</p>

								<ul class="details__meta">
									${year ? `<li><b>Premiered:</b> ${esc(year)}${ended&&ended!==year?' – '+esc(ended):''}</li>` : ''}
									${show.network?.name ? `<li><b>Network:</b> ${esc(show.network.name)}</li>` : ''}
									${show.runtime ? `<li><b>Runtime:</b> ${show.runtime} min/ep</li>` : ''}
									${snums.length ? `<li><b>Seasons:</b> ${snums.length}</li>` : ''}
									${episodes?.length ? `<li><b>Episodes:</b> ${episodes.length}</li>` : ''}
									${show.weight ? `<li><b>Popularity:</b> ${show.weight}/100</li>` : ''}
									${show.officialSite ? `<li><b>Website:</b> <a href="${esc(show.officialSite)}" target="_blank" rel="noopener">Visit ↗</a></li>` : ''}
								</ul>

								<div class="details__actions">
									<a href="${esc(show.officialSite||'#')}" ${show.officialSite?'target="_blank" rel="noopener"':''} class="btn-play">
										${PLAY} Watch Now
									</a>
									<button class="btn-wl ${on?'active':''}" id="mainWLBtn">
										<svg viewBox="0 0 24 24" fill="${on?'currentColor':'none'}" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
										${on ? 'In Watchlist' : 'Add to Watchlist'}
									</button>
								</div>
							</div>
						</div>
					</div>

					<div class="col-12 col-xl-3">
						<div class="details__sidebar">
							${castHTML ? `<p class="sidebar-label">Cast</p><div class="cast-grid">${castHTML}</div>` : ''}
							${seasonsHTML ? `<p class="sidebar-label">Episodes</p>${seasonsHTML}` : ''}
						</div>
					</div>
				</div>
			</div>
		</div>`;

	if (poster) {
		document.getElementById('detailsBgImg').style.backgroundImage = `url('${poster}')`;
	}

	document.getElementById('mainWLBtn').addEventListener('click', () => toggleWL(show));

	document.title = `${show.name} – FlixGo`;
}

let relSplide = null;
function buildRelated(currentId) {
	const shows = pool.filter(s => s.id !== currentId)
		.sort((a,b) => (b.rating?.average||0)-(a.rating?.average||0))
		.slice(0, 14);
	if (!shows.length) return;

	document.getElementById('relList').innerHTML = shows.map(s => {
		const img = s.image?.medium||s.image?.original||'';
		return `
			<li class="splide__slide">
				<div class="item item--carousel">
					<a href="details.html?id=${s.id}" class="item__cover">
						${img?`<img src="${esc(img)}" alt="${esc(s.name)}" loading="lazy">`:`<img src="img/covers/1.png" alt="${esc(s.name)}">`}
						<span class="item__play">${PLAY}</span>
					</a>
					<button class="item__bookmark ${inWL(s.id)?'active':''}" data-id="${s.id}">${BM}</button>
					<div class="item__content">
						<h3 class="item__title"><a href="details.html?id=${s.id}">${esc(s.name)}</a></h3>
						<span class="item__category">${(s.genres||[]).slice(0,2).map(g=>`<a href="index.html">${esc(g)}</a>`).join('')}</span>
						<span class="item__rate">${s.rating?.average||'—'}</span>
					</div>
				</div>
			</li>`;
	}).join('');

	document.querySelectorAll('#relList .item__bookmark').forEach(btn => {
		btn.addEventListener('click', e => {
			e.preventDefault(); e.stopPropagation();
			const show = pool.find(s => s.id === +btn.dataset.id);
			if (show) toggleWL(show);
		});
	});

	document.getElementById('relSec').style.display = 'block';
	if (relSplide) relSplide.destroy();
	relSplide = new Splide('#relCarousel',{
		type:'loop', perPage:6, drag:true, pagination:false, speed:800, gap:24,
		breakpoints:{ 575:{perPage:2,gap:14,pagination:true}, 767:{perPage:3,gap:18,pagination:true}, 991:{perPage:4,gap:20,pagination:true}, 1199:{perPage:5,gap:22,pagination:true} }
	}).mount();
}

async function load() {
	const id = q('id');
	if (!id) { document.getElementById('root').innerHTML = `<div class="page-loader"><p>No show ID. <a href="index.html" style="color:#f5c518">← Go back</a></p></div>`; return; }
	try {
		const [showRes, poolRes] = await Promise.all([
			fetch(`${API}/shows/${id}?embed[]=cast&embed[]=episodes`),
			fetch(`${API}/shows?page=0`)
		]);
		if (!showRes.ok) throw new Error();
		const show = await showRes.json();
		pool = await poolRes.json();
		renderDetails(show, show._embedded?.cast||[], show._embedded?.episodes||[]);
		buildRelated(show.id);
		renderBadge(); renderWLPanel();
	} catch {
		document.getElementById('root').innerHTML = `<div class="page-loader"><p>Failed to load. <a href="index.html" style="color:#f5c518">← Go back</a></p></div>`;
	}
}

function doSearch(e) {
	e.preventDefault();
	const v = document.getElementById('hSearch')?.value.trim();
	if (v) location.href = `index.html?q=${encodeURIComponent(v)}`;
}

document.querySelector('.header__btn')?.addEventListener('click', () => {
	document.querySelector('.header__btn').classList.toggle('header__btn--active');
	document.querySelector('.menu').classList.toggle('menu--active');
});

renderBadge(); renderWLPanel(); load();