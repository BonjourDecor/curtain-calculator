// =============================================
// DECOR BONJOUR — Калькулятор заказов v3
// =============================================
const STORAGE_KEYS={settings:'db_settings',priceList:'db_price_list',suppliers:'db_suppliers'};
const DEFAULT_SETTINGS={price_strochka:{value:200,label:'Цена строчки (₽/м)'},price_wave_markup:{value:150,label:'Цена разметки волны (₽/м)'},price_bantovka:{value:1200,label:'Цена бантовки (₽/м готового изделия)'},price_tesma:{value:350,label:'Цена тесьмы (₽/м)'}};
const DEFAULT_PRICE_LIST=[{id:1,name:'Строчка',cost:90,sell:200},{id:2,name:'Разметка волны',cost:'',sell:150},{id:3,name:'Бантовка',cost:'',sell:1200},{id:4,name:'Тесьма',cost:'',sell:350},{id:5,name:'Карниз СМ',cost:'',sell:550},{id:6,name:'Карниз профильный',cost:'',sell:1000},{id:7,name:'Карниз римский',cost:'',sell:5000},{id:8,name:'Вывешивание',cost:'',sell:400}];
var settings={};var priceList=[];var suppliers=[];var roomCounter=0;var fabricCounters={};var sewingCounters={};var extraCounters={};
var FUR_ITEMS=[{id:'cord',label:'Корд для волны',u:'м'},{id:'hiron',label:'Крючки железные',u:'шт'},{id:'hsnail',label:'Крючки улитка',u:'шт'},{id:'hnail',label:'Крючки гвоздик',u:'шт'},{id:'holder',label:'Держатель (подхват)',u:'шт'}];

function fmt(n){return Math.round(n).toLocaleString('ru-RU')+' ₽';}
function prs(s){return parseInt(String(s).replace(/[^\d-]/g,''))||0;}
function setT(id,val){var el=document.getElementById(id);if(el)el.textContent=fmt(val);}
function escHTML(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}

document.addEventListener('DOMContentLoaded',function(){loadAllData();addRoom();});

function loadAllData(){
    var ss=JSON.parse(localStorage.getItem(STORAGE_KEYS.settings)||'null');
    if(ss){settings=ss;}else{settings={};for(var k in DEFAULT_SETTINGS){settings[k]=DEFAULT_SETTINGS[k].value;}localStorage.setItem(STORAGE_KEYS.settings,JSON.stringify(settings));}
    var sp=JSON.parse(localStorage.getItem(STORAGE_KEYS.priceList)||'null');priceList=sp||DEFAULT_PRICE_LIST.slice();if(!sp)localStorage.setItem(STORAGE_KEYS.priceList,JSON.stringify(priceList));
    var su=JSON.parse(localStorage.getItem(STORAGE_KEYS.suppliers)||'null');suppliers=su||[];if(!su)localStorage.setItem(STORAGE_KEYS.suppliers,JSON.stringify(suppliers));
}
function saveSettings2Storage(){localStorage.setItem(STORAGE_KEYS.settings,JSON.stringify(settings));}
function savePriceList2Storage(){localStorage.setItem(STORAGE_KEYS.priceList,JSON.stringify(priceList));}
function saveSuppliers2Storage(){localStorage.setItem(STORAGE_KEYS.suppliers,JSON.stringify(suppliers));}

function openSettings(){
    var c=document.getElementById('settingsContent');var h='';
    for(var k in DEFAULT_SETTINGS){var def=DEFAULT_SETTINGS[k];h+='<div class="settings-row"><label>'+def.label+'</label><input type="number" data-key="'+k+'" value="'+(settings[k]||def.value)+'" step="0.01"></div>';}
    c.innerHTML=h;document.getElementById('settingsModal').classList.add('active');
}
function closeSettings(){document.getElementById('settingsModal').classList.remove('active');}
function saveSettings(){
    document.querySelectorAll('#settingsContent input[data-key]').forEach(function(inp){settings[inp.dataset.key]=parseFloat(inp.value)||0;});
    saveSettings2Storage();closeSettings();recalcAll();
}

function openPriceList(){renderPriceList();document.getElementById('priceListModal').classList.add('active');}
function closePriceList(){document.getElementById('priceListModal').classList.remove('active');}
function renderPriceList(){
    var body=document.getElementById('priceListBody');
    body.innerHTML=priceList.map(function(item,i){
        return '<tr><td><input type="text" value="'+(item.name||'')+'" onchange="updatePriceItem('+i+',\'name\',this.value)"></td><td><input type="number" value="'+(item.cost||'')+'" onchange="updatePriceItem('+i+',\'cost\',this.value)" step="0.01"></td><td><input type="number" value="'+(item.sell||'')+'" onchange="updatePriceItem('+i+',\'sell\',this.value)" step="0.01"></td><td><button class="btn btn-delete" onclick="deletePriceItem('+i+')">✕</button></td></tr>';
    }).join('');
}
function updatePriceItem(i,f,v){if(f==='name')priceList[i].name=v;else priceList[i][f]=v?parseFloat(v):'';savePriceList2Storage();}
function addPriceItem(){
    var n=document.getElementById('newPriceName').value.trim();if(!n)return;
    priceList.push({id:Date.now(),name:n,cost:parseFloat(document.getElementById('newPriceCost').value)||'',sell:parseFloat(document.getElementById('newPriceSell').value)||''});
    savePriceList2Storage();document.getElementById('newPriceName').value='';document.getElementById('newPriceCost').value='';document.getElementById('newPriceSell').value='';renderPriceList();
}
function deletePriceItem(i){if(!confirm('Удалить?'))return;priceList.splice(i,1);savePriceList2Storage();renderPriceList();}

function openSuppliersModal(){renderSuppliersList();document.getElementById('suppliersModal').classList.add('active');}
function closeSuppliersModal(){document.getElementById('suppliersModal').classList.remove('active');}
function renderSuppliersList(){
    var c=document.getElementById('suppliersContent');
    if(!suppliers.length){c.innerHTML='<p style="color:#9ca3af;font-style:italic;">Нет поставщиков</p>';return;}
    c.innerHTML='<table><thead><tr><th>Название</th><th></th></tr></thead><tbody>'+suppliers.map(function(s,i){return '<tr><td>'+s+'</td><td><button class="btn btn-delete" onclick="deleteSupplier('+i+')">✕</button></td></tr>';}).join('')+'</tbody></table>';
}
function addSupplierManual(){var inp=document.getElementById('newSupplierName');var n=inp.value.trim();if(!n)return;if(suppliers.indexOf(n)<0){suppliers.push(n);suppliers.sort();saveSuppliers2Storage();}inp.value='';renderSuppliersList();}
function deleteSupplier(i){if(!confirm('Удалить?'))return;suppliers.splice(i,1);saveSuppliers2Storage();renderSuppliersList();}
function addNewSupplier(n){n=n.trim();if(!n||suppliers.find(function(s){return s.toLowerCase()===n.toLowerCase();}))return;suppliers.push(n);suppliers.sort();saveSuppliers2Storage();}

function createSupplierField(){return '<div class="field-group field-supplier"><label>Поставщик</label><div class="supplier-wrapper"><input type="text" class="supplier-input" placeholder="Поставщик" onfocus="showSupDrop(this)" oninput="filterSupDrop(this)" onblur="setTimeout(function(){hideSupDrop(this)}.bind(this),200)"><div class="supplier-dropdown"></div></div></div>';}
function showSupDrop(inp){var dd=inp.nextElementSibling;renderSupOptions(dd,inp.value);dd.classList.add('active');}
function hideSupDrop(inp){inp.nextElementSibling.classList.remove('active');var v=inp.value.trim();if(v&&!suppliers.find(function(s){return s.toLowerCase()===v.toLowerCase();}))addNewSupplier(v);}
function filterSupDrop(inp){renderSupOptions(inp.nextElementSibling,inp.value);}
function renderSupOptions(dd,filter){
    var f=(filter||'').toLowerCase();var fl=suppliers.filter(function(s){return s.toLowerCase().indexOf(f)>=0;});
    dd.innerHTML=fl.map(function(s){return '<div class="supplier-option" onmousedown="pickSup(this,\''+s.replace(/'/g,"\\'")+'\')">' +s+'</div>';}).join('');
    if(!fl.length&&filter)dd.innerHTML='<div class="supplier-option" style="color:#9ca3af;font-style:italic">Новый — сохранится</div>';
}
function pickSup(el,name){var w=el.closest('.supplier-wrapper');w.querySelector('.supplier-input').value=name;w.querySelector('.supplier-dropdown').classList.remove('active');}

function addRoom(dupData){
    roomCounter++;var rid=roomCounter;var c=document.getElementById('roomsContainer');var div=document.createElement('div');
    div.className='room';div.id='room-'+rid;div.dataset.roomId=rid;
    div.innerHTML='<div class="room-header"><div class="room-header-left"><h2>Комната '+rid+'</h2><input type="text" class="room-name-input" placeholder="Название (Гостиная, Спальня...)" value="'+(dupData&&dupData.name||'')+'"></div><div style="display:flex;gap:8px;"><button class="btn btn-duplicate" onclick="duplicateRoom('+rid+')">📋 Дублировать</button><button class="btn btn-delete-room" onclick="deleteRoom('+rid+')">✕ Удалить</button></div></div><div class="room-body"><div class="block"><div class="block-header"><span class="block-title">🧵 Ткань</span><button class="btn btn-add" onclick="addFabricRow('+rid+')">+ Добавить</button></div><div id="fabric-rows-'+rid+'"></div></div><div class="tesma-block" id="tesma-block-'+rid+'" style="display:none"><h4>🧵 Тесьма (автоматически)</h4><div id="tesma-rows-'+rid+'"></div></div><div class="block"><div class="block-header"><span class="block-title">✂️ Пошив</span><button class="btn btn-add" onclick="addSewingRow('+rid+')">+ Добавить</button></div><div id="sewing-rows-'+rid+'"></div></div><div class="add-item-buttons"><button class="btn-add-optional" onclick="addCorniceBlock('+rid+')" id="btn-cornice-'+rid+'">+ Карниз</button><button class="btn-add-optional" onclick="addFurnitureBlock('+rid+')" id="btn-furniture-'+rid+'">+ Фурнитура</button><button class="btn-add-optional" onclick="addServicesBlock('+rid+')" id="btn-services-'+rid+'">+ Услуги</button><button class="btn-add-optional" onclick="addExtraItemRow('+rid+')">+ Непредвиденные</button></div><div id="cornice-block-'+rid+'"></div><div id="furniture-block-'+rid+'"></div><div id="vyveshivanie-block-'+rid+'"></div><div id="services-block-'+rid+'"></div><div class="block" id="extra-block-'+rid+'" style="display:none"><div class="block-header"><span class="block-title">📦 Непредвиденные товары</span><button class="btn btn-add" onclick="addExtraItemRow('+rid+')">+ Добавить</button></div><div id="extra-rows-'+rid+'"></div></div></div><div class="subtotal-row"><span class="subtotal-label">ПОДИТОГ:</span><span class="subtotal-value" id="subtotal-'+rid+'">0 ₽</span></div>';
    c.appendChild(div);recalcRoom(rid);
}
function deleteRoom(rid){if(!confirm('Удалить комнату?'))return;document.getElementById('room-'+rid).remove();recalcGrandTotal();}
function duplicateRoom(rid){
    var room=document.getElementById('room-'+rid);var name=room.querySelector('.room-name-input').value;
    addRoom({name:name});var nrid=roomCounter;var src=room.querySelector('.room-body');var tgt=document.getElementById('room-'+nrid).querySelector('.room-body');
    var h=src.innerHTML;h=h.replace(new RegExp('-'+rid+'-','g'),'-'+nrid+'-').replace(new RegExp('-'+rid+'"','g'),'-'+nrid+'"').replace(new RegExp('\\('+rid+'\\)','g'),'('+nrid+')').replace(new RegExp('\\('+rid+',','g'),'('+nrid+',');
    tgt.innerHTML=h;var si=src.querySelectorAll('input,select'),ti=tgt.querySelectorAll('input,select');
    si.forEach(function(inp,i){if(ti[i])ti[i].value=inp.value;});
    fabricCounters[nrid]=fabricCounters[rid]||0;sewingCounters[nrid]=sewingCounters[rid]||0;extraCounters[nrid]=extraCounters[rid]||0;recalcRoom(nrid);
}

function addFabricRow(rid){
    if(!fabricCounters[rid])fabricCounters[rid]=0;fabricCounters[rid]++;var idx=fabricCounters[rid];
    var c=document.getElementById('fabric-rows-'+rid);var row=document.createElement('div');row.className='item-row';row.id='fr-'+rid+'-'+idx;
    row.innerHTML='<div class="field-group field-type"><label>Вид изделия</label><select onchange="onFabricChange('+rid+')" id="ft-'+rid+'-'+idx+'"><option value="">-- Выбрать --</option><option value="portera">Портьеры</option><option value="portera_wave">Портьера волна</option><option value="portera_bant">Портьера бантовка</option><option value="tul">Тюль</option><option value="tul_bant">Тюль бантовка</option><option value="rimskaya">Римская штора</option><option value="pokryvalo">Покрывало</option></select></div>'+createSupplierField()+'<div class="field-group field-article"><label>Артикул</label><input type="text" placeholder="Артикул" class="fabric-article"></div><div class="field-group field-qty"><label>Кол-во (м.п.)</label><input type="number" placeholder="0" oninput="calcFabric('+rid+')" id="fq-'+rid+'-'+idx+'" step="0.01"></div><div class="field-group field-price"><label>Цена за м.п.</label><input type="number" placeholder="0" oninput="calcFabric('+rid+')" id="fp-'+rid+'-'+idx+'" step="0.01"></div><div class="field-group field-total"><label>Итого</label><div class="item-total" id="ftt-'+rid+'-'+idx+'">0 ₽</div></div><button class="btn btn-delete" onclick="remFabric('+rid+','+idx+')">✕</button>';
    c.appendChild(row);
}
function remFabric(rid,idx){var el=document.getElementById('fr-'+rid+'-'+idx);if(el)el.remove();calcFabric(rid);}
function onFabricChange(rid){calcFabric(rid);}
function calcFabric(rid){
    document.querySelectorAll('#fabric-rows-'+rid+' .item-row').forEach(function(row){
        var q=parseFloat(row.querySelector('[id^="fq-"]').value)||0;var p=parseFloat(row.querySelector('[id^="fp-"]').value)||0;
        var tE=row.querySelector('[id^="ftt-"]');if(tE)tE.textContent=fmt(Math.round(q*p));
    });recalcTesma(rid);recalcVyv(rid);recalcRoom(rid);
}

function recalcTesma(rid){
    var c=document.getElementById('tesma-rows-'+rid);var pt=settings.price_tesma||350;c.innerHTML='';var has=false;
    document.querySelectorAll('#fabric-rows-'+rid+' .item-row').forEach(function(row){
        var type=row.querySelector('select').value||'';var qty=parseFloat(row.querySelector('[id^="fq-"]').value)||0;
        if(['portera','portera_wave','portera_bant','tul','tul_bant'].indexOf(type)>=0&&qty>0){
            has=true;var len=qty+0.2,total=Math.round(len*pt);var lbl=type.indexOf('portera')===0?'Тесьма для портьеры':'Тесьма для тюля';
            c.innerHTML+='<div class="tesma-row"><span>'+lbl+'</span><span class="tesma-calc">'+len.toFixed(2)+' м × '+fmt(pt)+'</span><span class="tesma-sum">'+fmt(total)+'</span></div>';
        }
    });document.getElementById('tesma-block-'+rid).style.display=has?'block':'none';
}
function getTesmaTotal(rid){
    var p=settings.price_tesma||350;var t=0;
    document.querySelectorAll('#fabric-rows-'+rid+' .item-row').forEach(function(row){
        var type=row.querySelector('select').value||'';var qty=parseFloat(row.querySelector('[id^="fq-"]').value)||0;
        if(['portera','portera_wave','portera_bant','tul','tul_bant'].indexOf(type)>=0&&qty>0)t+=Math.round((qty+0.2)*p);
    });return t;
}

function addSewingRow(rid){
    if(!sewingCounters[rid])sewingCounters[rid]=0;sewingCounters[rid]++;var idx=sewingCounters[rid];
    var c=document.getElementById('sewing-rows-'+rid);var row=document.createElement('div');row.className='item-row';row.id='sr-'+rid+'-'+idx;
    row.style.flexDirection='column';row.style.alignItems='stretch';
    row.innerHTML='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;"><div class="field-group field-type"><label>Вид</label><select onchange="onSewType('+rid+','+idx+')" id="st-'+rid+'-'+idx+'"><option value="">-- Выбрать --</option><option value="portera">Портьера</option><option value="portera_wave">Портьера волна</option><option value="portera_bant">Портьера бантовка</option><option value="tul">Тюль</option><option value="tul_bant">Тюль бантовка</option><option value="rimskaya">Римская штора</option><option value="pokryvalo">Покрывало</option></select></div><div id="sf-'+rid+'-'+idx+'" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:1;"></div><div class="field-group field-total"><label>Итого</label><div class="item-total" id="stt-'+rid+'-'+idx+'">0 ₽</div></div><button class="btn btn-delete" onclick="remSewing('+rid+','+idx+')">✕</button></div><div id="se-'+rid+'-'+idx+'"></div>';
    c.appendChild(row);
}
function remSewing(rid,idx){var el=document.getElementById('sr-'+rid+'-'+idx);if(el)el.remove();recalcRoom(rid);}
function onSewType(rid,idx){
    var type=document.getElementById('st-'+rid+'-'+idx).value;var fc=document.getElementById('sf-'+rid+'-'+idx);var ec=document.getElementById('se-'+rid+'-'+idx);
    var oi='calcSew('+rid+','+idx+')';var defD=settings.price_strochka||200;var h='',eh='';
    if(['portera','portera_wave','portera_bant','tul','tul_bant'].indexOf(type)>=0){
        h='<div class="field-group field-small"><label>Ширина(A)</label><input type="number" id="sa-'+rid+'-'+idx+'" oninput="'+oi+'" step="0.01"></div><div class="field-group field-small"><label>Высота(B)</label><input type="number" id="sb-'+rid+'-'+idx+'" oninput="'+oi+'" step="0.01"></div>';
        if(type==='portera_bant'||type==='tul_bant')h+='<div class="field-group field-small"><label>Шир.изд.(W)</label><input type="number" id="sw-'+rid+'-'+idx+'" oninput="'+oi+'" step="0.01"></div>';
        h+='<div class="field-group field-small"><label>Строчка(D)</label><input type="number" id="sd-'+rid+'-'+idx+'" oninput="'+oi+'" step="0.01" value="'+defD+'"></div><div class="field-group field-small"><label>Кол-во(K)</label><input type="number" id="sk-'+rid+'-'+idx+'" oninput="'+oi+'" value="1" step="1"></div><div class="field-group field-small"><label>Сложн.%</label><input type="number" id="sp-'+rid+'-'+idx+'" oninput="'+oi+'" value="0" step="1"></div>';
    }else if(type==='rimskaya'){
        h='<div class="field-group field-small"><label>Площадь(м²)</label><input type="number" id="sarea-'+rid+'-'+idx+'" oninput="'+oi+'" step="0.01"></div><div class="field-group field-price"><label>Цена за м²</label><input type="number" id="sprice-'+rid+'-'+idx+'" oninput="'+oi+'" step="0.01"></div>';
        eh='<div class="extra-fields"><div class="extra-field-row"><label>Тесьма:</label><input type="number" id="srt-q-'+rid+'-'+idx+'" placeholder="кол-во" oninput="'+oi+'" step="0.01"><span>×</span><input type="number" id="srt-p-'+rid+'-'+idx+'" placeholder="цена" oninput="'+oi+'" step="0.01"><span class="extra-field-total" id="srt-t-'+rid+'-'+idx+'">0 ₽</span></div><div class="extra-field-row"><label>Вывешивание:</label><input type="number" id="srv-q-'+rid+'-'+idx+'" placeholder="кол-во" oninput="'+oi+'" step="0.01"><span>×</span><input type="number" id="srv-p-'+rid+'-'+idx+'" placeholder="цена" oninput="'+oi+'" step="0.01"><span class="extra-field-total" id="srv-t-'+rid+'-'+idx+'">0 ₽</span></div><div class="extra-field-row"><label>Колечки:</label><input type="number" id="srr-q-'+rid+'-'+idx+'" placeholder="кол-во" oninput="'+oi+'" step="1"><span>×</span><input type="number" id="srr-p-'+rid+'-'+idx+'" placeholder="цена" oninput="'+oi+'" step="0.01"><span class="extra-field-total" id="srr-t-'+rid+'-'+idx+'">0 ₽</span></div></div>';
    }else if(type==='pokryvalo'){
        h='<div class="field-group field-small"><label>Площадь(м²)</label><input type="number" id="sarea-'+rid+'-'+idx+'" oninput="'+oi+'" step="0.01"></div><div class="field-group field-price"><label>Цена за м²</label><input type="number" id="sprice-'+rid+'-'+idx+'" oninput="'+oi+'" step="0.01"></div>';
        eh='<div class="extra-fields"><div class="extra-field-row"><label>Стёжка:</label><input type="number" id="sps-q-'+rid+'-'+idx+'" placeholder="п.м." oninput="'+oi+'" step="0.01"><span>×</span><input type="number" id="sps-p-'+rid+'-'+idx+'" placeholder="цена" oninput="'+oi+'" step="0.01"><span class="extra-field-total" id="sps-t-'+rid+'-'+idx+'">0 ₽</span></div><div class="extra-field-row"><label>Подклада:</label><input type="number" id="spd-q-'+rid+'-'+idx+'" placeholder="п.м." oninput="'+oi+'" step="0.01"><span>×</span><input type="number" id="spd-p-'+rid+'-'+idx+'" placeholder="цена" oninput="'+oi+'" step="0.01"><span class="extra-field-total" id="spd-t-'+rid+'-'+idx+'">0 ₽</span></div><div class="extra-field-row"><label>Кант:</label><input type="number" id="spk-q-'+rid+'-'+idx+'" placeholder="п.м." oninput="'+oi+'" step="0.01"><span>×</span><input type="number" id="spk-p-'+rid+'-'+idx+'" placeholder="цена" oninput="'+oi+'" step="0.01"><span class="extra-field-total" id="spk-t-'+rid+'-'+idx+'">0 ₽</span></div></div>';
    }
    fc.innerHTML=h;ec.innerHTML=eh;calcSew(rid,idx);
}
function calcSew(rid,idx){
    var type=(document.getElementById('st-'+rid+'-'+idx)||{}).value||'';
    function gv(id){return parseFloat((document.getElementById(id)||{}).value)||0;}
    var total=0;
    if(type==='portera'){var A=gv('sa-'+rid+'-'+idx),B=gv('sb-'+rid+'-'+idx),D=gv('sd-'+rid+'-'+idx),K=gv('sk-'+rid+'-'+idx)||1,P=gv('sp-'+rid+'-'+idx);total=Math.round(((A*3)+(B*2))*D*(1+P/100)*K);}
    else if(type==='portera_wave'){var A=gv('sa-'+rid+'-'+idx),B=gv('sb-'+rid+'-'+idx),D=gv('sd-'+rid+'-'+idx),K=gv('sk-'+rid+'-'+idx)||1,P=gv('sp-'+rid+'-'+idx),wp=settings.price_wave_markup||150;total=Math.round((((A*3)+(B*2))*D+(A*wp))*(1+P/100)*K);}
    else if(type==='portera_bant'){var A=gv('sa-'+rid+'-'+idx),B=gv('sb-'+rid+'-'+idx),W=gv('sw-'+rid+'-'+idx),D=gv('sd-'+rid+'-'+idx),K=gv('sk-'+rid+'-'+idx)||1,P=gv('sp-'+rid+'-'+idx),bp=settings.price_bantovka||1200;total=Math.round((((A*3)+(B*2))*D+(W*bp))*(1+P/100)*K);}
    else if(type==='tul'){var A=gv('sa-'+rid+'-'+idx),B=gv('sb-'+rid+'-'+idx),D=gv('sd-'+rid+'-'+idx),K=gv('sk-'+rid+'-'+idx)||1,P=gv('sp-'+rid+'-'+idx);total=Math.round(((A*2)+(B*2))*D*(1+P/100)*K);}
    else if(type==='tul_bant'){var A=gv('sa-'+rid+'-'+idx),B=gv('sb-'+rid+'-'+idx),W=gv('sw-'+rid+'-'+idx),D=gv('sd-'+rid+'-'+idx),K=gv('sk-'+rid+'-'+idx)||1,P=gv('sp-'+rid+'-'+idx);total=Math.round(((A*2)+(B*2)+(W*3))*D*(1+P/100)*K);}
    else if(type==='rimskaya'){total=Math.round(gv('sarea-'+rid+'-'+idx)*gv('sprice-'+rid+'-'+idx));['rt','rv','rr'].forEach(function(x){var q=gv('s'+x+'-q-'+rid+'-'+idx),p=gv('s'+x+'-p-'+rid+'-'+idx),t=Math.round(q*p);var el=document.getElementById('s'+x+'-t-'+rid+'-'+idx);if(el)el.textContent=fmt(t);total+=t;});}
    else if(type==='pokryvalo'){total=Math.round(gv('sarea-'+rid+'-'+idx)*gv('sprice-'+rid+'-'+idx));['ps','pd','pk'].forEach(function(x){var q=gv('s'+x+'-q-'+rid+'-'+idx),p=gv('s'+x+'-p-'+rid+'-'+idx),t=Math.round(q*p);var el=document.getElementById('s'+x+'-t-'+rid+'-'+idx);if(el)el.textContent=fmt(t);total+=t;});}
    var el=document.getElementById('stt-'+rid+'-'+idx);if(el)el.textContent=fmt(total);recalcRoom(rid);
}

function recalcVyv(rid){
    var c=document.getElementById('vyveshivanie-block-'+rid);if(c.dataset.removed)return;
    var pv=getVyvPrice();var meters=0;
    document.querySelectorAll('#fabric-rows-'+rid+' .item-row').forEach(function(row){
        var type=row.querySelector('select').value||'';var qty=parseFloat(row.querySelector('[id^="fq-"]').value)||0;
        if(['portera','portera_wave','portera_bant','tul','tul_bant'].indexOf(type)>=0)meters+=qty;
    });
    if(meters>0){var total=Math.round(meters*pv);c.innerHTML='<div class="vyveshivanie-block"><h4>📐 Вывешивание</h4><div class="vyveshivanie-info"><span>Метраж: <strong>'+meters.toFixed(2)+' м</strong></span><span>× <strong>'+fmt(pv)+'</strong></span><span class="vyveshivanie-total">ИТОГО: '+fmt(total)+'</span><button class="btn btn-delete" onclick="remVyv('+rid+')">✕ Удалить</button></div></div>';}
    else{c.innerHTML='';}recalcRoom(rid);
}
function remVyv(rid){var c=document.getElementById('vyveshivanie-block-'+rid);c.innerHTML='';c.dataset.removed='true';recalcRoom(rid);}
function getVyvPrice(){var item=priceList.find(function(p){return p.name==='Вывешивание';});return item?parseFloat(item.sell)||400:400;}
function getVyvTotal(rid){
    var c=document.getElementById('vyveshivanie-block-'+rid);if(c.dataset.removed||!c.innerHTML.trim())return 0;
    var pv=getVyvPrice();var m=0;
    document.querySelectorAll('#fabric-rows-'+rid+' .item-row').forEach(function(row){
        var type=row.querySelector('select').value||'';var qty=parseFloat(row.querySelector('[id^="fq-"]').value)||0;
        if(['portera','portera_wave','portera_bant','tul','tul_bant'].indexOf(type)>=0)m+=qty;
    });return Math.round(m*pv);
}

function addCorniceBlock(rid){
    var c=document.getElementById('cornice-block-'+rid);var b=document.getElementById('btn-cornice-'+rid);if(b)b.style.display='none';
    c.innerHTML='<div class="block"><div class="block-header"><span class="block-title">🔧 Карниз + Кронштейны</span><button class="btn btn-delete" onclick="remCornice('+rid+')">✕</button></div><div class="item-row"><div class="field-group field-type"><label>Тип</label><select id="ct-'+rid+'" onchange="onCorniceType('+rid+')"><option value="">-- Выбрать --</option><option value="sm">СМ (пластиковый)</option><option value="profile">Профильный</option><option value="rimsky">Римский</option></select></div><div class="field-group field-small"><label>Длина(м)</label><input type="number" id="cl-'+rid+'" oninput="calcCornice('+rid+')" step="0.01"></div><div class="field-group field-price"><label>Цена за м</label><input type="number" id="cp-'+rid+'" oninput="calcCornice('+rid+')" step="0.01"></div><div class="field-group field-total"><label>Итого</label><div class="item-total" id="ctt-'+rid+'">0 ₽</div></div></div><div class="item-row"><div class="field-group field-type"><label>Кронштейн</label><select id="bs-'+rid+'"><option value="10">10 см</option><option value="15">15 см</option><option value="20">20 см</option><option value="25">25 см</option></select></div><div class="field-group field-small"><label>Кол-во</label><input type="number" id="bq-'+rid+'" oninput="calcCornice('+rid+')" step="1"></div><div class="field-group field-price"><label>Цена/шт</label><input type="number" id="bp-'+rid+'" oninput="calcCornice('+rid+')" step="0.01"></div><div class="field-group field-total"><label>Итого</label><div class="item-total" id="btt-'+rid+'">0 ₽</div></div></div><div style="text-align:right;padding:5px 10px;"><strong>Всего: <span id="cgt-'+rid+'">0 ₽</span></strong></div></div>';
}
function remCornice(rid){document.getElementById('cornice-block-'+rid).innerHTML='';var b=document.getElementById('btn-cornice-'+rid);if(b)b.style.display='';recalcRoom(rid);}
function getCorniceDefPrices(){var m={};priceList.forEach(function(p){if(p.name==='Карниз СМ')m.sm=p.sell;if(p.name==='Карниз профильный')m.profile=p.sell;if(p.name==='Карниз римский')m.rimsky=p.sell;});return{sm:m.sm||550,profile:m.profile||1000,rimsky:m.rimsky||5000};}
function onCorniceType(rid){var type=document.getElementById('ct-'+rid).value;var prices=getCorniceDefPrices();if(prices[type])document.getElementById('cp-'+rid).value=prices[type];calcCornice(rid);}
function calcCornice(rid){var l=parseFloat((document.getElementById('cl-'+rid)||{}).value)||0,p=parseFloat((document.getElementById('cp-'+rid)||{}).value)||0,bq=parseFloat((document.getElementById('bq-'+rid)||{}).value)||0,bp=parseFloat((document.getElementById('bp-'+rid)||{}).value)||0;var ct=Math.round(l*p),bt=Math.round(bq*bp);setT('ctt-'+rid,ct);setT('btt-'+rid,bt);setT('cgt-'+rid,ct+bt);recalcRoom(rid);}
function getCorniceTotal(rid){var l=parseFloat((document.getElementById('cl-'+rid)||{}).value)||0,p=parseFloat((document.getElementById('cp-'+rid)||{}).value)||0,bq=parseFloat((document.getElementById('bq-'+rid)||{}).value)||0,bp=parseFloat((document.getElementById('bp-'+rid)||{}).value)||0;return Math.round(l*p)+Math.round(bq*bp);}

function addFurnitureBlock(rid){
    var c=document.getElementById('furniture-block-'+rid);var b=document.getElementById('btn-furniture-'+rid);if(b)b.style.display='none';
    var h='<div class="block"><div class="block-header"><span class="block-title">🔩 Фурнитура</span><button class="btn btn-delete" onclick="remFurniture('+rid+')">✕</button></div>';
    FUR_ITEMS.forEach(function(fi){h+='<div class="item-row"><div class="field-group field-wide"><label>'+fi.label+'</label></div><div class="field-group field-small"><label>Кол-во('+fi.u+')</label><input type="number" id="fu-'+fi.id+'-q-'+rid+'" oninput="calcFur('+rid+')" step="0.01"></div><div class="field-group field-price"><label>Цена</label><input type="number" id="fu-'+fi.id+'-p-'+rid+'" oninput="calcFur('+rid+')" step="0.01"></div><div class="field-group field-total"><label>Итого</label><div class="item-total" id="fu-'+fi.id+'-t-'+rid+'">0 ₽</div></div></div>';});
    h+='<div style="text-align:right;padding:5px 10px;"><strong>Всего: <span id="fgt-'+rid+'">0 ₽</span></strong></div></div>';c.innerHTML=h;
}
function remFurniture(rid){document.getElementById('furniture-block-'+rid).innerHTML='';var b=document.getElementById('btn-furniture-'+rid);if(b)b.style.display='';recalcRoom(rid);}
function calcFur(rid){var g=0;FUR_ITEMS.forEach(function(fi){var q=parseFloat((document.getElementById('fu-'+fi.id+'-q-'+rid)||{}).value)||0,p=parseFloat((document.getElementById('fu-'+fi.id+'-p-'+rid)||{}).value)||0,t=Math.round(q*p);setT('fu-'+fi.id+'-t-'+rid,t);g+=t;});setT('fgt-'+rid,g);recalcRoom(rid);}
function getFurTotal(rid){var t=0;FUR_ITEMS.forEach(function(fi){var q=parseFloat((document.getElementById('fu-'+fi.id+'-q-'+rid)||{}).value)||0,p=parseFloat((document.getElementById('fu-'+fi.id+'-p-'+rid)||{}).value)||0;t+=Math.round(q*p);});return t;}

function addServicesBlock(rid){
    var c=document.getElementById('services-block-'+rid);var b=document.getElementById('btn-services-'+rid);if(b)b.style.display='none';
    c.innerHTML='<div class="block"><div class="block-header"><span class="block-title">🚛 Услуги</span><button class="btn btn-delete" onclick="remServices('+rid+')">✕</button></div><div class="item-row"><div class="field-group field-wide"><label>Установка карниза</label></div><div class="field-group field-small"><label>Метры</label><input type="number" id="sim-'+rid+'" oninput="calcServices('+rid+')" step="0.01"></div><div class="field-group field-price"><label>Цена/м</label><input type="number" id="sip-'+rid+'" oninput="calcServices('+rid+')" step="0.01"></div><div class="field-group field-total"><label>Итого</label><div class="item-total" id="sit-'+rid+'">0 ₽</div></div></div><div class="item-row"><div class="field-group field-wide"><label>Доставка</label></div><div class="field-group field-price"><label>Сумма</label><input type="number" id="sdl-'+rid+'" oninput="calcServices('+rid+')" step="0.01"></div></div><div class="item-row"><div class="field-group field-wide"><label>Выезд дизайнера</label></div><div class="field-group field-price"><label>Сумма</label><input type="number" id="sds-'+rid+'" oninput="calcServices('+rid+')" step="0.01"></div></div><div style="text-align:right;padding:5px 10px;"><strong>Всего: <span id="sgt-'+rid+'">0 ₽</span></strong></div></div>';
}
function remServices(rid){document.getElementById('services-block-'+rid).innerHTML='';var b=document.getElementById('btn-services-'+rid);if(b)b.style.display='';recalcRoom(rid);}
function calcServices(rid){
    var im=parseFloat((document.getElementById('sim-'+rid)||{}).value)||0;var ip=parseFloat((document.getElementById('sip-'+rid)||{}).value)||0;var it=Math.round(im*ip);setT('sit-'+rid,it);
    var dl=Math.round(parseFloat((document.getElementById('sdl-'+rid)||{}).value)||0);var ds=Math.round(parseFloat((document.getElementById('sds-'+rid)||{}).value)||0);
    setT('sgt-'+rid,it+dl+ds);recalcRoom(rid);
}
function getServicesTotal(rid){
    var im=parseFloat((document.getElementById('sim-'+rid)||{}).value)||0;var ip=parseFloat((document.getElementById('sip-'+rid)||{}).value)||0;
    var dl=parseFloat((document.getElementById('sdl-'+rid)||{}).value)||0;var ds=parseFloat((document.getElementById('sds-'+rid)||{}).value)||0;
    return Math.round(im*ip)+Math.round(dl)+Math.round(ds);
}

function addExtraItemRow(rid){
    document.getElementById('extra-block-'+rid).style.display='block';
    if(!extraCounters[rid])extraCounters[rid]=0;extraCounters[rid]++;var idx=extraCounters[rid];
    var c=document.getElementById('extra-rows-'+rid);var row=document.createElement('div');row.className='item-row';row.id='er-'+rid+'-'+idx;
    row.innerHTML='<div class="field-group field-wide"><label>Наименование</label><input type="text" class="extra-name"></div><div class="field-group field-article"><label>Артикул</label><input type="text" class="extra-article"></div><div class="field-group field-small"><label>Кол-во</label><input type="number" id="eq-'+rid+'-'+idx+'" oninput="calcExtra('+rid+')" step="0.01"></div><div class="field-group field-price"><label>Цена</label><input type="number" id="ep-'+rid+'-'+idx+'" oninput="calcExtra('+rid+')" step="0.01"></div><div class="field-group field-total"><label>Итого</label><div class="item-total" id="ett-'+rid+'-'+idx+'">0 ₽</div></div><button class="btn btn-delete" onclick="remExtra('+rid+','+idx+')">✕</button>';
    c.appendChild(row);
}
function remExtra(rid,idx){var el=document.getElementById('er-'+rid+'-'+idx);if(el)el.remove();calcExtra(rid);}
function calcExtra(rid){
    document.querySelectorAll('#extra-rows-'+rid+' .item-row').forEach(function(row){
        var q=parseFloat(row.querySelector('[id^="eq-"]').value)||0;var p=parseFloat(row.querySelector('[id^="ep-"]').value)||0;
        var tE=row.querySelector('[id^="ett-"]');if(tE)tE.textContent=fmt(Math.round(q*p));
    });recalcRoom(rid);
}
function getExtraTotal(rid){
    var t=0;document.querySelectorAll('#extra-rows-'+rid+' .item-row').forEach(function(row){
        var q=parseFloat(row.querySelector('[id^="eq-"]').value)||0;var p=parseFloat(row.querySelector('[id^="ep-"]').value)||0;t+=Math.round(q*p);
    });return t;
}

function recalcRoom(rid){
    var total=0;
    document.querySelectorAll('#fabric-rows-'+rid+' .item-row').forEach(function(row){
        var q=parseFloat(row.querySelector('[id^="fq-"]').value)||0;var p=parseFloat(row.querySelector('[id^="fp-"]').value)||0;total+=Math.round(q*p);
    });
    total+=getTesmaTotal(rid);
    document.querySelectorAll('#sewing-rows-'+rid+' .item-row').forEach(function(row){
        var el=row.querySelector('[id^="stt-"]');if(el)total+=prs(el.textContent);
    });
    total+=getVyvTotal(rid);total+=getCorniceTotal(rid);total+=getFurTotal(rid);total+=getServicesTotal(rid);total+=getExtraTotal(rid);
    setT('subtotal-'+rid,total);recalcGrandTotal();
}
function recalcGrandTotal(){
    var grand=0;document.querySelectorAll('.subtotal-value').forEach(function(el){grand+=prs(el.textContent);});
    var gt=document.getElementById('grandTotal');if(gt)gt.textContent=fmt(grand);
}
function recalcAll(){
    document.querySelectorAll('.room').forEach(function(room){var rid=room.dataset.roomId;if(rid)recalcRoom(parseInt(rid));});
}

function newOrder(){
    if(!confirm('Создать новый заказ? Все данные будут очищены.'))return;
    roomCounter=0;fabricCounters={};sewingCounters={};extraCounters={};
    document.getElementById('roomsContainer').innerHTML='';
    document.getElementById('clientName').value='';document.getElementById('clientPhone').value='';document.getElementById('clientAddress').value='';
    addRoom();
}

function generatePDF(){
    var cn=(document.getElementById('clientName')||{}).value||'—';
    var cp=(document.getElementById('clientPhone')||{}).value||'—';
    var ca=(document.getElementById('clientAddress')||{}).value||'—';
    var today=new Date().toLocaleDateString('ru-RU');
    var grandTotal=prs((document.getElementById('grandTotal')||{}).textContent||'0');
    var h='<div style="text-align:center;border-bottom:2px solid #6b4c9a;padding-bottom:10px;margin-bottom:15px;"><div style="font-size:22px;font-weight:bold;color:#6b4c9a;">DECOR BONJOUR</div><div style="font-size:11px;color:#555;">+7 918 555 80 94 | +7 918 555 80 96 | пр. Сиверса 23</div></div>';
    h+='<div style="margin-bottom:15px;"><strong>Дата:</strong> '+today+' &nbsp; <strong>Клиент:</strong> '+escHTML(cn)+' &nbsp; <strong>Тел:</strong> '+escHTML(cp)+' &nbsp; <strong>Адрес:</strong> '+escHTML(ca)+'</div>';
    document.querySelectorAll('.room').forEach(function(room){
        var rid=room.dataset.roomId;var rname=room.querySelector('.room-name-input').value||'Комната '+rid;
        var sub=room.querySelector('.subtotal-value').textContent||'0 ₽';
        h+='<div style="margin-top:20px;border:1px solid #ddd;border-radius:8px;padding:12px;"><div style="font-size:16px;font-weight:bold;color:#6b4c9a;border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:8px;">'+escHTML(rname)+'</div>';
        var fabrics=room.querySelectorAll('#fabric-rows-'+rid+' .item-row');
        if(fabrics.length){
            h+='<div style="margin-bottom:8px;"><strong>Ткань:</strong><table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:4px;"><tr style="background:#f3f0ff;"><th style="text-align:left;padding:3px 6px;">Вид</th><th style="text-align:left;padding:3px 6px;">Поставщик</th><th style="text-align:left;padding:3px 6px;">Артикул</th><th style="text-align:right;padding:3px 6px;">Кол-во</th><th style="text-align:right;padding:3px 6px;">Цена</th><th style="text-align:right;padding:3px 6px;">Итого</th></tr>';
            fabrics.forEach(function(row){
                var type=(row.querySelector('select').selectedOptions[0]||{}).text||'—';var sup=(row.querySelector('.supplier-input')||{}).value||'—';var art=(row.querySelector('.fabric-article')||{}).value||'—';
                var qty=(row.querySelector('[id^="fq-"]')||{}).value||'0';var price=(row.querySelector('[id^="fp-"]')||{}).value||'0';var total=(row.querySelector('[id^="ftt-"]')||{}).textContent||'0 ₽';
                h+='<tr><td style="padding:3px 6px;">'+escHTML(type)+'</td><td style="padding:3px 6px;">'+escHTML(sup)+'</td><td style="padding:3px 6px;">'+escHTML(art)+'</td><td style="text-align:right;padding:3px 6px;">'+qty+'</td><td style="text-align:right;padding:3px 6px;">'+price+'</td><td style="text-align:right;padding:3px 6px;">'+total+'</td></tr>';
            });h+='</table></div>';
        }
        var tesmaRows=room.querySelectorAll('#tesma-rows-'+rid+' .tesma-row');
        if(tesmaRows.length){h+='<div style="margin-bottom:8px;"><strong>Тесьма:</strong><ul style="margin:4px 0;padding-left:20px;font-size:12px;">';tesmaRows.forEach(function(tr){h+='<li>'+tr.textContent.trim()+'</li>';});h+='</ul></div>';}
        var sewings=room.querySelectorAll('#sewing-rows-'+rid+' .item-row');
        if(sewings.length){
            h+='<div style="margin-bottom:8px;"><strong>Пошив:</strong><table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:4px;"><tr style="background:#f3f0ff;"><th style="text-align:left;padding:3px 6px;">Вид</th><th style="text-align:right;padding:3px 6px;">Итого</th></tr>';
            sewings.forEach(function(row){var type=(row.querySelector('select').selectedOptions[0]||{}).text||'—';var total=(row.querySelector('[id^="stt-"]')||{}).textContent||'0 ₽';h+='<tr><td style="padding:3px 6px;">'+escHTML(type)+'</td><td style="text-align:right;padding:3px 6px;">'+total+'</td></tr>';});
            h+='</table></div>';
        }
        var vyv=room.querySelector('#vyveshivanie-block-'+rid+' .vyveshivanie-info');
        if(vyv){h+='<div style="margin-bottom:8px;font-size:12px;"><strong>Вывешивание:</strong> '+vyv.textContent.trim()+'</div>';}
        var corniceEl=room.querySelector('#cornice-block-'+rid+' .block');
        if(corniceEl){var ctotal=(room.querySelector('#cgt-'+rid)||{}).textContent||'0 ₽';h+='<div style="margin-bottom:8px;font-size:12px;"><strong>Карниз:</strong> Всего '+ctotal+'</div>';}
        var furEl=room.querySelector('#furniture-block-'+rid+' .block');
        if(furEl){var ftotal=(room.querySelector('#fgt-'+rid)||{}).textContent||'0 ₽';h+='<div style="margin-bottom:8px;font-size:12px;"><strong>Фурнитура:</strong> Всего '+ftotal+'</div>';}
        var svcEl=room.querySelector('#services-block-'+rid+' .block');
        if(svcEl){var stotal=(room.querySelector('#sgt-'+rid)||{}).textContent||'0 ₽';h+='<div style="margin-bottom:8px;font-size:12px;"><strong>Услуги:</strong> Всего '+stotal+'</div>';}
        var extras=room.querySelectorAll('#extra-rows-'+rid+' .item-row');
        if(extras.length){
            h+='<div style="margin-bottom:8px;"><strong>Непредвиденные:</strong><table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:4px;"><tr style="background:#f3f0ff;"><th style="text-align:left;padding:3px 6px;">Наименование</th><th style="text-align:right;padding:3px 6px;">Кол-во</th><th style="text-align:right;padding:3px 6px;">Цена</th><th style="text-align:right;padding:3px 6px;">Итого</th></tr>';
            extras.forEach(function(row){var nm=(row.querySelector('.extra-name')||{}).value||'—';var qty=(row.querySelector('[id^="eq-"]')||{}).value||'0';var price=(row.querySelector('[id^="ep-"]')||{}).value||'0';var total=(row.querySelector('[id^="ett-"]')||{}).textContent||'0 ₽';h+='<tr><td style="padding:3px 6px;">'+escHTML(nm)+'</td><td style="text-align:right;padding:3px 6px;">'+qty+'</td><td style="text-align:right;padding:3px 6px;">'+price+'</td><td style="text-align:right;padding:3px 6px;">'+total+'</td></tr>';});
            h+='</table></div>';
        }
        h+='<div style="text-align:right;font-weight:bold;color:#6b4c9a;border-top:1px solid #eee;padding-top:6px;">ПОДИТОГ: '+sub+'</div></div>';
    });
    h+='<div style="margin-top:25px;text-align:right;font-size:20px;font-weight:bold;color:#6b4c9a;border-top:3px solid #6b4c9a;padding-top:10px;">ИТОГО: '+fmt(grandTotal)+'</div>';
    var win=window.open('','_blank');
    if(!win){alert('Разрешите всплывающие окна');return;}
    win.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>DECOR BONJOUR</title><style>body{font-family:Arial,sans-serif;font-size:13px;color:#333;padding:30px;max-width:800px;margin:0 auto;}table{border:1px solid #ddd;}th,td{border-bottom:1px solid #eee;}@media print{body{padding:10px;}}</style></head><body>'+h+'</body></html>');
    win.document.close();setTimeout(function(){win.print();},600);
}
