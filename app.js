const pages = [
  {key:'Owned',title:'الصفحة الرئيسية - Owned',icon:'🧱',editable:true},
  {key:'Mother',title:'Mother - ألعاب أمي',icon:'👩‍👦',editable:false},
  {key:'Both',title:'Both - دمج Owned + Mother',icon:'🔗',editable:false,combine:true},
  {key:'ورقة2',title:'ورقة2',icon:'📊',editable:false},
  {key:'Bills',title:'Bills - الفواتير',icon:'🧾',editable:false},
  {key:'All',title:'All - كل البيانات',icon:'📦',editable:false}
];
const legoColors = {
  city:['#0055bf','#fff','City'], creator:['#b8860b','#fff','CREATOR'], 'creator expert':['#111827','#fff','CREATOR EXPERT'],
  icons:['#6d28d9','#fff','ICONS'], technic:['#f97316','#fff','TECHNIC'], friends:['#e6007e','#fff','FRIENDS'],
  architecture:['#374151','#fff','ARCHITECTURE'], ideas:['#009fe3','#fff','IDEAS'], minecraft:['#237841','#fff','MINECRAFT'],
  'harry potter':['#7c2d12','#fff','Harry Potter'], 'star wars':['#111827','#ffed00','STAR WARS'], promotional:['#e3000b','#fff','PROMOTIONAL'],
  duplo:['#00a3e0','#fff','DUPLO'], disney:['#ec4899','#fff','DISNEY'], ninjago:['#b91c1c','#fff','NINJAGO'],
  'jurassic world':['#14532d','#fff','Jurassic World'], 'speed champions':['#dc2626','#fff','SPEED CHAMPIONS'],
  default:['#ffd500','#111827','']
};
let DB={}, current='Owned', editIndex=null;
const $=sel=>document.querySelector(sel);
const fmt=v=>v===null||v===undefined?'':String(v);
function normalizeTheme(t){return fmt(t).trim().toLowerCase();}
function colorForTheme(t){const key=normalizeTheme(t);return legoColors[key]||legoColors.default;}
function displayTheme(t){const raw=fmt(t).trim(); if(!raw) return ''; const c=colorForTheme(raw); return c[2]||raw.replace(/\b\w/g,m=>m.toUpperCase());}
async function init(){
  const res=await fetch('./data.json'); DB=(await res.json()).sheets;
  const saved=localStorage.getItem('hmd_lego_db_v2'); if(saved){try{DB=JSON.parse(saved)}catch(e){}}
  renderNav(); render(); bindEvents(); if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
function saveLocal(){localStorage.setItem('hmd_lego_db_v2', JSON.stringify(DB));}
function renderNav(){
  $('#nav').innerHTML=pages.map(p=>`<button class="nav-btn ${p.key===current?'active':''}" data-page="${p.key}"><span>${p.icon} ${p.title.split(' - ')[0]}</span><b>${(getRows(p.key)||[]).length}</b></button>`).join('');
  document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>{current=b.dataset.page; renderNav(); render();});
}
function getHeaders(key){
  if(key==='Both') return DB.Owned?.headers || DB.Both?.headers || [];
  return DB[key]?.headers || [];
}
function getRows(key){
  if(key==='Both') return [...(DB.Owned?.rows||[]), ...(DB.Mother?.rows||[])];
  return DB[key]?.rows || [];
}
function render(){
  const p=pages.find(x=>x.key===current); $('#pageTitle').textContent=p.title; $('#addBtn').style.display=p.editable?'inline-block':'none';
  const q=$('#search').value.toLowerCase().trim(); let rows=getRows(current); const headers=getHeaders(current);
  if(q) rows=rows.filter(r=>headers.some(h=>fmt(r[h]).toLowerCase().includes(q)));
  renderKPIs(rows,headers); renderTable(rows,headers,p.editable); $('#recordCount').textContent=`${rows.length} سجل`; $('#tableTitle').textContent=p.title;
}
function num(v){const n=parseFloat(v);return isFinite(n)?n:0;}
function renderKPIs(rows,headers){
  const pieces=rows.reduce((a,r)=>a+num(r.PCS||r.PCs||r.pcs),0); const buy=rows.reduce((a,r)=>a+num(r['Price BUY']||r['price buy']),0);
  const sale=rows.reduce((a,r)=>a+num(r.Price||r.price),0); const themes=new Set(rows.map(r=>fmt(r.theme||r.Theme)).filter(Boolean));
  $('#kpis').innerHTML=`<div class="kpi"><b>${rows.length}</b><span>عدد الألعاب</span></div><div class="kpi"><b>${pieces.toLocaleString()}</b><span>مجموع القطع PCs</span></div><div class="kpi"><b>${buy.toFixed(2)}</b><span>إجمالي سعر الشراء</span></div><div class="kpi"><b>${themes.size}</b><span>عدد الثيمات</span></div>`;
}
function renderTable(rows,headers,editable){
  const action=editable?'<th>Action</th>':'';
  $('#dataTable').innerHTML=`<thead><tr>${action}${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r,i)=>`<tr>${editable?`<td><button class="edit-btn" data-edit="${i}">تعديل</button></td>`:''}${headers.map(h=>cell(h,r[h])).join('')}</tr>`).join('')}</tbody>`;
  document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openForm(+b.dataset.edit));
}
function cell(h,v){
  const name=h.toLowerCase();
  if(name==='theme') { const [bg,fg]=colorForTheme(v); return `<td><span class="theme-badge" style="background:${bg};color:${fg}">${displayTheme(v)}</span></td>`; }
  if(name==='url' && fmt(v)) return `<td class="url-cell"><a href="#" title="${fmt(v)}">${fmt(v).split(/[\\/]/).pop()}</a></td>`;
  return `<td>${fmt(v)}</td>`;
}
function bindEvents(){
  $('#search').oninput=render; $('#addBtn').onclick=()=>openForm(null); $('#saveEntry').onclick=e=>{e.preventDefault(); saveEntry();}; $('#fileInput').onchange=importExcel;
}
function openForm(idx){
  editIndex=idx; const headers=DB.Owned.headers; const row=idx===null?{}:DB.Owned.rows[idx];
  $('#formFields').innerHTML=headers.map(h=>`<div class="field"><label>${h}</label><input name="${h}" value="${fmt(row[h]).replace(/"/g,'&quot;')}" /></div>`).join('');
  $('#formDialog').showModal();
}
function saveEntry(){
  const fd=new FormData($('#entryForm')); const rec={}; DB.Owned.headers.forEach(h=>rec[h]=fd.get(h));
  if(editIndex===null) DB.Owned.rows.unshift(rec); else DB.Owned.rows[editIndex]=rec;
  saveLocal(); $('#formDialog').close(); renderNav(); render();
}
async function importExcel(e){
  const file=e.target.files[0]; if(!file||!window.XLSX){alert('مكتبة قراءة Excel تحتاج إنترنت لأول مرة.');return;}
  const buf=await file.arrayBuffer(); const wb=XLSX.read(buf,{type:'array',cellDates:true});
  pages.forEach(p=>{ if(wb.SheetNames.includes(p.key)){ const rows=XLSX.utils.sheet_to_json(wb.Sheets[p.key],{defval:null}); const headers=rows[0]?Object.keys(rows[0]):DB[p.key]?.headers||[]; DB[p.key]={headers,rows}; }});
  saveLocal(); renderNav(); render(); alert('تم استيراد ملف Excel وتحديث البيانات.');
}
init();
