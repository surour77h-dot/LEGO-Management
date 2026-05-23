const pages = [
  {key:'Owned',title:'Owned Collection - إدخال البيانات',icon:'🏠',editable:true},
  {key:'Mother',title:'Mother - ألعاب أمي',icon:'👤',editable:false},
  {key:'Both',title:'Both - دمج Owned + Mother',icon:'🟪',editable:false,combine:true},
  {key:'ورقة2',title:'ورقة2',icon:'📄',editable:false},
  {key:'Bills',title:'Bills - الفواتير',icon:'💵',editable:false},
  {key:'All',title:'All - كل البيانات',icon:'🟧',editable:false}
];
const wantedOwned = ['N2','open','item#','theme','subtheme','item Name','PCs','price','price buy','Store','price2 (total price)','total bill (total after discount)','order date','%','url'];
const legoColors = {
  city:['#0072ce','#fff','City'], creator:['#b8860b','#fff','CREATOR'], 'creator expert':['#122044','#fff','CREATOR EXPERT'],
  'advanced models':['#ffd500','#111827','Advanced Models'], icons:['#6d28d9','#fff','ICONS'], technic:['#6b8bad','#fff','TECHNIC'],
  friends:['#e6007e','#fff','FRIENDS'], architecture:['#1f2937','#fff','ARCHITECTURE'], ideas:['#ff7a00','#fff','IDEAS'],
  minecraft:['#237841','#fff','MINECRAFT'], 'harry potter':['#7c2d12','#fff','Harry Potter'], 'star wars':['#050505','#fff','STAR WARS'],
  promotional:['#e3000b','#fff','PROMOTIONAL'], duplo:['#00a3e0','#fff','DUPLO'], disney:['#ec4899','#fff','DISNEY'],
  ninjago:['#e3000b','#fff','NINJAGO'], marvel:['#e62429','#fff','MARVEL'], 'jurassic world':['#14532d','#fff','JURASSIC WORLD'],
  'speed champions':['#dc2626','#fff','SPEED CHAMPIONS'], default:['#ffd500','#111827','']
};
let DB={}, current='Owned', editIndex=null, page=1;
const $=sel=>document.querySelector(sel);
const fmt=v=>v===null||v===undefined?'':String(v);
function findKey(obj, name){ const n=name.toLowerCase().replace(/[^a-z0-9%#]/g,''); return Object.keys(obj||{}).find(k=>k.toLowerCase().replace(/[^a-z0-9%#]/g,'')===n); }
function val(row, h){ const k=findKey(row,h); return k?row[k]:row[h]; }
function normalizeTheme(t){return fmt(t).trim().toLowerCase();}
function colorForTheme(t){return legoColors[normalizeTheme(t)]||legoColors.default;}
function displayTheme(t){const raw=fmt(t).trim(); if(!raw) return ''; const c=colorForTheme(raw); return c[2]||raw.replace(/\b\w/g,m=>m.toUpperCase());}
async function init(){
  const res=await fetch('./data.json'); DB=(await res.json()).sheets;
  const saved=localStorage.getItem('hmd_lego_db_v3'); if(saved){try{DB=JSON.parse(saved)}catch(e){}}
  renderNav(); bindEvents(); render(); if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
function saveLocal(){localStorage.setItem('hmd_lego_db_v3', JSON.stringify(DB));}
function getHeaders(key){
  if(key==='Owned') return wantedOwned;
  if(key==='Both') return DB.Owned?.headers || wantedOwned;
  return DB[key]?.headers || [];
}
function getRows(key){
  if(key==='Both') return [...(DB.Owned?.rows||[]), ...(DB.Mother?.rows||[])];
  return DB[key]?.rows || [];
}
function renderNav(){
  $('#nav').innerHTML=pages.map(p=>`<button class="nav-btn ${p.key===current?'active':''}" data-page="${p.key}"><span class="ico">${p.icon}</span><span>${p.key}</span><b>${(getRows(p.key)||[]).length}</b></button>`).join('');
  document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>{current=b.dataset.page; page=1; renderNav(); render();});
}
function filteredRows(){
  const q=$('#search').value.toLowerCase().trim(); const headers=getHeaders(current); let rows=getRows(current);
  if(q) rows=rows.filter(r=>headers.some(h=>fmt(val(r,h)).toLowerCase().includes(q)));
  return rows;
}
function render(){
  const p=pages.find(x=>x.key===current); $('#pageTitle').textContent=p.key==='Owned'?'الصفحة الرئيسية':p.title; $('#addBtn').style.display=p.editable?'inline-block':'none';
  const rows=filteredRows(), headers=getHeaders(current); renderKPIs(rows); renderTable(rows,headers,p.editable);
  $('#recordCount').textContent=`${rows.length} سجل`; $('#tableTitle').textContent=p.title;
}
function num(v){const n=parseFloat(String(v).replace(/,/g,''));return isFinite(n)?n:0;}
function renderKPIs(rows){
  const pieces=rows.reduce((a,r)=>a+num(val(r,'PCs')||val(r,'pcs')),0); const buy=rows.reduce((a,r)=>a+num(val(r,'price buy')||val(r,'Price BUY')),0);
  const total=rows.reduce((a,r)=>a+num(val(r,'price2 (total price)')||val(r,'Price2 (Total)')||val(r,'price')),0); const themes=new Set(rows.map(r=>fmt(val(r,'theme'))).filter(Boolean));
  $('#kpis').innerHTML=`<div class="kpi"><i>🧱</i><div><b>${rows.length}</b><span>عدد الألعاب</span></div></div><div class="kpi"><i>📦</i><div><b>${pieces.toLocaleString()}</b><span>إجمالي القطع</span></div></div><div class="kpi"><i>$</i><div><b>${buy.toFixed(2)}</b><span>سعر الشراء</span></div></div><div class="kpi"><i>🎨</i><div><b>${themes.size}</b><span>الثيمات</span></div></div>`;
}
function shortHeader(h){
  const map={'price2 (total price)':'price2','total bill (total after discount)':'total bill','order date':'date','item Name':'item name','price buy':'buy'};
  return map[h]||h;
}
function renderTable(rows,headers,editable){
  const per=Number($('#rowsPerPage').value||20); const totalPages=Math.max(1,Math.ceil(rows.length/per)); if(page>totalPages) page=totalPages;
  const start=(page-1)*per; const slice=rows.slice(start,start+per); const action=editable?'<th>Action</th>':'';
  $('#dataTable').className = editable ? 'has-action' : 'no-action';
  $('#dataTable').innerHTML=`<thead><tr>${action}${headers.map(h=>`<th title="${h}">${shortHeader(h)}</th>`).join('')}</tr></thead><tbody>${slice.map((r,i)=>`<tr data-row="${start+i}">${editable?`<td><button class="edit-btn" data-edit="${start+i}">تعديل</button></td>`:''}${headers.map(h=>cell(h,val(r,h))).join('')}</tr>`).join('')}</tbody>`;
  document.querySelectorAll('tbody tr').forEach(tr=>tr.onclick=e=>{ if(e.target.closest('[data-edit]')) return; openDetails(rows[+tr.dataset.row]); });
  document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=e=>{e.stopPropagation(); openForm(+b.dataset.edit);});
  $('#pageInfo').textContent=`عرض ${slice.length?start+1:0} - ${Math.min(start+per,rows.length)} من ${rows.length}`; $('#pageNo').textContent=page;
  $('#prevPage').disabled=page<=1; $('#nextPage').disabled=page>=totalPages;
}
function cell(h,v){
  const name=h.toLowerCase();
  if(name.includes('theme') && !name.includes('subtheme')) { const [bg,fg]=colorForTheme(v); return `<td><span class="theme-badge" style="background:${bg};color:${fg}">${displayTheme(v)}</span></td>`; }
  if(name==='url' && fmt(v)) return `<td class="url-cell"><a href="${fmt(v)}" target="_blank">🔗 رابط</a></td>`;
  return `<td>${fmt(v)}</td>`;
}
function bindEvents(){
  $('#search').oninput=()=>{page=1;render();}; $('#addBtn').onclick=()=>openForm(null); $('#saveEntry').onclick=e=>{e.preventDefault(); saveEntry();}; $('#fileInput').onchange=importExcel;
  $('#prevPage').onclick=()=>{if(page>1){page--;render();}}; $('#nextPage').onclick=()=>{page++;render();}; $('#rowsPerPage').onchange=()=>{page=1;render();}; $('#backToTable').onclick=()=>{$('#detailView').hidden=true;};
}
function field(h,row={}){return `<div class="field"><label>${h}</label><input name="${h}" value="${fmt(val(row,h)).replace(/"/g,'&quot;')}" /></div>`;}
function openForm(idx){
  if(current!=='Owned') return; editIndex=idx; const rows=filteredRows(); const row=idx===null?{}:rows[idx]||DB.Owned.rows[idx]||{};
  const basic=['N2','open','item#','theme','subtheme','item Name']; const price=['PCs','price','price buy','Store','price2 (total price)','total bill (total after discount)']; const extra=['order date','%','url'];
  $('#basicFields').innerHTML=basic.map(h=>field(h,row)).join(''); $('#priceFields').innerHTML=price.map(h=>field(h,row)).join(''); $('#extraFields').innerHTML=extra.map(h=>field(h,row)).join('');
  $('#formDialog').showModal();
}
function saveEntry(){
  const fd=new FormData($('#entryForm')); const rec={}; wantedOwned.forEach(h=>rec[h]=fd.get(h)||'');
  if(!DB.Owned) DB.Owned={headers:wantedOwned,rows:[]}; DB.Owned.headers=wantedOwned;
  if(editIndex===null) DB.Owned.rows.unshift(rec); else DB.Owned.rows[editIndex]=rec;
  saveLocal(); $('#formDialog').close(); renderNav(); render();
}
function openDetails(row){
  const headers=getHeaders(current); const name=fmt(val(row,'item Name')||val(row,'Item Name')||val(row,'name')||'تفاصيل اللعبة'); const theme=fmt(val(row,'theme')||val(row,'Theme'));
  $('#detailName').textContent=name; const [bg,fg]=colorForTheme(theme); $('#detailTheme').style.background=bg; $('#detailTheme').style.color=fg; $('#detailTheme').textContent=displayTheme(theme)||'Theme';
  $('#detailSubtheme').textContent=fmt(val(row,'subtheme')||val(row,'Subtheme')); $('#setArt').textContent=theme.toLowerCase().includes('city')?'🏙️':theme.toLowerCase().includes('star')?'🚀':theme.toLowerCase().includes('technic')?'🏎️':'🧱';
  $('#detailGrid').innerHTML=headers.map(h=>`<div class="detail-box"><small>${h}</small><b>${detailValue(h,val(row,h))}</b></div>`).join(''); $('#detailView').hidden=false;
}
function detailValue(h,v){ if(h.toLowerCase()==='url' && fmt(v)) return `<a href="${fmt(v)}" target="_blank">فتح الرابط 🔗</a>`; if(h.toLowerCase().includes('theme')&&!h.toLowerCase().includes('subtheme')) return displayTheme(v); return fmt(v)||'-'; }
async function importExcel(e){
  const file=e.target.files[0]; if(!file||!window.XLSX){alert('مكتبة قراءة Excel تحتاج إنترنت لأول مرة.');return;}
  const buf=await file.arrayBuffer(); const wb=XLSX.read(buf,{type:'array',cellDates:true});
  pages.forEach(p=>{ if(p.key==='Both') return; if(wb.SheetNames.includes(p.key)){ const rows=XLSX.utils.sheet_to_json(wb.Sheets[p.key],{defval:null}); const headers=p.key==='Owned'?wantedOwned:(rows[0]?Object.keys(rows[0]):DB[p.key]?.headers||[]); DB[p.key]={headers,rows}; }});
  saveLocal(); page=1; renderNav(); render(); alert('تم استيراد ملف Excel وتحديث البيانات.');
}
init();
