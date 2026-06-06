const state = {
  scanData: null,
  journal: [],
  tg: { botToken: '', chatId: '' }
};

function $(sel, el = document) { return el.querySelector(sel); }
function $$(sel, el = document) { return [...el.querySelectorAll(sel)]; }

$$('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.tab').forEach(b => b.classList.remove('active'));
    $$('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.tab;
    $(`#${target}`).classList.add('active');
  });
});

async function api(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  return res.json();
}

$('#scanBtn').addEventListener('click', async () => {
  const sort = $('#scannerSort').value;
  const box = $('#scannerResult');
  box.innerHTML = '<p class="muted">Scanning...</p>';
  try {
    const data = await api(`/api/scan?timeframe=${sort}`);
    state.scanData = data;
    if (!data || !data.length) {
      box.innerHTML = '<p class="muted">Tidak ada hasil.</p>';
      return;
    }
    box.innerHTML = `
      <div class="list">
        ${data.map(row => `
          <div class="item">
            <strong>${row.symbol}</strong>
            <span class="${row.change >= 0 ? 'green' : 'red'}">${row.change}%</span>
            <span class="muted">vol ${row.volume}</span>
          </div>
        `).join('')}
      </div>
    `;
  } catch (e) {
    box.innerHTML = `<p class="red">Gagal scan: ${e.message}</p>`;
  }
});

$('#journalForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const entry = {
    symbol: form.get('symbol'),
    entry: Number(form.get('entry')),
    exit: form.get('exit') ? Number(form.get('exit')) : null,
    capital: Number(form.get('capital')),
    notes: form.get('notes') || ''
  };
  state.journal.unshift(entry);
  localStorage.setItem('hc_journal', JSON.stringify(state.journal));
  renderJournal();
  e.target.reset();
});

function renderJournal() {
  const list = $('#journalList');
  if (!state.journal.length) {
    list.innerHTML = '<p class="muted">Belum ada jurnal.</p>';
    return;
  }
  list.innerHTML = state.journal.map((t, i) => {
    const pnl = t.exit == null ? 'Open' : ((t.exit - t.entry) / t.entry * 100).toFixed(2) + '%';
    const cls = pnl === 'Open' ? 'muted' : (Number(pnl) >= 0 ? 'green' : 'red');
    return `
      <div class="item">
        <div><strong>${t.symbol}</strong> <span class="${cls}">${pnl}</span></div>
        <div class="muted">entry ${t.entry} | exit ${t.exit ?? '-'} | capital ${t.capital}</div>
        <div class="muted">${t.notes}</div>
      </div>
    `;
  }).join('');
}

$('#tgForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  state.tg = {
    botToken: form.get('botToken'),
    chatId: form.get('chatId')
  };
  localStorage.setItem('hc_tg', JSON.stringify(state.tg));
  alert('Konfigurasi Telegram disimpan.');
});

(function init() {
  try {
    state.journal = JSON.parse(localStorage.getItem('hc_journal') || '[]');
  } catch {}
  try {
    state.tg = JSON.parse(localStorage.getItem('hc_tg') || '{}');
  } catch {}
  renderJournal();
})();
