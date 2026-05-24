document.addEventListener('touchmove',function(){},{passive:true});

function openExternalLink(url,item){
let finalUrl='';

if(url && url.startsWith('http')){
finalUrl=url;
}else if(item){
finalUrl=`https://www.bricklink.com/v2/catalog/catalogitem.page?S=${item}`;
}

if(finalUrl){
window.open(finalUrl,'_blank');
}
}

function getPercentClass(v){
const n=parseFloat(v)||0;

if(n>=1) return 'pct-full';
if(n>0) return 'pct-mid';

return '';
}
