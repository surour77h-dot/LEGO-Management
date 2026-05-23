const pages=[
  {key:'Owned',title:'الصفحة الرئيسية',icon:'🏠',editable:true},
  {key:'Mother',title:'Mother',icon:'👤',editable:false},
  {key:'Both',title:'Both',icon:'🟪',editable:false,combine:true},
  {key:'ورقة2',title:'ورقة2',icon:'📄',editable:false},
  {key:'Bills',title:'Bills',icon:'💵',editable:false},
  {key:'All',title:'All',icon:'🟧',editable:false}
];
const wantedOwned=['N2','open','item#','theme','subtheme','item Name','PCs','price','price buy','Store','price2 (total price)','total bill (total after discount)','order date','%','url'];
const themeColors={
 'city':['#0070C0','#fff','CITY'], 'creator':['#BF9000','#fff','CREATOR'], 'creator expert':['#1F4E78','#fff','Creator Expert'], 'advanced models':['#FFD966','#111','Advanced Models'],
 'icons':['#7030A0','#fff','ICONS'], 'technic':['#808080','#fff','TECHNIC'], 'friends':['#FF66CC','#fff','FRIENDS'], 'architecture':['#262626','#fff','ARCHITECTURE'],
 'ideas':['#F4B183','#111','Ideas'], 'minecraft':['#70AD47','#fff','Minecraft'], 'harry potter':['#7F6000','#fff','Harry Potter'], 'star wars':['#000000','#fff','STAR WARS'],
 'promotional':['#C00000','#fff','Promotional'], 'duplo':['#00B0F0','#fff','DUPLO'], 'disney':['#FF99CC','#111','Disney'], 'ninjago':['#FF0000','#fff','NINJAGO'],
 'marvel super heroes':['#C00000','#fff','Marvel Super Heroes'], 'dc comics super heroes':['#002060','#fff','DC Comics Super Heroes'], 'speed champions':['#FF0000','#fff','Speed Champions'],
 'super mario':['#E69138','#fff','Super Mario'], 'classic':['#FFFF00','#111','Classic'], 'jurassic world':['#38761D','#fff','Jurassic World'], 'elves':['#A64D79','#fff','Elves'],
 'nexo knights':['#1C4587','#fff','Nexo Knights'], 'pirates':['#783F04','#fff','Pirates'], 'bionicle':['#666666','#fff','Bionicle'], 'the simpsons':['#F1C232','#111','The Simpsons'],
 'scooby-doo':['#6AA84F','#111','Scooby-Doo'], 'the lord of the rings':['#274E13','#fff','The Lord of the Rings'], 'the hobbit':['#B45F06','#fff','The Hobbit'], 'dots':['#FF00FF','#fff','Dots'], 'vidiyo':['#00B0F0','#111','Vidiyo'], 'default':['#FFD500','#111','']
};
const storeColors={
 'lego store':['#C00000','#fff'], 'fantacy world':['#7030A0','#fff'], 'jarir book':['#00B050','#fff'], 'bricks':['#FFC000','#111'], 'friday market':['#7F6000','#fff'],
 'person':['#595959','#fff'], '( centerpoint )':['#ED7D31','#fff'], 'lego store britsh':['#002060','#fff'], 'the entertainer':['#00B0F0','#111'],
 'the harry potter shop':['#7F6000','#fff'], 'virgin':['#C00000','#fff'], 'city center':['#0070C0','#fff'], 'default':['#E7E6E6','#111']
};
let DB={},current='Owned',page=1,editIndex=null,selectedRow=null,selectedIndex=null;
const $=s=>document.querySelector(s); const fmt=v=>v==null?'':String(v);
function norm(s){return fmt(s).trim().toLowerCase().replace(/[^a-z0-9%#]/g,'');}
function findKey(o,n){const nn=norm(n);return Object.keys(o||{}).find(k=>norm(k)===nn || (nn==='item#'&&norm(k)==='item') || (nn==='pc'&&norm(k)==='pcs'));}
function val(r,h){const k=findKey(r,h);return k?r[k]:r[h];}
function setVal(r,h,v){const k=findKey(r,h)||h;r[k]=v;}
function num(v){const n=parseFloat(fmt(v).replace(/,/g,''));return isFinite(n)?n:0;}
function themeKey(v){return fmt(v).trim().toLowerCase();}
function themeStyle(v){return themeColors[themeKey(v)]||themeColors.default;}
function storeStyle(v){return storeColors[themeKey(v)]||storeColors.default;}
function themeLabel(v){const raw=fmt(v).trim(); const s=themeStyle(raw); return s[2]||raw;}
async function init(){const res=await fetch('./data.json'); DB=(await res.json()).sheets; const saved=localStorage.getItem('hmd_lego_db_v6'); if(saved){try{DB=JSON.parse(saved)}catch(e){}} bindEvents(); renderNav(); render(); if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});}
function saveLocal(){localStorage.setItem('hmd_lego_db_v6',JSON.stringify(DB));}
function getHeaders(key){if(key==='Owned')return wantedOwned;if(key==='Both')return DB.Owned?.headers||wantedOwned;return DB[key]?.headers||[];}
function getRows(key){if(key==='Both')return [...(DB.Owned?.rows||[]),...(DB.Mother?.rows||[])];return DB[key]?.rows||[];}
function renderNav(){ $('#nav').innerHTML=pages.map(p=>`<button class="nav-btn ${p.key===current?'active':''}" data-page="${p.key}"><span>${p.icon}</span><b>${p.key}</b></button>`).join(''); document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>switchPage(b.dataset.page));}
function switchPage(k){current=k;page=1;$('#menuPanel').hidden=true;renderNav();render();}
function filteredRows(){const q=$('#search').value.toLowerCase().trim(); const hs=getHeaders(current); let rows=getRows(current); if(q) rows=rows.filter(r=>hs.some(h=>fmt(val(r,h)).toLowerCase().includes(q))); return rows;}
function calcPercent(row){const p=num(val(row,'price')), b=num(val(row,'price buy')); if(!p) return 0; return (p-b)/p;}
function pctText(v){let n=num(v); if(Math.abs(n)<=1) n=n*100; return `${Math.round(n)}%`;}
function render(){const p=pages.find(x=>x.key===current); $('#pageTitle').textContent=p.title; $('#addBtn').style.display=p.editable?'inline-flex':'none'; const rows=filteredRows(); renderKPIs(rows); renderTable(rows,getHeaders(current));}
function renderKPIs(rows){const pieces=rows.reduce((a,r)=>a+num(val(r,'PCs')),0); const buy=rows.reduce((a,r)=>a+num(val(r,'price buy')),0); const themes=new Set(rows.map(r=>fmt(val(r,'theme'))).filter(Boolean)); $('#kpis').innerHTML=`<div><b>${rows.length}</b><span>سجل</span></div><div><b>${pieces.toLocaleString()}</b><span>قطع</span></div><div><b>${buy.toFixed(1)}</b><span>شراء</span></div><div><b>${themes.size}</b><span>Theme</span></div>`;}
function shortHeader(h){return {'price2 (total price)':'price2','total bill (total after discount)':'total bill','order date':'date','item Name':'item','price buy':'buy'}[h]||h;}
function renderTable(rows,headers){const per=Number($('#rowsPerPage').value||20); const totalPages=Math.max(1,Math.ceil(rows.length/per)); if(page>totalPages)page=totalPages; const start=(page-1)*per, slice=rows.slice(start,start+per); $('#dataTable').innerHTML=`<thead><tr>${headers.map(h=>`<th title="${h}">${shortHeader(h)}</th>`).join('')}</tr></thead><tbody>${slice.map((r,i)=>`<tr data-row="${start+i}">${headers.map(h=>cell(h,val(r,h),r)).join('')}</tr>`).join('')}</tbody>`; document.querySelectorAll('tbody tr').forEach(tr=>tr.onclick=e=>{if(e.target.closest('a'))return; openDetails(rows[+tr.dataset.row],+tr.dataset.row)}); document.querySelectorAll('td a').forEach(a=>a.onclick=e=>e.stopPropagation()); $('#pageInfo').textContent=`${slice.length?start+1:0}-${Math.min(start+per,rows.length)} / ${rows.length}`; $('#pageNo').textContent=page; $('#prevPage').disabled=page<=1; $('#nextPage').disabled=page>=totalPages;}
function cell(h,v,row){const n=h.toLowerCase(); if(n.includes('theme')&&!n.includes('subtheme')){const [bg,fg]=themeStyle(v);return `<td class="full-cell" style="background:${bg};color:${fg}">${themeLabel(v)}</td>`;} if(n==='store'){const [bg,fg]=storeStyle(v);return `<td class="full-cell" style="background:${bg};color:${fg}">${fmt(v)}</td>`;} if(n==='%'){const p=current==='Owned'?calcPercent(row):num(v); const pp=Math.round(Math.abs(p)<=1?p*100:p); let cls=pp>=100?'pct-full':pp>0?'pct-mid':''; return `<td class="pct ${cls}">${pp>0?pctText(p):fmt(v)}</td>`;} if(n==='url'&&fmt(v))return `<td class="url-cell"><a href="${safeUrl(v)}" target="_blank" rel="noopener noreferrer">🔗 Open</a></td>`; return `<td>${fmt(v)}</td>`;}
function safeUrl(v){const s=fmt(v); if(/^https?:\/\//i.test(s))return s; return s;}
function bindEvents(){ $('#search').oninput=()=>{page=1;render();}; $('#addBtn').onclick=()=>openForm(null); $('#saveEntry').onclick=e=>{e.preventDefault();saveEntry();}; $('#fileInput').onchange=importExcel; $('#prevPage').onclick=()=>{if(page>1){page--;render();}}; $('#nextPage').onclick=()=>{page++;render();}; $('#rowsPerPage').onchange=()=>{page=1;render();}; $('#backToTable').onclick=()=>{$('#detailView').hidden=true;}; $('#menuBtn').onclick=()=>{$('#menuPanel').hidden=!$('#menuPanel').hidden;}; document.querySelectorAll('[data-menu-page]').forEach(b=>b.onclick=()=>switchPage(b.dataset.menuPage)); $('#exportDataBtn').onclick=exportData; $('#exportExcelBtn').onclick=exportExcel; $('#detailEditBtn').onclick=()=>{if(current==='Owned'&&selectedIndex!=null)openForm(selectedIndex);};}
function field(h,row={}){let value= h==='%'&&row?calcPercent(row):val(row,h); return `<div class="field"><label>${h}</label><input name="${h}" ${h==='%'?'readonly':''} value="${fmt(value).replace(/"/g,'&quot;')}" /></div>`;}
function openForm(idx){if(current!=='Owned')return; editIndex=idx; const row=idx==null?{}:filteredRows()[idx]||DB.Owned.rows[idx]||{}; $('#formTitle').textContent=idx==null?'إضافة لعبة جديدة':'تعديل بيانات اللعبة'; const basic=['N2','open','item#','theme','subtheme','item Name']; const price=['PCs','price','price buy','Store','price2 (total price)','total bill (total after discount)']; const extra=['order date','%','url']; $('#basicFields').innerHTML=basic.map(h=>field(h,row)).join(''); $('#priceFields').innerHTML=price.map(h=>field(h,row)).join(''); $('#extraFields').innerHTML=extra.map(h=>field(h,row)).join(''); $('#formDialog').showModal();}
function saveEntry(){const fd=new FormData($('#entryForm')); const rec={}; wantedOwned.forEach(h=>rec[h]=fd.get(h)||''); rec['%']=calcPercent(rec); if(!DB.Owned)DB.Owned={headers:wantedOwned,rows:[]}; DB.Owned.headers=wantedOwned; if(editIndex==null)DB.Owned.rows.unshift(rec); else DB.Owned.rows[editIndex]=rec; saveLocal(); $('#formDialog').close(); renderNav(); render();}
function itemNumber(row){return fmt(val(row,'item#')||val(row,'item #')).replace(/[^0-9]/g,'');}
function openDetails(row,idx){selectedRow=row; selectedIndex=idx; const headers=getHeaders(current); const name=fmt(val(row,'item Name')||'تفاصيل اللعبة'), theme=fmt(val(row,'theme')); $('#detailName').textContent=name; const [bg,fg]=themeStyle(theme); $('#detailTheme').style.background=bg; $('#detailTheme').style.color=fg; $('#detailTheme').textContent=themeLabel(theme)||'Theme'; $('#detailSubtheme').textContent=fmt(val(row,'subtheme')); $('#detailEditBtn').style.display=current==='Owned'?'inline-flex':'none'; const item=itemNumber(row); const img=$('#setImage'), fallback=$('#setFallback'); fallback.hidden=false; img.hidden=true; if(item){img.src=`https://cdn.rebrickable.com/media/sets/${item}-1.jpg`; img.onload=()=>{img.hidden=false;fallback.hidden=true}; img.onerror=()=>{img.hidden=true;fallback.hidden=false};} $('#detailGrid').innerHTML=headers.map(h=>`<div class="detail-box"><small>${h}</small><b>${detailValue(h,val(row,h),row)}</b></div>`).join(''); $('#detailView').hidden=false;}
function detailValue(h,v,row){const n=h.toLowerCase(); if(n==='url'&&fmt(v))return `<a href="${safeUrl(v)}" target="_blank" rel="noopener noreferrer">فتح الرابط 🔗</a>`; if(n==='%')return pctText(current==='Owned'?calcPercent(row):v); return fmt(v)||'-';}
async function importExcel(e){const file=e.target.files[0]; if(!file||!window.XLSX){alert('مكتبة قراءة Excel تحتاج إنترنت لأول مرة.');return;} const buf=await file.arrayBuffer(); const wb=XLSX.read(buf,{type:'array',cellDates:true}); pages.forEach(p=>{if(p.key==='Both')return; if(wb.SheetNames.includes(p.key)){const rows=XLSX.utils.sheet_to_json(wb.Sheets[p.key],{defval:null}); const headers=p.key==='Owned'?wantedOwned:(rows[0]?Object.keys(rows[0]):DB[p.key]?.headers||[]); if(p.key==='Owned')rows.forEach(r=>setVal(r,'%',calcPercent(r))); DB[p.key]={headers,rows};}}); saveLocal();page=1;renderNav();render();alert('تم استيراد ملف Excel وتحديث البيانات.');}
function exportData(){const blob=new Blob([JSON.stringify(DB,null,2)],{type:'application/json'}); download(blob,'hmd-lego-data.json');}
function exportExcel(){if(!window.XLSX){exportData();return;} const wb=XLSX.utils.book_new(); Object.keys(DB).forEach(k=>{const ws=XLSX.utils.json_to_sheet(DB[k].rows||[]); XLSX.utils.book_append_sheet(wb,ws,k.substring(0,31));}); XLSX.writeFile(wb,'HMD_LEGO_export.xlsx');}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href);}
init();
