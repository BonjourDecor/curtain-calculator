// =============================================
// DECOR BONJOUR — Калькулятор заказов
// Версия для GitHub Pages (localStorage)
// =============================================

const STORAGE_KEYS = {
    settings: 'db_settings',
    priceList: 'db_price_list',
    suppliers: 'db_suppliers'
};

const DEFAULT_SETTINGS = {
    price_strochka: { value: 200, label: 'Цена строчки (₽/м)' },
    price_wave_markup: { value: 150, label: 'Цена разметки волны (₽/м)' },
    price_bantovka: { value: 1200, label: 'Цена бантовки (₽/м готового изделия)' },
    price_tesma: { value: 350, label: 'Цена тесьмы (₽/м)' }
};

const DEFAULT_PRICE_LIST = [
    { id: 1, name: 'Строчка', cost: 90, sell: 200 },
    { id: 2, name: 'Разметка волны', cost: '', sell: 150 },
    { id: 3, name: 'Бантовка', cost: '', sell: 1200 },
    { id: 4, name: 'Тесьма', cost: '', sell: 350 },
    { id: 5, name: 'Карниз СМ', cost: '', sell: 550 },
    { id: 6, name: 'Карниз профильный', cost: '', sell: 1000 },
    { id: 7, name: 'Карниз римский', cost: '', sell: 5000 },
    { id: 8, name: 'Вывешивание', cost: '', sell: 400 }
];

let settings = {};
let priceList = [];
let suppliers = [];
let roomCounter = 0;
let fabricCounters = {};
let sewingCounters = {};
let extraCounters = {};

const FUR_ITEMS = [
    {id:'cord',label:'Корд для волны',u:'м'},
    {id:'hiron',label:'Крючки железные',u:'шт'},
    {id:'hsnail',label:'Крючки улитка',u:'шт'},
    {id:'hnail',label:'Крючки гвоздик',u:'шт'},
    {id:'holder',label:'Держатель (подхват)',u:'шт'}
];

// ===== УТИЛИТЫ =====
function fmt(n) {
    return Math.round(n).toLocaleString('ru-RU') + ' ₽';
}

function prs(s) {
    return parseInt(String(s).replace(/[^\d-]/g, '')) || 0;
}

function setT(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = fmt(val);
}

function escHTML(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    addRoom();
});

function loadAllData() {
    const savedSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || 'null');
    if (savedSettings) {
        settings = savedSettings;
    } else {
        settings = {};
        for (const [key, val] of Object.entries(DEFAULT_SETTINGS)) {
            settings[key] = val.value;
        }
        localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    }
    const savedPrice = JSON.parse(localStorage.getItem(STORAGE_KEYS.priceList) || 'null');
    priceList = savedPrice || [...DEFAULT_PRICE_LIST];
    if (!savedPrice) localStorage.setItem(STORAGE_KEYS.priceList, JSON.stringify(priceList));
    const savedSuppliers = JSON.parse(localStorage.getItem(STORAGE_KEYS.suppliers) || 'null');
    suppliers = savedSuppliers || [];
    if (!savedSuppliers) localStorage.setItem(STORAGE_KEYS.suppliers, JSON.stringify(suppliers));
}

function saveSettings2Storage() { localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings)); }
function savePriceList2Storage() { localStorage.setItem(STORAGE_KEYS.priceList, JSON.stringify(priceList)); }
function saveSuppliers2Storage() { localStorage.setItem(STORAGE_KEYS.suppliers, JSON.stringify(suppliers)); }

// ===== НАСТРОЙКИ =====
function openSettings() {
    const container = document.getElementById('settingsContent');
    let html = '';
    for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
        html += '<div class="settings-row"><label>' + def.label + '</label><input type="number" data-key="' + key + '" value="' + (settings[key] || def.value) + '" step="0.01"></div>';
    }
    container.innerHTML = html;
    document.getElementById('settingsModal').classList.add('active');
}
function closeSettings() { document.getElementById('settingsModal').classList.remove('active'); }
function saveSettings() {
    document.querySelectorAll('#settingsContent input[data-key]').forEach(input => {
        settings[input.dataset.key] = parseFloat(input.value) || 0;
    });
    saveSettings2Storage();
    closeSettings();
    recalcAll();
}

// ===== ПРАЙС-ЛИСТ =====
function openPriceList() { renderPriceList(); document.getElementById('priceListModal').classList.add('active'); }
function closePriceList() { document.getElementById('priceListModal').classList.remove('active'); }
function renderPriceList() {
    const body = document.getElementById('priceListBody');
    body.innerHTML = priceList.map((item, i) =>
        '<tr><td><input type="text" value="' + (item.name||'') + '" onchange="updatePriceItem(' + i + ',\'name\',this.value)"></td>' +
        '<td><input type="number" value="' + (item.cost||'') + '" onchange="updatePriceItem(' + i + ',\'cost\',this.value)" step="0.01"></td>' +
        '<td><input type="number" value="' + (item.sell||'') + '" onchange="updatePriceItem(' + i + ',\'sell\',this.value)" step="0.01"></td>' +
        '<td><button class="btn btn-delete" onclick="deletePriceItem(' + i + ')">✕</button></td></tr>'
    ).join('');
}
function updatePriceItem(index, field, value) {
    if (field === 'name') priceList[index].name = value;
    else priceList[index][field] = value ? parseFloat(value) : '';
    savePriceList2Storage();
}
function addPriceItem() {
    const name = document.getElementById('newPriceName').value.trim();
    if (!name) return;
    priceList.push({ id: Date.now(), name, cost: parseFloat(document.getElementById('newPriceCost').value) || '', sell: parseFloat(document.getElementById('newPriceSell').value) || '' });
    savePriceList2Storage();
    document.getElementById('newPriceName').value = '';
    document.getElementById('newPriceCost').value = '';
    document.getElementById('newPriceSell').value = '';
    renderPriceList();
}
function deletePriceItem(index) {
    if (!confirm('Удалить позицию?')) return;
    priceList.splice(index, 1);
    savePriceList2Storage();
    renderPriceList();
}

// ===== ПОСТАВЩИКИ =====
function openSuppliersModal() { renderSuppliersList(); document.getElementById('suppliersModal').classList.add('active'); }
function closeSuppliersModal() { document.getElementById('suppliersModal').classList.remove('active'); }
function renderSuppliersList() {
    const container = document.getElementById('suppliersContent');
    if (suppliers.length === 0) { container.innerHTML = '<p style="color:#9ca3af;font-style:italic;">Нет сохранённых поставщиков</p>'; return; }
    container.innerHTML = '<table><thead><tr><th>Название</th><th></th></tr></thead><tbody>' +
        suppliers.map((s, i) => '<tr><td>' + s + '</td><td><button class="btn btn-delete" onclick="deleteSupplier(' + i + ')">✕</button></td></tr>').join('') + '</tbody></table>';
}
function addSupplierManual() {
    const input = document.getElementById('newSupplierName');
    const name = input.value.trim();
    if (!name) return;
    if (!suppliers.includes(name)) { suppliers.push(name); suppliers.sort(); saveSuppliers2Storage(); }
    input.value = '';
    renderSuppliersList();
}
function deleteSupplier(index) {
    if (!confirm('Удалить поставщика?')) return;
    suppliers.splice(index, 1);
    saveSuppliers2Storage();
    renderSuppliersList();
}
function addNewSupplier(name) {
    name = name.trim();
    if (!name || suppliers.find(s => s.toLowerCase() === name.toLowerCase())) return;
    suppliers.push(name);
    suppliers.sort();
    saveSuppliers2Storage();
}

// ===== ПОСТАВЩИК КОМБОБОКС =====
function createSupplierField(roomId, idx) {
    return '<div class="field-group field-supplier"><label>Поставщик</label><div class="supplier-wrapper"><input type="text" class="supplier-input" placeholder="Поставщик" onfocus="showSupDrop(this)" oninput="filterSupDrop(this)" onblur="setTimeout(()=>hideSupDrop(this),200)"><div class="supplier-dropdown"></div></div></div>';
}
function showSupDrop(input) { const dd=input.nextElementSibling; renderSupOptions(dd,input.value); dd.classList.add('active'); }
function hideSupDrop(input) { input.nextElementSibling.classList.remove('active'); const val=input.value.trim(); if(val&&!suppliers.find(s=>s.toLowerCase()===val.toLowerCase())) addNewSupplier(val); }
function filterSupDrop(input) { renderSupOptions(input.nextElementSibling,input.value); }
function renderSupOptions(dd, filter) {
    const f=(filter||'').toLowerCase();
    const filtered=suppliers.filter(s=>s.toLowerCase().includes(f));
    dd.innerHTML=filtered.map(s=>'<div class="supplier-option" onmousedown="pickSup(this,\''+s.replace(/'/g,"\\'")+'\')">' + s + '</div>').join('');
    if(!filtered.length&&filter) dd.innerHTML='<div class="supplier-option" style="color:#9ca3af;font-style:italic">Новый — сохранится</div>';
}
function pickSup(el, name) { const w=el.closest('.supplier-wrapper'); w.querySelector('.supplier-input').value=name; w.querySelector('.supplier-dropdown').classList.remove('active'); }

// ===== КОМНАТЫ =====
function addRoom(dupData) {
    roomCounter++;
    const rid = roomCounter;
    const container = document.getElementById('roomsContainer');
    const div = document.createElement('div');
    div.className = 'room';
    div.id = 'room-' + rid;
    div.dataset.roomId = rid;
    div.innerHTML =
        '<div class="room-header"><div class="room-header-left"><h2>Комната ' + rid + '</h2><input type="text" class="room-name-input" placeholder="Название (Гостиная, Спальня...)" value="' + (dupData?.name||'') + '"></div><div style="display:flex;gap:8px;"><button class="btn btn-duplicate" onclick="duplicateRoom(' + rid + ')">📋 Дублировать</button><button class="btn btn-delete-room" onclick="deleteRoom(' + rid + ')">✕ Удалить</button></div></div>' +
        '<div class="room-body">' +
        '<div class="block"><div class="block-header"><span class="block-title">🧵 Ткань</span><button class="btn btn-add" onclick="addFabricRow(' + rid + ')">+ Добавить</button></div><div id="fabric-rows-' + rid + '"></div></div>' +
        '<div class="tesma-block" id="tesma-block-' + rid + '" style="display:none"><h4>🧵 Тесьма (автоматически)</h4><div id="tesma-rows-' + rid + '"></div></div>' +
        '<div class="block"><div class="block-header"><span class="block-title">✂️ Пошив</span><button class="btn btn-add" onclick="addSewingRow(' + rid + ')">+ Добавить</button></div><div id="sewing-rows-' + rid + '"></div></div>' +
        '<div class="add-item-buttons"><button class="btn-add-optional" onclick="addCorniceBlock(' + rid + ')" id="btn-cornice-' + rid + '">+ Карниз</button><button class="btn-add-optional" onclick="addFurnitureBlock(' + rid + ')" id="btn-furniture-' + rid + '">+ Фурнитура</button><button class="btn-add-optional" onclick="addServicesBlock(' + rid + ')" id="btn-services-' + rid + '">+ Услуги</button><button class="btn-add-optional" onclick="addExtraItemRow(' + rid + ')">+ Непредвиденные</button></div>' +
        '<div id="cornice-block-' + rid + '"></div><div id="furniture-block-' + rid + '"></div><div id="vyveshivanie-block-' + rid + '"></div><div id="services-block-' + rid + '"></div>' +
        '<div class="block" id="extra-block-' + rid + '" style="display:none"><div class="block-header"><span class="block-title">📦 Непредвиденные товары</span><button class="btn btn-add" onclick="addExtraItemRow(' + rid + ')">+ Добавить</button></div><div id="extra-rows-' + rid + '"></div></div>' +
        '</div>' +
        '<div class="subtotal-row"><span class="subtotal-label">ПОДИТОГ:</span><span class="subtotal-value" id="subtotal-' + rid + '">0 ₽</span></div>';
    container.appendChild(div);
    recalcRoom(rid);
}
function deleteRoom(rid) { if(!confirm('Удалить комнату?'))return; document.getElementById('room-'+rid).remove(); recalcGrandTotal(); }
function duplicateRoom(rid) {
    const room=document.getElementById('room-'+rid);
    const name=room.querySelector('.room-name-input').value;
    addRoom({name});
    const newRid=roomCounter;
    const src=room.querySelector('.room-body');
    const tgt=document.getElementById('room-'+newRid).querySelector('.room-body');
    let html=src.innerHTML;
    html=html.replace(new RegExp('-'+rid+'-','g'),'-'+newRid+'-').replace(new RegExp('-'+rid+'"','g'),'-'+newRid+'"').replace(new RegExp('\\('+rid+'\\)','g'),'('+newRid+')').replace(new RegExp('\\('+rid+',','g'),'('+newRid+',');
    tgt.innerHTML=html;
    const srcI=src.querySelectorAll('input,select'), tgtI=tgt.querySelectorAll('input,select');
    srcI.forEach((inp,i)=>{if(tgtI[i])tgtI[i].value=inp.value;});
    fabricCounters[newRid]=fabricCounters[rid]||0;
    sewingCounters[newRid]=sewingCounters[rid]||0;
    extraCounters[newRid]=extraCounters[rid]||0;
    recalcRoom(newRid);
}

// ===== ТКАНЬ =====
function addFabricRow(rid) {
    if(!fabricCounters[rid])fabricCounters[rid]=0;
    fabricCounters[rid]++;
    const idx=fabricCounters[rid];
    const container=document.getElementById('fabric-rows-'+rid);
    const row=document.createElement('div');
    row.className='item-row'; row.id='fr-'+rid+'-'+idx;
    row.innerHTML=
        '<div class="field-group field-type"><label>Вид изделия</label><select onchange="onFabricChange('+rid+')" id="ft-'+rid+'-'+idx+'"><option value="">-- Выбрать --</option><option value="portera">Портьеры</option><option value="portera_wave">Портьера волна</option><option value="portera_bant">Портьера бантовка</option><option value="tul">Тюль</option><option value="tul_bant">Тюль бантовка</option><option value="rimskaya">Римская штора</option><option value="pokryvalo">Покрывало</option></select></div>' +
        createSupplierField(rid,idx) +
        '<div class="field-group field-article"><label>Артикул</label><input type="text" placeholder="Артикул" class="fabric-article"></div>' +
        '<div class="field-group field-qty"><label>Кол-во (м.п.)</label><input type="number" placeholder="0" oninput="calcFabric('+rid+')" id="fq-'+rid+'-'+idx+'" step="0.01"></div>' +
        '<div class="field-group field-price"><label>Цена за м.п.</label><input type="number" placeholder="0" oninput="calcFabric('+rid+')" id="fp-'+rid+'-'+idx+'" step="0.01"></div>' +
        '<div class="field-group field-total"><label>Итого</label><div class="item-total" id="ftt-'+rid+'-'+idx+'">0 ₽</div></div>' +
        '<button class="btn btn-delete" onclick="remFabric('+rid+','+idx+')">✕</button>';
    container.appendChild(row);
}
function remFabric(rid,idx){document.getElementById('fr-'+rid+'-'+idx)?.remove();calcFabric(rid);}
function onFabricChange(rid){calcFabric(rid);}
function calcFabric(rid) {
    document.querySelectorAll('#fabric-rows-'+rid+' .item-row').forEach(row=>{
        const q=parseFloat(row.querySelector('[id^="fq-"]')?.value)||0;
        const p=parseFloat(row.querySelector('[id^="fp-"]')?.value)||0;
        const tE=row.querySelector('[id^="ftt-"]');
        if(tE)tE.textContent=fmt(Math.round(q*p));
    });
    recalcTesma(rid); recalcVyv(rid); recalcRoom(rid);
}

// ===== ТЕСЬМА =====
function recalcTesma(rid) {
    const container=document.getElementById('tesma-rows-'+rid);
    const pt=settings.price_tesma||350;
    container.innerHTML=''; let has=false;
    document.querySelectorAll('#fabric-rows-'+rid+' .item-row').forEach(row=>{
        const type=row.querySelector('select')?.value||'';
        const qty=parseFloat(row.querySelector('[id^="fq-"]')?.value)||0;
        if(['portera','portera_wave','portera_bant','tul','tul_bant'].includes(type)&&qty>0){
            has=true;
            const len=qty+0.2, total=Math.round(len*pt);
            const lbl=type.startsWith('portera')?'Тесьма для портьеры':'Тесьма для тюля';
            container.innerHTML+='<div class="tesma-row"><span>'+lbl+'</span><span class="tesma-calc">'+len.toFixed(2)+' м × '+fmt(pt)+'</span><span class="tesma-sum">'+fmt(total)+'</span></div>';
        }
    });
    document.getElementById('tesma-block-'+rid).style.display=has?'block':'none';
}
function getTesmaTotal(rid) {
    const p=settings.price_tesma||350; let t=0;
    document.querySelectorAll('#fabric-rows-'+rid+' .item-row').forEach(row=>{
        const type=row.querySelector('select')?.value||'';
        const qty=parseFloat(row.querySelector('[id^="fq-"]')?.value)||0;
        if(['portera','portera_wave','portera_bant','tul','tul_bant'].includes(type)&&qty>0) t+=Math.round((qty+0.2)*p);
    });
    return t;
}

// ===== ПОШИВ =====
function addSewingRow(rid) {
    if(!sewingCounters[rid])sewingCounters[rid]=0;
    sewingCounters[rid]++;
    const idx=sewingCounters[rid];
    const container=document.getElementById('sewing-rows-'+rid);
    const row=document.createElement('div');
    row.className='item-row'; row.id='sr-'+rid+'-'+idx;
    row.style.flexDirection='column'; row.style.alignItems='stretch';
    row.innerHTML=
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;"><div class="field-group field-type"><label>Вид</label><select onchange="onSewType('+rid+','+idx+')" id="st-'+rid+'-'+idx+'"><option value="">-- Выбрать --</option><option value="portera">Портьера</option><option value="portera_wave">Портьера волна</option><option value="portera_bant">Портьера бантовка</option><option value="tul">Тюль</option><option value="tul_bant">Тюль бантовка</option><option value="rimskaya">Римская штора</option><option value="pokryvalo">Покрывало</option></select></div><div id="sf-'+rid+'-'+idx+'" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:1;"></div><div class="field-group field-total"><label>Итого</label><div class="item-total" id="stt-'+rid+'-'+idx+'">0 ₽</div></div><button class="btn btn-delete" onclick="remSewing('+rid+','+idx+')">✕</button></div><div id="se-'+rid+'-'+idx+'"></div>';
    container.appendChild(row);
}
function remSewing(rid,idx){document.getElementById('sr-'+rid+'-'+idx)?.remove();recalcRoom(rid);}

function onSewType(rid, idx) {
    const type=document.getElementById('st-'+rid+'-'+idx).value;
    const fc=document.getElementById('sf-'+rid+'-'+idx);
    const ec=document.getElementById('se-'+rid+'-'+idx);
    const oi='calcSew('+rid+','+idx+')';
    const defD=settings.price_strochka||200;
    let h='', eh='';
    if(['portera','portera_wave','portera_bant','tul','tul_bant'].includes(type)){
        h='<div class="field-group field-small"><label>Ширина(A)</label><input type="number" id="sa-'+rid+'-'+idx+'" oninput="'+oi+'" step="0.01"></div><div class="field-group field-small"><label>Высота(B)</label><input type="number" id="sb-'+rid+'-'+idx+'" oninput="'+oi+'" step="0.01"></div>';
        if(type==='portera_bant'||type==='tul_bant') h+='<div class="field-group field-small"><label>Шир.изд.(W)</label><input type="number" id="sw-'+rid+'-'+idx+'" oninput="'+oi+'" step="0.01"></div>';
        h+='<div class="field-group field-small"><label>Строчка(D)</label><input type="number" id="sd-'+rid+'-'+idx+'" oninput="'+oi+'" step="0.01" value="'+defD+'"></div><div class="field-group field-small"><label>Кол-во(K)</label><input type="number" id="sk-'+rid+'-'+idx+'" oninput="'+oi+'" value="1" step="1"></div><div class="field-group field-small"><label>Сложн.%</label><input type="number" id="sp-'+rid+'-'+idx+'" oninput="'+oi+'" value="0" step="1"></div>';
    } else if(type==='rimskaya'){
        h='<div class="field-group field-small"><label>Площадь(м²)</label><input type="number" id="sarea-'+rid+'-'+idx+'" oninput="'+oi+'" step="0.01"></div><div class="field-group field-price"><label>Цена за м²</label><input type="number" id="sprice-'+rid+'-'+idx+'" oninput="'+oi+'" step="0.01"></div>';
        eh='<div class="extra-fields"><div class="extra-field-row"><label>Тесьма:</label><input type="number" id="srt-q-'+rid+'-'+idx+'" placeholder="кол-во" oninput="'+oi+'" step="0.01"><span>×</span><input type="number" id="srt-p-'+rid+'-'+idx+'" placeholder="цена" oninput="'+oi+'" step="0.01"><span class="extra-field-total" id="srt-t-'+rid+'-'+idx+'">0 ₽</span></div><div class="extra-field-row"><label>Вывешивание:</label><input type="number" id="srv-q-'+rid+'-'+idx+'" placeholder="кол-во" oninput="'+oi+'" step="0.01"><span>×</span><input type="number" id="srv-p-'+rid+'-'+idx+'" placeholder="цена" oninput="'+oi+'" step="0.01"><span class="extra-field-total" id="srv-t-'+rid+'-'+idx+'">0 ₽</span></div><div class="extra-field-row"><label>Колечки:</label><input type="number" id="srr-q-'+rid+'-'+idx+'" placeholder="кол-во" oninput="'+oi+'" step="1"><span>×</span><input type="number" id="srr-p-'+rid+'-'+idx+'" placeholder="цена" oninput="'+oi+'" step="0.01"><span class="extra-field-total" id="srr-t-'+rid+'-'+idx+'">0 ₽</span></div></div>';
    } else if(type==='pokryvalo'){
        h='<div class="field-group field-small"><label>Площадь(м²)</label><input type="number" id="sarea-'+rid+'-'+idx+'" oninput="'+oi+'" step="0.01"></div><div class="field-group field-price"><label>Цена за м²</label><input type="number" id="sprice-'+rid+'-'+idx+'" oninput="'+oi+'" step="0.01"></div>';
        eh='<div class="extra-fields"><div class="extra-field-row"><label>Стёжка:</label><input type="number" id="sps-q-'+rid+'-'+idx+'" placeholder="п.м." oninput="'+oi+'" step="0.01"><span>×</span><input type="number" id="sps-p-'+rid+'-'+idx+'" placeholder="цена" oninput="'+oi+'" step="0.01"><span class="extra-field-total" id="sps-t-'+rid+'-'+idx+'">0 ₽</span></div><div class="extra-field-row"><label>Подклада:</label><input type="number" id="spd-q-'+rid+'-'+idx+'" placeholder="п.м." oninput="'+oi+'" step="0.01"><span>×</span><input type="number" id="spd-p-'+rid+'-'+idx+'" placeholder="цена" oninput="'+oi+'" step="0.01"><span class="extra-field-total" id="spd-t-'+rid+'-'+idx+'">0 ₽</span></div><div class="extra-field-row"><label>Кант:</label><input type="number" id="spk-q-'+rid+'-'+idx+'" placeholder="п.м." oninput="'+oi+'" step="0.01"><span>×</span><input type="number" id="spk-p-'+rid+'-'+idx+'" placeholder="цена" oninput="'+oi+'" step="0.01"><span class="extra-field-total" id="spk-t-'+rid+'-'+idx+'">0 ₽</span></div></div>';
    }
    fc.innerHTML=h; ec.innerHTML=eh;
    calcSew(rid,idx);
}

function calcSew(rid, idx) {
    const type=document.getElementById('st-'+rid+'-'+idx)?.value||'';
    const gv=id=>parseFloat(document.getElementById(id)?.value)||0;
    let total=0;
    switch(type){
        case 'portera':{ const A=gv('sa-'+rid+'-'+idx),B=gv('sb-'+rid+'-'+idx),D=gv('sd-'+rid+'-'+idx),K=gv('sk-'+rid+'-'+idx)||1,P=gv('sp-'+rid+'-'+idx); total=Math.round(((A*3)+(B*2))*D*(1+P/100)*K); break; }
        case 'portera_wave':{ const A=gv('sa-'+rid+'-'+idx),B=gv('sb-'+rid+'-'+idx),D=gv('sd-'+rid+'-'+idx),K=gv('sk-'+rid+'-'+idx)||1,P=gv('sp-'+rid+'-'+idx),wp=settings.price_wave_markup||150; total=Math.round((((A*3)+(B*2))*D+(A*wp))*(1+P/100)*K); break; }
        case 'portera_bant':{ const A=gv('sa-'+rid+'-'+idx),B=gv('sb-'+rid+'-'+idx),W=gv('sw-'+rid+'-'+idx),D=gv('sd-'+rid+'-'+idx),K=gv('sk-'+rid+'-'+idx)||1,P=gv('sp-'+rid+'-'+idx),bp=settings.price_bantovka||1200; total=Math.round((((A*3)+(B*2))*D+(W*bp))*(1+P/100)*K); break; }
        case 'tul':{ const A=gv('sa-'+rid+'-'+idx),B=gv('sb-'+rid+'-'+idx),D=gv('sd-'+rid+'-'+idx),K=gv('sk-'+rid+'-'+idx)||1,P=gv('sp-'+rid+'-'+idx); total=Math.round(((A*2)+(B*2))*D*(1+P/100)*K); break; }
        case 'tul_bant':{ const A=gv('sa-'+rid+'-'+idx),B=gv('sb-'+rid+'-'+idx),W=gv('sw-'+rid+'-'+idx),D=gv('sd-'+rid+'-'+idx),K=gv('sk-'+rid+'-'+idx)||1,P=gv('sp-'+rid+'-'+idx); total=Math.round(((A*2)+(B*2)+(W*3))*D*(1+P/100)*K); break; }
        case 'rimskaya':{ total=Math.round(gv('sarea-'+rid+'-'+idx)*gv('sprice-'+rid+'-'+idx)); ['rt','rv','rr'].forEach(x=>{const q=gv('s'+x+'-q-'+rid+'-'+idx),p=gv('s'+x+'-p-'+rid+'-'+idx),t=Math.round(q*p);const el=document.getElementById('s'+x+'-t-'+rid+'-'+idx);if(el)el.textContent=fmt(t);total+=t;}); break; }
        case 'pokryvalo':{ total=Math.round(gv('sarea-'+rid+'-'+idx)*gv('sprice-'+rid+'-'+idx)); ['ps','pd','pk'].forEach(x=>{const q=gv('s'+x+'-q-'+rid+'-'+idx),p=gv('s'+x+'-p-'+rid+'-'+idx),t=Math.round(q*p);const el=document.getElementById('s'+x+'-t-'+rid+'-'+idx);if(el)el.textContent=fmt(t);total+=t;}); break; }
    }
    const el=document.getElementById('stt-'+rid+'-'+idx);
    if(el)el.textContent=fmt(total);
    recalcRoom(rid);
}

// ===== ВЫВЕШИВАНИЕ =====
function recalcVyv(rid) {
    const c=document.getElementById('vyveshivanie-block-'+rid);
    if(c.dataset.removed)return;
    const pv=getVyvPrice(); let meters=0;
    document.querySelectorAll('#fabric-rows-'+rid+' .item-row').forEach(row=>{
        const type=row.querySelector('select')?.value||'';
        const qty=parseFloat(row.querySelector('[id^="fq-"]')?.value)||0;
        if(['portera','portera_wave','portera_bant','tul','tul_bant'].includes(type))meters+=qty;
    });
    if(meters>0){
        const total=Math.round(meters*pv);
        c.innerHTML='<div class="vyveshivanie-block"><h4>📐 Вывешивание</h4><div class="vyveshivanie-info"><span>Метраж: <strong>'+meters.toFixed(2)+' м</strong></span><span>× <strong>'+fmt(pv)+'</strong></span><span class="vyveshivanie-total">ИТОГО: '+fmt(total)+'</span><button class="btn btn-delete" onclick="remVyv('+rid+')">✕ Удалить</button></div></div>';
    } else { c.innerHTML=''; }
    recalcRoom(rid);
}
function remVyv(rid){const c=document.getElementById('vyveshivanie-block-'+rid);c.innerHTML='';c.dataset.removed='true';recalcRoom(rid);}
function getVyvPrice(){const item=priceList.find(p=>p.name==='Вывешивание');return item?parseFloat(item.sell)||400:400;}
function getVyvTotal(rid){
    const c=document.getElementById('vyveshivanie-block-'+rid);
    if(c.dataset.removed||!c.innerHTML.trim())return 0;
    const pv=getVyvPrice(); let m=0;
    document.querySelectorAll('#fabric-rows-'+rid+' .item-row').forEach(row=>{
        const type=row.querySelector('select')?.value||'';
        const qty=parseFloat(row.querySelector('[id^="fq-"]')?.value)||0;
        if(['portera','portera_wave','portera_bant','tul','tul_bant'].includes(type))m+=qty;
    });
    return Math.round(m*pv);
}

// ===== КАРНИЗ =====
function addCorniceBlock(rid) {
    const c=document.getElementById('cornice-block-'+rid);
    const b=document.getElementById('btn-cornice-'+rid);
    if(b)b.style.display='none';
    c.innerHTML='<div class="block"><div class="block-header"><span class="block-title">🔧 Карниз + Кронштейны</span><button class="btn btn-delete" onclick="remCornice('+rid+')">✕</button></div><div class="item-row"><div class="field-group field-type"><label>Тип</label><select id="ct-'+rid+'" onchange="onCorniceType('+rid+')"><option value="">-- Выбрать --</option><option value="sm">СМ (пластиковый)</option><option value="profile">Профильный</option><option value="rimsky">Римский</option></select></div><div class="field-group field-small"><label>Длина(м)</label><input type="number" id="cl-'+rid+'" oninput="calcCornice('+rid+')" step="0.01"></div><div class="field-group field-price"><label>Цена за м</label><input type="number" id="cp-'+rid+'" oninput="calcCornice('+rid+')" step="0.01"></div><div class="field-group field-total"><label>Итого</label><div class="item-total" id="ctt-'+rid+'">0 ₽</div></div></div><div class="item-row"><div class="field-group field-type"><label>Кронштейн</label><select id="bs-'+rid+'"><option value="10">10 см</option><option value="15">15 см</option><option value="20">20 см</option><option value="25">25 см</option></select></div><div class="field-group field-small"><label>Кол-во</label><input type="number" id="bq-'+rid+'" oninput="calcCornice('+rid+')" step="1"></div><div class="field-group field-price"><label>Цена/шт</label><input type="number" id="bp-'+rid+'" oninput="calcCornice('+rid+')" step="0.01"></div><div class="field-group field-total"><label>Итого</label><div class="item-total" id="btt-'+rid+'">0 ₽</div></div></div><div style="text-align:right;padding:5px 10px;"><strong>Всего: <span id="cgt-'+rid+'">0 ₽</span></strong></div></div>';
}
function remCornice(rid){document.getElementById('cornice-block-'+rid).innerHTML='';const b=document.getElementById('btn-cornice-'+rid);if(b)b.style.display='';recalcRoom(rid);}
function getCorniceDefPrices(){const m={};priceList.forEach(p=>{if(p.name==='Карниз СМ')m.sm=p.sell;if(p.name==='Карниз профильный')m.profile=p.sell;if(p.name==='Карниз римский')m.rimsky=p.sell;});return{sm:m.sm||550,profile:m.profile||1000,rimsky:m.rimsky||5000};}
function onCorniceType(rid){const type=document.getElementById('ct-'+rid).value;const prices=getCorniceDefPrices();if(prices[type])document.getElementById('cp-'+rid).value=prices[type];calcCornice(rid);}
function calcCornice(rid){const l=parseFloat(document.getElementById('cl-'+rid)?.value)||0,p=parseFloat(document.getElementById('cp-'+rid)?.value)||0,bq=parseFloat(document.getElementById('bq-'+rid)?.value)||0,bp=parseFloat(document.getElementById('bp-'+rid)?.value)||0;const ct=Math.round(l*p),bt=Math.round(bq*bp);setT('ctt-'+rid,ct);setT('btt-'+rid,bt);setT('cgt-'+rid,ct+bt);recalcRoom(rid);}
function getCorniceTotal(rid){const l=parseFloat(document.getElementById('cl-'+rid)?.value)||0,p=parseFloat(document.getElementById('cp-'+rid)?.value)||0,bq=parseFloat(document.getElementById('bq-'+rid)?.value)||0,bp=parseFloat(document.getElementById('bp-'+rid)?.value)||0;return Math.round(l*p)+Math.round(bq*bp);}

// ===== ФУРНИТУРА =====
function addFurnitureBlock(rid) {
    const c=document.getElementById('furniture-block-'+rid);
    const b=document.getElementById('btn-furniture-'+rid);
    if(b)b.style.display='none';
    let h='<div class="block"><div class="block-header"><span class="block-title">🔩 Фурнитура</span><button class="btn btn-delete" onclick="remFurniture('+rid+')">✕</button></div>';
    FUR_ITEMS.forEach(fi=>{h+='<div class="item-row"><div class="field-group field-wide"><label>'+fi.label+'</label></div><div class="field-group field-small"><label>Кол-во('+fi.u+')</label><input type="number" id="fu-'+fi.id+'-q-'+rid+'" oninput="calcFur('+rid+')" step="0.01"></div><div class="field-group field-price"><label>Цена</label><input type="number" id="fu-'+fi.id+'-p-'+rid+'" oninput="calcFur('+rid+')" step="0.01"></div><div class="field-group field-total"><label>Итого</label><div class="item-total" id="fu-'+fi.id+'-t-'+rid+'">0 ₽</div></div></div>';});
    h+='<div style="text-align:right;padding:5px 10px;"><strong>Всего: <span id="fgt-'+rid+'">0 ₽</span></strong></div></div>';
    c.innerHTML=h;
}
function remFurniture(rid){document.getElementById('furniture-block-'+rid).innerHTML='';const b=document.getElementById('btn-furniture-'+rid);if(b)b.style.display='';recalcRoom(rid);}
function calcFur(rid){let g=0;FUR_ITEMS.forEach(fi=>{const q=parseFloat(document.getElementById('fu-'+fi.id+'-q-'+rid)?.value)||0,p=parseFloat(document.getElementById('fu-'+fi.id+'-p-'+rid)?.value)||0,t=Math.round(q*p);setT('fu-'+fi.id+'-t-'+rid,t);g+=t;});setT('fgt-'+rid,g);recalcRoom(rid);}
function getFurTotal(rid){let t=0;FUR_ITEMS.forEach(fi=>{const q=parseFloat(document.getElementById('fu-'+fi.id+'-q-'+rid)?.value)||0,p=parseFloat(document.getElementById('fu-'+fi.id+'-p-'+rid)?.value)||0;t+=Math.round(q*p);});return t;}

// ===== УСЛУГИ =====
function addServicesBlock(rid) {
    const c=document.getElementById('services-block-'+rid);
    const b=document.getElementById('btn-services-'+rid);
    if(b)b.style.display='none';
    c.innerHTML='<div class="block"><div class="block-header"><span class="block-title">🚛 Услуги</span><button class="btn btn-delete" onclick="remServices('+rid+')">✕</button></div><div class="item-row"><div class="field-group field-wide"><label>Установка карниза</label></div><div class="field-group field-small"><label>Метры</label><input type="number" id="sim-'+rid+'" oninput="calcServices('+rid+')" step="0.01"></div><div class="field-group field-price"><label>Цена/м</label><input type="number" id="sip-'+rid+'" oninput="calcServices('+rid+')" step="0.01"></div><div class="field-group field-total"><label>Итого</label><div class="item-total" id="sit-'+rid+'">0 ₽</div></div></div><div class="item-row"><div class="field-group field-wide"><label>Доставка</label></div><div class="field-group field-price"><label>Сумма</label><input type="number" id="sdl-'+rid+'" oninput="calcServices('+rid+')" step="0.01"></div></div><div class="item-row"><div class="field-group field-wide"><label>Выезд дизайнера</label></div><div class="field-group field-price"><label>Сумма</label><input type="number" id="sds-'+rid+'" oninput="calcServices('+rid+')" step="0.01"></div></div><div style="text-align:right;padding:5px 10px;"><strong>Всего: <span id="sgt-'+rid+'">0 ₽</span></strong></div></div>';
}
function remServices(rid){document.getElementById('services-block-'+rid).innerHTML='';const b=document.getElementById('btn-services-'+rid);if(b)b.style.display='';recalcRoom(rid);}
function calcServices(rid){
    const im=parseFloat(document.getElementById('sim-'+rid)?.value)||0;
    const ip=parseFloat(document.getElementById('sip-'+rid)?.value)||0;
    const it=Math.round(im*ip);
    setT('sit-'+rid,it);
    const dl=Math.round(parseFloat(document.getElementById('sdl-'+rid)?.value)||0);
    const ds=Math.round(parseFloat(document.getElementById('sds-'+rid)?.value)||0);
    setT('sgt-'+rid,it+dl+ds);
    recalcRoom(rid);
}

// ===== НЕПРЕДВИДЕННЫЕ =====
function addExtraItemRow(rid) {
    document.getElementById('extra-block-'+rid).style.display='block';
    if(!extraCounters[rid])extraCounters[rid]=0;
    extraCounters[rid]++;
    const idx=extraCounters[rid];
    const container=document.getElementById('extra-rows-'+rid);
    const row=document.createElement('div');
    row.className='item-row'; row.id='er-'+rid+'-'+idx;
    row.innerHTML='<div class="field-group field-wide"><label>Наименование</label><input type="text" class="extra-name" placeholder="Название"></div><div class="field-group field-article"><label>Артикул</label><input type="text" class="extra-art" placeholder="Артикул"></div><div class="field-group field-small"><label>Кол-во</label><input type="number" id="eq-'+rid+'-'+idx+'" oninput="calcExtra('+rid+')" step="0.01"></div><div class="field-group field-price"><label>Цена</label><input type="number" id="ep-'+rid+'-'+idx+'" oninput="calcExtra('+rid+')" step="0.01"></div><div class="field-group field-total"><label>Итого</label><div class="item-total" id="ett-'+rid+'-'+idx+'">0 ₽</div></div><button class="btn btn-delete" onclick="remExtra('+rid+','+idx+')">✕</button>';
    container.appendChild(row);
}
function remExtra(rid,idx){document.getElementById('er-'+rid+'-'+idx)?.remove();calcExtra(rid);}
function calcExtra(rid){
    document.querySelectorAll('#extra-rows-'+rid+' .item-row').forEach(row=>{
        const q=parseFloat(row.querySelector('[id^="eq-"]')?.value)||0;
        const p=parseFloat(row.querySelector('[id^="ep-"]')?.value)||0;
        const tE=row.querySelector('[id^="ett-"]');
        if(tE)tE.textContent=fmt(Math.round(q*p));
    });
    recalcRoom(rid);
}

// ===== ИТОГИ =====
function recalcRoom(rid) {
    let total=0;
    document.querySelectorAll('#fabric-rows-'+rid+' .item-row').forEach(row=>{total+=prs(row.querySelector('[id^="ftt-"]')?.textContent||'0');});
    total+=getTesmaTotal(rid);
    document.querySelectorAll('#sewing-rows-'+rid+' [id^="sr-"]').forEach(row=>{total+=prs(row.querySelector('[id^="stt-"]')?.textContent||'0');});
    total+=getCorniceTotal(rid);
    total+=getFurTotal(rid);
    total+=getVyvTotal(rid);
    total+=prs(document.getElementById('sit-'+rid)?.textContent||'0');
    total+=Math.round(parseFloat(document.getElementById('sdl-'+rid)?.value)||0);
    total+=Math.round(parseFloat(document.getElementById('sds-'+rid)?.value)||0);
    document.querySelectorAll('#extra-rows-'+rid+' .item-row').forEach(row=>{total+=prs(row.querySelector('[id^="ett-"]')?.textContent||'0');});
    setT('subtotal-'+rid,total);
    recalcGrandTotal();
}
function recalcGrandTotal(){
    let gt=0;
    document.querySelectorAll('.room').forEach(room=>{gt+=prs(document.getElementById('subtotal-'+room.dataset.roomId)?.textContent||'0');});
    document.getElementById('grandTotal').textContent=fmt(gt);
}
function recalcAll(){document.querySelectorAll('.room').forEach(room=>{calcFabric(parseInt(room.dataset.roomId));});}
function newOrder(){
    if(!confirm('Очистить все данные заказа?'))return;
    document.getElementById('clientName').value='';
    document.getElementById('clientPhone').value='';
    document.getElementById('clientAddress').value='';
    document.getElementById('roomsContainer').innerHTML='';
    roomCounter=0;fabricCounters={};sewingCounters={};extraCounters={};
    addRoom();
}

// ===== PDF =====
function generatePDF() {
    const clientName = document.getElementById('clientName')?.value || '—';
    const clientPhone = document.getElementById('clientPhone')?.value || '—';
    const clientAddress = document.getElementById('clientAddress')?.value || '—';
    const today = new Date().toISOString().slice(0, 10);

    let h = '';
    h += '<div style="text-align:center;border-bottom:2px solid #6b4c9a;padding-bottom:10px;margin-bottom:15px;">';
    h += '<div style="font-size:22px;font-weight:bold;color:#6b4c9a;">DECOR BONJOUR</div>';
    h += '<div style="font-size:11px;color:#555;">+7 918 555 80 94 | +7 918 555 80 96 | пр. Сиверса 23</div></div>';

    h += '<div style="margin-bottom:15px;padding:8px;background:#f5f3ff;border-radius:6px;">';
    h += '<div style="font-size:11px;color:#555;">Дата: ' + today + '</div>';
    h += '<div><strong>Клиент:</strong> ' + escHTML(clientName) + '</div>';
    h += '<div><strong>Телефон:</strong> ' + escHTML(clientPhone) + '</div>';
    h += '<div><strong>Адрес:</strong> ' + escHTML(clientAddress) + '</div></div>';

    let grandTotal = 0;

    document.querySelectorAll('.room').forEach(function(room) {
        var rid = room.dataset.roomId;
        var roomName = room.querySelector('.room-name-input')?.value || 'Комната ' + rid;
        var subtotal = prs(document.getElementById('subtotal-' + rid)?.textContent || '0');
        grandTotal += subtotal;

        h += '<div style="margin-top:20px;border:1px solid #ddd;border-radius:8px;overflow:hidden;">';
        h += '<div style="background:#6b4c9a;color:#fff;padding:8px 12px;font-weight:bold;font-size:15px;">' + escHTML(roomName) + '</div>';
        h += '<div style="padding:10px;">';

        // Ткани
        room.querySelectorAll('[id^="fabric-rows-"] .item-row').forEach(function(row) {
            var tp = row.querySelector('select')?.selectedOptions[0]?.text || '';
            var sup = row.querySelector('.supplier-input')?.value || '';
            var art = row.querySelector('.fabric-article')?.value || '';
            var qty = row.querySelector('[id^="fq-"]')?.value || '';
            var price = row.querySelector('[id^="fp-"]')?.value || '';
            var total = row.querySelector('[id^="ftt-"]')?.textContent || '';
            if (tp && tp !== '-- Выбрать --') {
                h += '<div style="padding:2px 0;"><strong>' + escHTML(tp) + '</strong>';
                if (sup) h += ' | ' + escHTML(sup);
                if (art) h += ' | Арт: ' + escHTML(art);
                h += '</div><div style="padding:0 0 4px 10px;color:#555;">' + qty + ' п.м. × ' + price + ' ₽ = <strong>' + total + '</strong></div>';
            }
        });

        // Тесьма
        room.querySelectorAll('[id^="tesma-rows-"] .tesma-row').forEach(function(tr) {
            var nm = tr.querySelector('span')?.textContent || '';
            var calc = tr.querySelector('.tesma-calc')?.textContent || '';
            var sum = tr.querySelector('.tesma-sum')?.textContent || '';
            h += '<div style="padding:2px 0;color:#555;">' + escHTML(nm) + ': ' + escHTML(calc) + ' = <strong>' + sum + '</strong></div>';
        });

        // Пошив
        room.querySelectorAll('[id^="sewing-rows-"] [id^="sr-"]').forEach(function(row) {
            var tp = row.querySelector('select')?.selectedOptions[0]?.text || '';
            var total = row.querySelector('[id^="stt-"]')?.textContent || '';
            var k = row.querySelector('[id*="sk-"]')?.value || '1';
            if (tp && tp !== '-- Выбрать --') {
                h += '<div style="padding:2px 0;">Пошив ' + escHTML(tp) + ' (' + k + ' шт.) — <strong>' + total + '</strong></div>';
            }
        });

        // Карниз
        var ctype = room.querySelector('[id^="ct-"]');
        if (ctype && ctype.value) {
            var tn = ctype.selectedOptions[0]?.text || '';
            var cl = room.querySelector('[id^="cl-"]')?.value || '';
            var cp2 = room.querySelector('[id^="cp-"]')?.value || '';
            var ct = room.querySelector('[id^="ctt-"]')?.textContent || '';
            h += '<div style="padding:2px 0;">Карниз ' + escHTML(tn) + ': ' + cl + ' м × ' + cp2 + ' ₽ = <strong>' + ct + '</strong></div>';
            var bqEl = room.querySelector('[id^="bq-"]');
            if (bqEl && parseFloat(bqEl.value) > 0) {
                var bp2 = room.querySelector('[id^="bp-"]')?.value || '';
                var bt = room.querySelector('[id^="btt-"]')?.textContent || '';
                h += '<div style="padding:2px 0;">Кронштейны: ' + bqEl.value + ' шт. × ' + bp2 + ' ₽ = <strong>' + bt + '</strong></div>';
            }
        }

        // Фурнитура
        FUR_ITEMS.forEach(function(fi) {
            var qEl = room.querySelector('[id^="fu-' + fi.id + '-q-"]');
            if (qEl && parseFloat(qEl.value) > 0) {
                var p2 = room.querySelector('[id^="fu-' + fi.id + '-p-"]')?.value || '';
                var t = room.querySelector('[id^="fu-' + fi.id + '-t-"]')?.textContent || '';
                h += '<div style="padding:2px 0;">' + fi.label + ': ' + qEl.value + ' × ' + p2 + ' ₽ = <strong>' + t + '</strong></div>';
            }
        });

        // Вывешивание
        var vyvBlock = room.querySelector('[id^="vyveshivanie-block-"] .vyveshivanie-block');
        if (vyvBlock) {
            var vt = vyvBlock.querySelector('.vyveshivanie-total')?.textContent || '';
            h += '<div style="padding:2px 0;"><strong>Вывешивание:</strong> ' + vt + '</div>';
        }

        // Услуги
        var sit = room.querySelector('[id^="sit-"]');
        if (sit && prs(sit.textContent) > 0) h += '<div style="padding:2px 0;">Установка: <strong>' + sit.textContent + '</strong></div>';
        var sdl = room.querySelector('[id^="sdl-"]');
        if (sdl && parseFloat(sdl.value) > 0) h += '<div style="padding:2px 0;">Доставка: <strong>' + fmt(parseFloat(sdl.value)) + '</strong></div>';
        var sds = room.querySelector('[id^="sds-"]');
        if (sds && parseFloat(sds.value) > 0) h += '<div style="padding:2px 0;">Выезд дизайнера: <strong>' + fmt(parseFloat(sds.value)) + '</strong></div>';

        // Непредвиденные
        room.querySelectorAll('[id^="extra-rows-"] .item-row').forEach(function(row) {
            var nm = row.querySelector('.extra-name')?.value || '';
            var ar = row.querySelector('.extra-art')?.value || '';
            var q = row.querySelector('[id^="eq-"]')?.value || '';
            var t = row.querySelector('[id^="ett-"]')?.textContent || '';
            if (nm) h += '<div style="padding:2px 0;">' + escHTML(nm) + (ar ? ' | Арт: ' + escHTML(ar) : '') + ' | ' + q + ' шт. — <strong>' + t + '</strong></div>';
        });

        h += '<div style="text-align:right;margin-top:10px;padding-top:6px;border-top:2px solid #6b4c9a;font-size:15px;font-weight:bold;color:#6b4c9a;">ПОДИТОГ: ' + fmt(subtotal) + '</div>';
        h += '</div></div>';
    });

    h += '<div style="margin-top:25px;text-align:right;font-size:20px;font-weight:bold;color:#6b4c9a;border-top:3px solid #6b4c9a;padding-top:10px;">ИТОГО: ' + fmt(grandTotal) + '</div>';

    // Открываем новое окно и печатаем
    var win = window.open('', '_blank');
    win.document.write('<html><head><title>DECOR BONJOUR - Заказ</title>');
    win.document.write('<style>body{font-family:Arial,sans-serif;font-size:13px;color:#333;padding:30px;max-width:800px;margin:0 auto;}@media print{body{padding:10px;}}</style>');
    win.document.write('</head><body>');
    win.document.write(h);
    win.document.write('</body></html>');
    win.document.close();
    
    // Автоматически вызываем печать (пользователь может выбрать "Сохранить как PDF")
    setTimeout(function() {
        win.print();
    }, 500);
}
