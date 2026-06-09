
// Sheet config
const SHEET_ICONS = {
  'Both':'🔵','Bothold':'🟤','All':'📋','Owned':'✅','ورقة2':'💰','Sheet1':'📄','فاتورة':'🧾','Bills':'🛒','Mother':'⭐'
};
const SHEET_LABELS = {
  'Both':'Both','Bothold':'Bothold','All':'All','Owned':'Owned','ورقة2':'ورقة2','Sheet1':'Sheet1','فاتورة':'فاتورة','Bills':'Bills','Mother':'Mother'
};

// State
let state = {
  activeSheet: 'Both',
  search: '',
  filterTheme: '',
  filterStore: '',
  filterOpen: '',
  page: 1,
  pageSize: 30,
  data: {},
  editIdx: null
};

// Init data
for (const [sh, v] of Object.entries(RAW)) {
  state.data[sh] = v.rows.map((r,i) => ({...r, _id: i}));
}

// ─── HELPERS ─────────────────────────────────────────────
function getCol(sh) { return RAW[sh]?.columns || []; }
function getRows(sh) { return state.data[sh] || []; }

function fmtDate(v) {
  if (!v) return '';
  const s = String(v);
  if (s.includes('-') || s.includes('/')) return s.split('T')[0].split(' ')[0];
  // Excel serial
  const n = parseFloat(s);
  if (!isNaN(n) && n > 40000 && n < 60000) {
    const d = new Date(Date.UTC(1900,0,1) + (n-2)*86400000);
    return d.toISOString().split('T')[0];
  }
  return s;
}

function fmtNum(v) {
  if (v === null || v === undefined || v === '') return '';
  const n = parseFloat(v);
  if (isNaN(n)) return v;
  return n % 1 === 0 ? n.toLocaleString() : n.toFixed(2);
}

function openBadge(v) {
  if (!v) return '';
  const s = String(v).trim();
  if (s === 'Open') return `<span class="badge badge-open">Open</span>`;
  if (s === '✳️') return `<span class="badge badge-star">✳️</span>`;
  if (s === 'ANOTHER') return `<span class="badge badge-another">ANOTHER</span>`;
  return `<span class="badge badge-owned">${s}</span>`;
}

function toast(msg, err=false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (err?' error':'');
  setTimeout(() => t.className = 'toast', 2200);
}

// ─── TABS ─────────────────────────────────────────────────
function renderTabs() {
  const c = document.getElementById('tabsContainer');
  c.innerHTML = Object.keys(RAW).map(sh => `
    <div class="tab ${sh===state.activeSheet?'active':''}" onclick="switchSheet('${sh}')">
      ${SHEET_ICONS[sh]||'📄'} ${sh}
    </div>`).join('') + `<div class="tab" onclick="showDashboard()" id="tab-dash" style="${state.activeSheet==='__dash'?'color:var(--yellow);border-bottom:3px solid var(--yellow)':''}">📊 Dashboard</div>`;
}

function switchSheet(sh) {
  state.activeSheet = sh;
  state.search = '';
  state.filterTheme = '';
  state.filterStore = '';
  state.filterOpen = '';
  state.page = 1;
  state.editIdx = null;
  renderTabs();
  renderContent();
}

// ─── HEADER STATS ─────────────────────────────────────────
function updateHeaderStats() {
  const total = Object.values(state.data).reduce((a,v)=>a+v.length,0);
  document.getElementById('hdr-total').textContent = total.toLocaleString() + ' records';
}

// ─── DASHBOARD ────────────────────────────────────────────
function showDashboard() {
  state.activeSheet = '__dash';
  renderTabs();
  const owned = getRows('Owned');
  const both = getRows('Both');
  const mother = getRows('Mother');

  // Theme breakdown
  const themeCounts = {};
  for (const r of [...owned, ...mother]) {
    const t = r.theme || r['theme'] || '';
    if (t) themeCounts[t] = (themeCounts[t]||0) + 1;
  }
  const sortedThemes = Object.entries(themeCounts).sort((a,b)=>b[1]-a[1]);
  const maxTh = sortedThemes[0]?.[1] || 1;

  // Total spend
  let totalSpend = 0;
  for (const r of owned) {
    const v = parseFloat(r['Price BUY'] || r['Price'] || 0);
    if (!isNaN(v)) totalSpend += v;
  }

  document.getElementById('mainContent').innerHTML = `
    <div class="dash-grid">
      <div class="dash-card"><div class="label">Total Records</div><div class="value">${Object.values(state.data).reduce((a,v)=>a+v.length,0).toLocaleString()}</div><div class="sub">Across all sheets</div></div>
      <div class="dash-card"><div class="label">Owned Sets</div><div class="value">${owned.length}</div><div class="sub">In Owned sheet</div></div>
      <div class="dash-card"><div class="label">Mother Sets</div><div class="value">${mother.length}</div><div class="sub">Original collection</div></div>
      <div class="dash-card"><div class="label">Est. Spend</div><div class="value">${totalSpend.toFixed(0)}</div><div class="sub">KWD / from Owned</div></div>
    </div>
    <div class="dash-card">
      <div class="label" style="margin-bottom:12px">🎨 Sets by Theme</div>
      <div class="theme-list">
        ${sortedThemes.map(([t,c])=>`
          <div class="theme-row">
            <span>${t}</span>
            <div style="display:flex;align-items:center;gap:8px">
              <div class="theme-bar-wrap"><div class="theme-bar" style="width:${Math.round(c/maxTh*100)}%"></div></div>
              <span style="color:var(--yellow);font-weight:700;min-width:28px;text-align:right">${c}</span>
            </div>
          </div>`).join('')}
      </div>
    </div>
    <div style="margin-top:12px">
      <div class="dash-card">
        <div class="label" style="margin-bottom:10px">📦 Sheets Summary</div>
        ${Object.entries(state.data).map(([sh,rows])=>`
          <div class="theme-row">
            <span>${SHEET_ICONS[sh]||'📄'} ${sh}</span>
            <span style="color:var(--yellow);font-weight:700">${rows.length} rows</span>
          </div>`).join('')}
      </div>
    </div>
  `;
}

// ─── MAIN CONTENT ─────────────────────────────────────────
function renderContent() {
  if (state.activeSheet === '__dash') { showDashboard(); return; }
  const sh = state.activeSheet;
  const cols = getCol(sh);
  let rows = getRows(sh);

  // Search
  if (state.search) {
    const q = state.search.toLowerCase();
    rows = rows.filter(r => Object.values(r).some(v => String(v||'').toLowerCase().includes(q)));
  }
  // Filter theme
  if (state.filterTheme) rows = rows.filter(r => String(r.theme||r['theme']||'') === state.filterTheme);
  // Filter store
  if (state.filterStore) rows = rows.filter(r => String(r.STORE||r['Store']||'') === state.filterStore);
  // Filter open
  if (state.filterOpen) rows = rows.filter(r => String(r.Open||'').trim() === state.filterOpen);

  // Pagination
  const total = rows.length;
  const pages = Math.ceil(total / state.pageSize) || 1;
  if (state.page > pages) state.page = 1;
  const start = (state.page-1)*state.pageSize;
  const paged = rows.slice(start, start+state.pageSize);

  // Get unique themes & stores for filters
  const allRows = getRows(sh);
  const themes = [...new Set(allRows.map(r=>r.theme||r['theme']).filter(Boolean))].sort();
  const stores = [...new Set(allRows.map(r=>r.STORE||r['Store']).filter(Boolean))].sort();
  const hasOpen = cols.includes('Open');
  const hasTheme = cols.includes('theme');
  const hasStore = cols.includes('STORE') || cols.includes('Store');

  // Decide which cols to show (max 8 primary cols)
  const primaryCols = cols.slice(0, Math.min(cols.length, 10)).filter(c => !c.startsWith('Unnamed') && c !== 'URL');

  document.getElementById('mainContent').innerHTML = `
    <div class="toolbar">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" placeholder="Search in ${sh}..." value="${state.search}" oninput="onSearch(this.value)">
      </div>
      <button class="btn btn-primary" onclick="openAddModal()">+ Add</button>
      <button class="btn btn-export btn-sm" onclick="exportSheet()">⬇️ Export</button>
    </div>
    <div class="filter-row">
      ${hasTheme ? `<select class="filter-select" onchange="onFilterTheme(this.value)">
        <option value="">All Themes</option>
        ${themes.map(t=>`<option ${state.filterTheme===t?'selected':''} value="${t}">${t}</option>`).join('')}
      </select>` : ''}
      ${hasStore ? `<select class="filter-select" onchange="onFilterStore(this.value)">
        <option value="">All Stores</option>
        ${stores.map(s=>`<option ${state.filterStore===s?'selected':''} value="${s}">${s}</option>`).join('')}
      </select>` : ''}
      ${hasOpen ? `<select class="filter-select" onchange="onFilterOpen(this.value)" style="max-width:140px">
        <option value="">All Status</option>
        <option value="Open" ${state.filterOpen==='Open'?'selected':''}>Open</option>
        <option value="✳️" ${state.filterOpen==='✳️'?'selected':''}>✳️ Mother</option>
        <option value="ANOTHER" ${state.filterOpen==='ANOTHER'?'selected':''}>ANOTHER</option>
      </select>` : ''}
      ${state.search||state.filterTheme||state.filterStore||state.filterOpen ? `<button class="btn btn-secondary btn-sm" onclick="clearFilters()">✕ Clear</button>` : ''}
    </div>
    <div class="row-count">${total.toLocaleString()} records ${state.search||state.filterTheme||state.filterStore||state.filterOpen ? '(filtered)' : ''}</div>
    <div class="table-wrap" style="margin-top:8px">
      <table>
        <thead>
          <tr>
            <th>#</th>
            ${primaryCols.map(c=>`<th>${c}</th>`).join('')}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${paged.length === 0 ? `<tr><td colspan="${primaryCols.length+2}" class="no-data">No records found</td></tr>` :
            paged.map((r,i) => `
            <tr>
              <td class="row-num">${start+i+1}</td>
              ${primaryCols.map(c => {
                let v = r[c];
                if (c === 'Open') return `<td>${openBadge(v)}</td>`;
                if (c === 'Order Date' || c === 'Date') return `<td>${fmtDate(v)}</td>`;
                if (typeof v === 'number') return `<td>${fmtNum(v)}</td>`;
                return `<td>${v !== null && v !== undefined ? String(v).substring(0,50) : ''}</td>`;
              }).join('')}
              <td>
                <div class="action-btns">
                  <button class="btn btn-secondary btn-sm" onclick="openEditModal(${r._id})">✏️</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteRow(${r._id})">🗑</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="pagination">
      <span>${start+1}–${Math.min(start+state.pageSize,total)} of ${total}</span>
      <div class="page-btns">
        <button class="page-btn" onclick="goPage(${state.page-1})" ${state.page<=1?'disabled':''}>‹</button>
        ${Array.from({length:Math.min(pages,7)},(_,i)=>{
          const pg = pages<=7 ? i+1 : state.page<=4 ? i+1 : state.page>=pages-3 ? pages-6+i : state.page-3+i;
          return `<button class="page-btn ${pg===state.page?'active':''}" onclick="goPage(${pg})">${pg}</button>`;
        }).join('')}
        <button class="page-btn" onclick="goPage(${state.page+1})" ${state.page>=pages?'disabled':''}>›</button>
      </div>
      <select class="filter-select" style="max-width:90px;padding:5px 8px" onchange="state.pageSize=+this.value;state.page=1;renderContent()">
        ${[20,30,50,100].map(n=>`<option ${state.pageSize===n?'selected':''} value="${n}">${n}/page</option>`).join('')}
      </select>
    </div>
  `;
}

// ─── FILTERS ──────────────────────────────────────────────
function onSearch(v) { state.search=v; state.page=1; renderContent(); }
function onFilterTheme(v) { state.filterTheme=v; state.page=1; renderContent(); }
function onFilterStore(v) { state.filterStore=v; state.page=1; renderContent(); }
function onFilterOpen(v) { state.filterOpen=v; state.page=1; renderContent(); }
function clearFilters() { state.search=''; state.filterTheme=''; state.filterStore=''; state.filterOpen=''; state.page=1; renderContent(); }
function goPage(p) { state.page=p; renderContent(); }

// ─── MODAL FORM ───────────────────────────────────────────
function buildForm(sh, record={}) {
  const cols = getCol(sh).filter(c => !c.startsWith('Unnamed'));
  const themes = ['STAR WARS','Harry Potter','Speed Champions','CITY','Marvel Super Heroes','DC Comics Super Heroes','NINJAGO','Jurassic World','ICONS','Creator Expert','Ideas','Technic','FRIENDS','Super Mario','Disney','The Lord of the Rings','The Hobbit','ARCHITECTURE','Minecraft','Bionicle','Classic','Vidiyo','Dots','Elves','Nexo Knights','Pirates','Scooby-Doo','The LEGO Movie','The Simpsons'];
  const stores = ['Fantacy World','LEGO Store','Friday Market','Jarir Book','BRICKS','Person','Virgin','The Harry Potter Shop','LEGO Store Britsh','City Center','( Centerpoint )','The Entertainer'];
  const openOpts = ['','Open','✳️','ANOTHER'];

  const fields = cols.map(c => {
    const v = record[c] !== null && record[c] !== undefined ? record[c] : '';
    const isDate = c.toLowerCase().includes('date');
    const isTheme = c === 'theme';
    const isStore = c === 'STORE' || c === 'Store';
    const isOpen = c === 'Open';
    const isUrl = c === 'URL';
    const isNum = ['PCS','Price','Price BUY','Price2','Total Bill','%','N2','item #','Items','no','The Price'].includes(c);
    const isFull = isUrl || c==='item Name' || c==='subTheme';

    let input;
    if (isTheme) {
      input = `<select id="f_${c}" class="form-group"><option value="${v}">${v||'Select theme'}</option>${themes.map(t=>t!==v?`<option value="${t}">${t}</option>`:'').join('')}</select>`;
    } else if (isStore) {
      input = `<select id="f_${c}"><option value="${v}">${v||'Select store'}</option>${stores.map(s=>s!==v?`<option value="${s}">${s}</option>`:'').join('')}</select>`;
    } else if (isOpen) {
      input = `<select id="f_${c}">${openOpts.map(o=>`<option value="${o}" ${o===String(v)?'selected':''}>${o||'(none)'}</option>`).join('')}</select>`;
    } else if (isDate) {
      const dv = fmtDate(v);
      input = `<input type="date" id="f_${c}" value="${dv}">`;
    } else if (isNum) {
      input = `<input type="number" step="any" id="f_${c}" value="${v}" placeholder="${c}">`;
    } else if (isUrl) {
      input = `<textarea id="f_${c}" placeholder="URL or path">${v}</textarea>`;
    } else {
      input = `<input type="text" id="f_${c}" value="${v}" placeholder="${c}">`;
    }

    return `<div class="form-group ${isFull?'full':''}"><label>${c}</label>${input}</div>`;
  }).join('');

  return `<div class="form-grid">${fields}</div>
    <div class="form-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveRecord()">💾 Save</button>
    </div>`;
}

function openAddModal() {
  state.editIdx = null;
  const sh = state.activeSheet;
  document.getElementById('modalTitle').innerHTML = `Add to <em>${sh}</em> <button class="modal-close" onclick="closeModal()">✕</button>`;
  document.getElementById('modalBody').innerHTML = buildForm(sh, {});
  document.getElementById('modalBg').classList.add('open');
}

function openEditModal(id) {
  const sh = state.activeSheet;
  const row = state.data[sh].find(r => r._id === id);
  if (!row) return;
  state.editIdx = id;
  document.getElementById('modalTitle').innerHTML = `Edit Record <button class="modal-close" onclick="closeModal()">✕</button>`;
  document.getElementById('modalBody').innerHTML = buildForm(sh, row);
  document.getElementById('modalBg').classList.add('open');
}

function closeModal() {
  document.getElementById('modalBg').classList.remove('open');
  state.editIdx = null;
}

function saveRecord() {
  const sh = state.activeSheet;
  const cols = getCol(sh).filter(c => !c.startsWith('Unnamed'));
  const newRec = {};
  for (const c of cols) {
    const el = document.getElementById('f_' + c);
    if (!el) continue;
    let v = el.value;
    if (['PCS','Price','Price BUY','Price2','Total Bill','%','N2','item #','Items','no','The Price'].includes(c)) {
      v = v === '' ? null : parseFloat(v);
    }
    newRec[c] = v;
  }

  if (state.editIdx !== null) {
    const idx = state.data[sh].findIndex(r => r._id === state.editIdx);
    if (idx !== -1) {
      newRec._id = state.editIdx;
      state.data[sh][idx] = newRec;
      toast('✅ Record updated!');
    }
  } else {
    const maxId = state.data[sh].reduce((m,r) => Math.max(m, r._id||0), 0);
    newRec._id = maxId + 1;
    state.data[sh].push(newRec);
    toast('✅ Record added!');
  }
  closeModal();
  updateHeaderStats();
  renderContent();
}

function deleteRow(id) {
  if (!confirm('Delete this record?')) return;
  const sh = state.activeSheet;
  state.data[sh] = state.data[sh].filter(r => r._id !== id);
  toast('🗑 Record deleted');
  updateHeaderStats();
  renderContent();
}

// ─── EXPORT ───────────────────────────────────────────────
function exportSheet() {
  const sh = state.activeSheet;
  const rows = state.data[sh].map(r => {
    const out = {...r};
    delete out._id;
    return out;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sh.substring(0,31));
  XLSX.writeFile(wb, `LEGO_${sh}_export.xlsx`);
  toast('📥 Exported!');
}

// Init handled by index.html
