  const API = 'https://api.tvmaze.com';
  let show = null;
  let wl   = JSON.parse(localStorage.getItem('cinema_watchlist') || '[]');

  function saveWL() { localStorage.setItem('cinema_watchlist', JSON.stringify(wl)); }
  function inWL(id) { return wl.includes(id); }

  function toggleWL() {
    if (!show) return;
    const idx = wl.indexOf(show.id);
    if (idx === -1) wl.push(show.id);
    else wl.splice(idx, 1);
    saveWL();
    refreshBtn();
    document.getElementById('wlBadge').textContent = wl.length;
  }

  function refreshBtn() {
    const btn = document.getElementById('wlBtn');
    if (!btn) return;
    const saved = inWL(show.id);
    btn.className = saved ? 'btn-gold saved' : 'btn-gold outline';
    btn.innerHTML = saved
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> In Watchlist'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Add to Watchlist';
  }

  function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function noTags(s) { return (s||'').replace(/<[^>]+>/g,''); }
  function stars(r) {
    if (!r) return '&#9734;&#9734;&#9734;&#9734;&#9734;';
    const f = Math.round(r / 2);
    return '&#9733;'.repeat(f) + '&#9734;'.repeat(5 - f);
  }

  function render(data) {
    show = data;
    document.title = data.name + ' \u2014 CIN\u00C9MA';
    document.getElementById('bcTitle').textContent = data.name;
    document.getElementById('wlBadge').textContent = wl.length;

    const rating  = data.rating?.average;
    const genres  = data.genres || [];
    const summary = noTags(data.summary) || 'No description available.';
    const poster  = data.image?.original || data.image?.medium || '';
    const year    = (data.premiered || '').slice(0, 4);
    const ended   = data.ended ? data.ended.slice(0, 4) : null;
    const network = data.network?.name || data.webChannel?.name || '';
    const country = data.network?.country?.name || '';
    const isRun   = data.status === 'Running';
    const isEnd   = data.status === 'Ended';
    const stClass = isRun ? 'green' : isEnd ? 'red' : '';
    const stTxt   = isRun ? 'Running' : isEnd ? 'Ended' : (data.status || '—');
    const dotCls  = isRun ? 'running' : isEnd ? 'ended' : 'other';
    const saved   = inWL(data.id);

    document.getElementById('root').innerHTML = `
      <!-- HERO -->
      <div class="hero-wrap">
        <div class="hero-bg" id="heroBg"></div>
        <div class="hero-overlay"></div>
        <div class="hero-inner">
          <div class="poster-wrap">
            ${poster
              ? `<img class="poster-img" src="${esc(poster)}" alt="${esc(data.name)}">`
              : `<div class="poster-ph">${esc(data.name[0])}</div>`}
          </div>
          <div class="info-col">
            ${genres.length ? `<div class="genre-row">${genres.map(g=>`<span class="genre-pill">${esc(g)}</span>`).join('')}</div>` : ''}
            <h1 class="show-title">${esc(data.name)}</h1>
            ${network ? `<p class="show-tagline">${esc(network)}${country ? ' &middot; ' + esc(country) : ''}</p>` : ''}
            <div class="stats-row">
              ${rating ? `<div><div class="stat-val">&#9733; ${rating.toFixed(1)}</div><div class="stat-lbl">Rating</div></div>` : ''}
              ${year   ? `<div><div class="stat-val">${esc(year)}${ended && ended !== year ? '&ndash;' + esc(ended) : ''}</div><div class="stat-lbl">Year</div></div>` : ''}
              ${data.runtime ? `<div><div class="stat-val">${data.runtime}</div><div class="stat-lbl">Min / Ep</div></div>` : ''}
              <div><div class="stat-val ${stClass}">${esc(stTxt)}</div><div class="stat-lbl">Status</div></div>
            </div>
            <div class="action-row">
              <button class="btn-gold${saved ? ' saved' : ' outline'}" id="wlBtn" onclick="toggleWL()">
                ${saved
                  ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> In Watchlist'
                  : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> Add to Watchlist'}
              </button>
              <a class="btn-ghost" href="${esc(data.officialSite || data.url || '#')}" target="_blank" rel="noopener">
                View on TVMaze &#x2197;
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- BODY -->
      <div class="body-wrap">
        <div>
          <p class="sec-title">About</p>
          <p class="summary-p">${esc(summary)}</p>
          <p class="sec-title">Details</p>
          <div class="meta-grid">
            <div class="meta-item"><label>Type</label><span>${esc(data.type||'—')}</span></div>
            <div class="meta-item"><label>Language</label><span>${esc(data.language||'—')}</span></div>
            <div class="meta-item"><label>Network</label><span>${esc(network||'—')}</span></div>
            <div class="meta-item"><label>Country</label><span>${esc(country||'—')}</span></div>
            <div class="meta-item"><label>Premiered</label><span>${esc(data.premiered||'—')}</span></div>
            <div class="meta-item"><label>Ended</label><span>${esc(data.ended||(isRun?'Still Running':'—'))}</span></div>
            ${data.averageRuntime ? `<div class="meta-item"><label>Avg Runtime</label><span>${data.averageRuntime} min</span></div>` : ''}
            ${data.weight ? `<div class="meta-item"><label>Popularity</label><span>${data.weight} / 100</span></div>` : ''}
          </div>
        </div>

        <div class="sidebar">
          ${rating ? `
          <div class="sidebar-box">
            <p class="sec-title">Rating</p>
            <div class="rating-big">
              <div class="rating-num">${rating.toFixed(1)}</div>
              <div class="rating-stars">${stars(rating)}</div>
              <div class="rating-sub">TVMaze Score</div>
            </div>
          </div>` : ''}

          <div class="sidebar-box">
            <p class="sec-title">Schedule</p>
            <div class="status-indicator">
              <span class="dot ${dotCls}"></span>
              <span>${esc(stTxt)}</span>
            </div>
            <div class="sidebar-meta">
              ${data.schedule?.time ? `<div class="sm-row"><span class="sm-lbl">Time</span><span class="sm-val">${esc(data.schedule.time)}</span></div>` : ''}
              ${data.schedule?.days?.length ? `<div class="sm-row"><span class="sm-lbl">Days</span><span class="sm-val">${esc(data.schedule.days.join(', '))}</span></div>` : ''}
              ${data.runtime ? `<div class="sm-row"><span class="sm-lbl">Duration</span><span class="sm-val">${data.runtime} min</span></div>` : ''}
            </div>
          </div>

          ${genres.length ? `
          <div class="sidebar-box">
            <p class="sec-title">Genres</p>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${genres.map(g=>`<span class="genre-pill">${esc(g)}</span>`).join('')}
            </div>
          </div>` : ''}
        </div>
      </div>
    `;

    if (poster) document.getElementById('heroBg').style.backgroundImage = `url('${poster}')`;
    refreshBtn();
  }

  async function load() {
    const id = new URLSearchParams(location.search).get('id');
    if (!id) {
      document.getElementById('root').innerHTML = `
        <div class="err-state">
          <h3>No ID Found</h3>
          <p>Show ID missing from URL.</p>
          <a class="btn-gold outline" href="movies.html" style="margin-top:20px">&#x2190; Back to Catalog</a>
        </div>`;
      return;
    }
    try {
      const res = await fetch(`${API}/shows/${id}`);
      if (!res.ok) throw new Error();
      render(await res.json());
    } catch {
      document.getElementById('root').innerHTML = `
        <div class="err-state">
          <h3>Could Not Load</h3>
          <p>Show not found or network error.</p>
          <a class="btn-gold outline" href="movies.html" style="margin-top:20px">&#x2190; Back to Catalog</a>
        </div>`;
    }
  }

  document.getElementById('wlBadge').textContent = wl.length;
  load();