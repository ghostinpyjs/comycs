// admin.js
const ADMIN_ID = "76561199851942884";
let allPlayers  = [];
let allListings = [];

async function initAdmin() {
  const user = AUTH.getUser();
  const id   = user?.steam_id || user?.steamid;

  document.getElementById('admin-loading')?.classList.add('hidden');

  if (!user || id !== ADMIN_ID) {
    document.getElementById('admin-denied')?.classList.remove('hidden');
    return;
  }

  document.getElementById('admin-content')?.classList.remove('hidden');
  await Promise.all([loadStats(), loadPlayers(), loadListings()]);

  document.getElementById('admin-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    renderPlayers(q ? allPlayers.filter(p => p.nick?.toLowerCase().includes(q)) : allPlayers);
  });
}

async function loadStats() {
  try {
    const [pRes, mRes] = await Promise.all([
      fetch('/ranking-api?limit=1000'),
      fetch('/api/market-list'),
    ]);
    const pData = await pRes.json();
    const mData = mRes.ok ? await mRes.json() : { listings: [] };
    const players  = pData.players  || [];
    const listings = mData.listings || [];
    const active   = listings.filter(l => l.status === 'active').length;
    const totalVal = players.reduce((s, p) => s + (p.inventory_value || 0), 0);
    const banned   = players.filter(p => p.banned).length;
    const avgHours = players.length ? Math.round(players.reduce((s,p) => s + (p.hours||0), 0) / players.length) : 0;

    document.getElementById('admin-stats').innerHTML = `
      <div class="stat-box"><div class="stat-box-num">${players.length}</div><div class="stat-box-label">Jogadores</div></div>
      <div class="stat-box"><div class="stat-box-num">${banned}</div><div class="stat-box-label">Banidos</div></div>
      <div class="stat-box"><div class="stat-box-num">${listings.length}</div><div class="stat-box-label">Anúncios Total</div></div>
      <div class="stat-box"><div class="stat-box-num">${active}</div><div class="stat-box-label">Anúncios Ativos</div></div>
      <div class="stat-box"><div class="stat-box-num">$${totalVal.toFixed(0)}</div><div class="stat-box-label">Val. Inventários</div></div>
      <div class="stat-box"><div class="stat-box-num">${avgHours}h</div><div class="stat-box-label">Média de Horas</div></div>
    `;
  } catch (e) { console.error(e); }
}

async function loadPlayers() {
  try {
    const res  = await fetch('/ranking-api?limit=1000');
    const data = await res.json();
    allPlayers = data.players || [];
    renderPlayers(allPlayers);
  } catch (e) { console.error(e); }
}

function renderPlayers(players) {
  const tbody = document.getElementById('admin-players-tbody');
  if (!tbody) return;
  if (!players.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-dim)">Nenhum jogador.</td></tr>';
    return;
  }
  tbody.innerHTML = players.map(p => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:.6rem">
          <img src="${p.avatar||''}" style="width:32px;height:32px;border-radius:4px"
               onerror="this.src='https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_medium.jpg'">
          <a href="/jogador.html?id=${p.steam_id}" style="color:var(--text-primary)">${escHtml(p.nick)}</a>
        </div>
      </td>
      <td style="font-family:monospace;font-size:.78rem;color:var(--text-dim)">${p.steam_id}</td>
      <td>${p.hours || 0}h</td>
      <td>${p.kd || '—'}</td>
      <td>$${(p.inventory_value||0).toFixed(2)}</td>
      <td><span class="${p.banned ? 'badge-banned' : 'badge-active'}">${p.banned ? '⛔ BANIDO' : '✓ ATIVO'}</span></td>
      <td style="display:flex;gap:.4rem;flex-wrap:wrap">
        ${p.steam_id !== ADMIN_ID ? `
          <button class="${p.banned ? 'btn-success' : 'btn-danger'}" onclick="toggleBan('${p.steam_id}',${!p.banned})">
            ${p.banned ? 'Desbanir' : 'Banir'}
          </button>
          <button class="btn-danger" onclick="deletePlayer('${p.steam_id}')">Deletar</button>
        ` : '<span style="color:var(--orange);font-size:.8rem">👑 Admin</span>'}
      </td>
    </tr>
  `).join('');
}

async function loadListings() {
  try {
    const res  = await fetch('/api/market-list');
    if (!res.ok) return;
    const data = await res.json();
    allListings = data.listings || [];
    renderListings(allListings);
  } catch (e) { console.error(e); }
}

function renderListings(listings) {
  const tbody = document.getElementById('admin-market-tbody');
  if (!tbody) return;
  if (!listings.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-dim)">Nenhum anúncio.</td></tr>';
    return;
  }
  tbody.innerHTML = listings.map(l => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:.6rem">
          ${l.item_icon ? `<img src="https://community.cloudflare.steamstatic.com/economy/image/${l.item_icon}/60fx45f" style="height:36px">` : '🔫'}
          <span style="font-size:.85rem">${escHtml(l.item_name)}</span>
        </div>
      </td>
      <td style="font-size:.8rem">${escHtml(l.nick || l.steam_id)}</td>
      <td><span style="color:var(--orange);font-weight:700">$${parseFloat(l.price_usd).toFixed(2)}</span></td>
      <td><span class="${l.status==='active'?'badge-active':'badge-banned'}">${l.status==='active'?'✓ Ativo':'✕ Removido'}</span></td>
      <td style="font-size:.8rem;color:var(--text-dim)">${l.created_at ? new Date(l.created_at).toLocaleDateString('pt-BR') : '—'}</td>
      <td>${l.status==='active' ? `<button class="btn-danger" onclick="removeListing('${l.id}')">Remover</button>` : '—'}</td>
    </tr>
  `).join('');
}

async function toggleBan(steamId, ban) {
  if (!confirm(`${ban?'Banir':'Desbanir'} este jogador?`)) return;
  await fetch('/api/admin-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'ban', steam_id: steamId, value: ban, admin_id: ADMIN_ID }),
  });
  await loadPlayers();
  await loadStats();
}

async function deletePlayer(steamId) {
  if (!confirm('Deletar permanentemente?')) return;
  await fetch('/api/admin-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', steam_id: steamId, admin_id: ADMIN_ID }),
  });
  await loadPlayers();
  await loadStats();
}

async function removeListing(id) {
  if (!confirm('Remover este anúncio?')) return;
  await fetch('/api/admin-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'remove_listing', id, admin_id: ADMIN_ID }),
  });
  await loadListings();
  await loadStats();
}

function showTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById(`tab-${tab}`)?.classList.add('active');
}

if (document.getElementById('admin-page')) {
  document.addEventListener('DOMContentLoaded', initAdmin);
}
