// =============================================
// DECOR BONJOUR — Калькулятор заказов
// Версия для GitHub Pages (localStorage)
// =============================================

// ===== ХРАНИЛИЩЕ (localStorage) =====
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

// ===== ГЛОБАЛЬНЫЕ ДАННЫЕ =====
let settings = {};
let priceList = [];
let suppliers = [];
let roomCounter = 0;
let fabricCounters = {};
let sewingCounters = {};
let extraCounters = {};

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    addRoom();
});

function loadAllData() {
    // Настройки
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

    // Прайс-лист
    const savedPrice = JSON.parse(localStorage.getItem(STORAGE_KEYS.priceList) || 'null');
    priceList = savedPrice || [...DEFAULT_PRICE_LIST];
    if (!savedPrice) localStorage.setItem(STORAGE_KEYS.priceList, JSON.stringify(priceList));

    // Поставщики
    const savedSuppliers = JSON.parse(localStorage.getItem(STORAGE_KEYS.suppliers) || 'null');
    suppliers = savedSuppliers || [];
    if (!savedSuppliers) localStorage.setItem(STORAGE_KEYS.suppliers, JSON.stringify(suppliers));
}

function saveSettings2Storage() {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}
function savePriceList2Storage() {
    localStorage.setItem(STORAGE_KEYS.priceList, JSON.stringify(priceList));
}
function saveSuppliers2Storage() {
    localStorage.setItem(STORAGE_KEYS.suppliers, JSON.stringify(suppliers));
}

// ===== НАСТРОЙКИ =====
function openSettings() {
    const container = document.getElementById('settingsContent');
    let html = '';
    for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
        html += `
            <div class="settings-row">
                <label>${def.label}</label>
                <input type="number" data-key="${key}" value="${settings[key] || def.value}" step="0.01">
            </div>`;
    }
    container.innerHTML = html;
    document.getElementById('settingsModal').classList.add('active');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
}

function saveSettings() {
    const inputs = document.querySelectorAll('#settingsContent input[data-key]');
    inputs.forEach(input => {
        settings[input.dataset.key] = parseFloat(input.value) || 0;
    });
    saveSettings2Storage();
    closeSettings();
    recalcAll();
}

// ===== ПРАЙС-ЛИСТ =====
function openPriceList() {
    renderPriceList();
    document.getElementById('priceListModal').classList.add('active');
}

function closePriceList() {
    document.getElementById('priceListModal').classList.remove('active');
}

function renderPriceList() {
    const body = document.getElementById('priceListBody');
    body.innerHTML = priceList.map((item, i) => `
        <tr>
            <td><input type="text" value="${item.name}" onchange="updatePriceItem(${i},'name',this.value)"></td>
            <td><input type="number" value="${item.cost || ''}" onchange="updatePriceItem(${i},'cost',this.value)" step="0.01"></td>
            <td><input type="number" value="${item.sell || ''}" onchange="updatePriceItem(${i},'sell',this.value)" step="0.01"></td>
            <td><button class="btn btn-delete" onclick="deletePriceItem(${i})">✕</button></td>
        </tr>`).join('');
}

function updatePriceItem(index, field, value) {
    if (field === 'name') priceList[index].name = value;
    else priceList[index][field] = value ? parseFloat(value) : '';
    savePriceList2Storage();
}

function addPriceItem() {
    const name = document.getElementById('newPriceName').value.trim();
    if (!name) return;
    const cost = document.getElementById('newPriceCost').value;
    const sell = document.getElementById('newPriceSell').value;
    priceList.push({
        id: Date.now(),
        name,
        cost: cost ? parseFloat(cost) : '',
        sell: sell ? parseFloat(sell) : ''
    });
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
function openSuppliersModal() {
    renderSuppliersList();
    document.getElementById('suppliersModal').classList.add('active');
}

function closeSuppliersModal() {
    document.getElementById('suppliersModal').classList.remove('active');
}

function renderSuppliersList() {
    const container = document.getElementById('suppliersContent');
    if (suppliers.length === 0) {
        container.innerHTML = '<p style="color:#9ca3af; font-style:italic;">Нет сохранённых поставщиков</p>';
        return;
    }
    container.innerHTML = '<table><thead><tr><th>Название</th><th></th></tr></thead><tbody>' +
        suppliers.map((s, i) => `
            <tr>
                <td>${s}</td>
                <td><button class="btn btn-delete" onclick="deleteSupplier(${i})">✕</button></td>
            </tr>`).join('') +
        '</tbody></table>';
}

function addSupplierManual() {
    const input = document.getElementById('newSupplierName');
    const name = input.value.trim();
    if (!name) return;
    if (!suppliers.includes(name)) {
        suppliers.push(name);
        suppliers.sort();
        saveSuppliers2Storage();
    }
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
    return `
    <div class="field-group field-supplier">
        <label>Поставщик</label>
        <div class="supplier-wrapper">
            <input type="text" class="supplier-input" placeholder="Поставщик"
                   onfocus="showSupDrop(this)" oninput="filterSupDrop(this)"
                   onblur="setTimeout(()=>hideSupDrop(this),200)">
            <div class="supplier-dropdown"></div>
        </div>
    </div>`;
}

function showSupDrop(input) {
    const dd = input.nextElementSibling;
    renderSupOptions(dd, input.value);
    dd.classList.add('active');
}

function hideSupDrop(input) {
    input.nextElementSibling.classList.remove('active');
    const val = input.value.trim();
    if (val && !suppliers.find(s => s.toLowerCase() === val.toLowerCase())) {
        addNewSupplier(val);
    }
}

function filterSupDrop(input) {
    renderSupOptions(input.nextElementSibling, input.value);
}

function renderSupOptions(dd, filter) {
    const f = (filter || '').toLowerCase();
    const filtered = suppliers.filter(s => s.toLowerCase().includes(f));
    dd.innerHTML = filtered.map(s =>
        `<div class="supplier-option" onmousedown="pickSup(this,'${s.replace(/'/g, "\\'")}')">${s}</div>`
    ).join('');
    if (!filtered.length && filter) {
        dd.innerHTML = '<div class="supplier-option" style="color:#9ca3af;font-style:italic">Новый — сохранится автоматически</div>';
    }
}

function pickSup(el, name) {
    const wrapper = el.closest('.supplier-wrapper');
    wrapper.querySelector('.supplier-input').value = name;
    wrapper.querySelector('.supplier-dropdown').classList.remove('active');
}

// ===== КОМНАТЫ =====
function addRoom(dupData) {
    roomCounter++;
    const rid = roomCounter;
    const container = document.getElementById('roomsContainer');
    const div = document.createElement('div');
    div.className = 'room';
    div.id = `room-${rid}`;
    div.dataset.roomId = rid;

    div.innerHTML = `
        <div class="room-header">
            <div class="room-header-left">
                <h2>Комната ${rid}</h2>
                <input type="text" class="room-name-input" placeholder="Название (Гостиная, Спальня...)" value="${dupData?.name || ''}">
            </div>
            <div style="display:flex;gap:8px;">
                <button class="btn btn-duplicate" onclick="duplicateRoom(${rid})">📋 Дублировать</button>
                <button class="btn btn-delete-room" onclick="deleteRoom(${rid})">✕ Удалить</button>
            </div>
        </div>
        <div class="room-body">
            <div class="block">
                <div class="block-header">
                    <span class="block-title">🧵 Ткань</span>
                    <button class="btn btn-add" onclick="addFabricRow(${rid})">+ Добавить</button>
                </div>
                <div id="fabric-rows-${rid}"></div>
            </div>
            <div class="tesma-block" id="tesma-block-${rid}" style="display:none">
                <h4>🧵 Тесьма (автоматически)</h4>
                <div id="tesma-rows-${rid}"></div>
            </div>
            <div class="block">
                <div class="block-header">
                    <span class="block-title">✂️ Пошив</span>
                    <button class="btn btn-add" onclick="addSewingRow(${rid})">+ Добавить</button>
                </div>
                <div id="sewing-rows-${rid}"></div>
            </div>
            <div class="add-item-buttons">
                <button class="btn-add-optional" onclick="addCorniceBlock(${rid})" id="btn-cornice-${rid}">+ Карниз + кронштейны</button>
                <button class="btn-add-optional" onclick="addFurnitureBlock(${rid})" id="btn-furniture-${rid}">+ Фурнитура</button>
                <button class="btn-add-optional" onclick="addServicesBlock(${rid})" id="btn-services-${rid}">+ Услуги</button>
                <button class="btn-add-optional" onclick="addExtraItemRow(${rid})">+ Непредвиденные товары</button>
            </div>
            <div id="cornice-block-${rid}"></div>
            <div id="furniture-block-${rid}"></div>
            <div id="vyveshivanie-block-${rid}"></div>
            <div id="services-block-${rid}"></div>
            <div class="block" id="extra-block-${rid}" style="display:none">
                <div class="block-header">
                    <span class="block-title">📦 Непредвиденные товары</span>
                    <button class="btn btn-add" onclick="addExtraItemRow(${rid})">+ Добавить</button>
                </div>
                <div id="extra-rows-${rid}"></div>
            </div>
        </div>
        <div class="subtotal-row">
            <span class="subtotal-label">ПОДИТОГ:</span>
            <span class="subtotal-value" id="subtotal-${rid}">0 ₽</span>
        </div>`;

    container.appendChild(div);
    recalcRoom(rid);
}

function deleteRoom(rid) {
    if (!confirm('Удалить комнату?')) return;
    document.getElementById(`room-${rid}`).remove();
    recalcGrandTotal();
}

function duplicateRoom(rid) {
    const room = document.getElementById(`room-${rid}`);
    const name = room.querySelector('.room-name-input').value;
    addRoom({ name });
    const newRid = roomCounter;
    const src = room.querySelector('.room-body');
    const tgt = document.getElementById(`room-${newRid}`).querySelector('.room-body');

    // Заменяем все ID
    let html = src.innerHTML;
    const re1 = new RegExp(`-${rid}-`, 'g');
    const re2 = new RegExp(`-${rid}"`, 'g');
    const re3 = new RegExp(`\\(${rid}\\)`, 'g');
    const re4 = new RegExp(`\\(${rid},`, 'g');
    html = html.replace(re1, `-${newRid}-`).replace(re2, `-${newRid}"`).replace(re3, `(${newRid})`).replace(re4, `(${newRid},`);
    tgt.innerHTML = html;

    // Копируем значения
    const srcInputs = src.querySelectorAll('input,select');
    const tgtInputs = tgt.querySelectorAll('input,select');
    srcInputs.forEach((inp, i) => { if (tgtInputs[i]) tgtInputs[i].value = inp.value; });

    // Синхронизируем счётчики
    fabricCounters[newRid] = fabricCounters[rid] || 0;
    sewingCounters[newRid] = sewingCounters[rid] || 0;
    extraCounters[newRid] = extraCounters[rid] || 0;

    recalcRoom(newRid);
}

// ===== ТКАНЬ =====
function addFabricRow(rid) {
    if (!fabricCounters[rid]) fabricCounters[rid] = 0;
    fabricCounters[rid]++;
    const idx = fabricCounters[rid];
    const container = document.getElementById(`fabric-rows-${rid}`);
    const row = document.createElement('div');
    row.className = 'item-row';
    row.id = `fr-${rid}-${idx}`;
    row.innerHTML = `
        <div class="field-group field-type">
            <label>Вид изделия</label>
            <select onchange="onFabricChange(${rid})" id="ft-${rid}-${idx}">
                <option value="">-- Выбрать --</option>
                <option value="portera">Портьеры</option>
                <option value="portera_wave">Портьера волна</option>
                <option value="portera_bant">Портьера бантовка</option>
                <option value="tul">Тюль</option>
                <option value="tul_bant">Тюль бантовка</option>
                <option value="rimskaya">Римская штора</option>
                <option value="pokryvalo">Покрывало</option>
            </select>
        </div>
        ${createSupplierField(rid, idx)}
        <div class="field-group field-article">
            <label>Артикул</label>
            <input type="text" placeholder="Артикул" class="fabric-article">
        </div>
        <div class="field-group field-qty">
            <label>Кол-во (м.п.)</label>
            <input type="number" placeholder="0" oninput="calcFabric(${rid})" id="fq-${rid}-${idx}" step="0.01">
        </div>
        <div class="field-group field-price">
            <label>Цена за м.п.</label>
            <input type="number" placeholder="0" oninput="calcFabric(${rid})" id="fp-${rid}-${idx}" step="0.01">
        </div>
        <div class="field-group field-total">
            <label>Итого</label>
            <div class="item-total" id="ftt-${rid}-${idx}">0 ₽</div>
        </div>
        <button class="btn btn-delete" onclick="remFabric(${rid},${idx})">✕</button>`;
    container.appendChild(row);
}

function remFabric(rid, idx) {
    document.getElementById(`fr-${rid}-${idx}`)?.remove();
    calcFabric(rid);
}

function onFabricChange(rid) { calcFabric(rid); }

function calcFabric(rid) {
    // Пересчитать все строки ткани
    const rows = document.querySelectorAll(`#fabric-rows-${rid} .item-row`);
    rows.forEach(row => {
        const qI = row.querySelector('[id^="fq-"]');
        const pI = row.querySelector('[id^="fp-"]');
        const tE = row.querySelector('[id^="ftt-"]');
        if (qI && pI && tE) {
            const q = parseFloat(qI.value) || 0;
            const p = parseFloat(pI.value) || 0;
            tE.textContent = fmt(Math.round(q * p));
        }
    });
    recalcTesma(rid);
    recalcVyv(rid);
    recalcRoom(rid);
}

// ===== ТЕСЬМА (авто) =====
function recalcTesma(rid) {
    const container = document.getElementById(`tesma-rows-${rid}`);
    const priceTesma = settings.price_tesma || 350;
    container.innerHTML = '';
    let has = false;

    document.querySelectorAll(`#fabric-rows-${rid} .item-row`).forEach(row => {
        const type = row.querySelector('select')?.value || '';
        const qty = parseFloat(row.querySelector('[id^="fq-"]')?.value) || 0;
        if (['portera','portera_wave','portera_bant','tul','tul_bant'].includes(type) && qty > 0) {
            has = true;
            const len = qty + 0.2;
            const total = Math.round(len * priceTesma);
            const lbl = type.startsWith('portera') ? 'Тесьма для портьеры' : 'Тесьма для тюля';
            container.innerHTML += `<div class="tesma-row"><span>${lbl}</span><span class="tesma-calc">${len.toFixed(2)} м × ${fmt(priceTesma)}</span><span class="tesma-sum">${fmt(total)}</span></div>`;
        }
    });
    document.getElementById(`tesma-block-${rid}`).style.display = has ? 'block' : 'none';
}

function getTesmaTotal(rid) {
    const p = settings.price_tesma || 350;
    let t = 0;
    document.querySelectorAll(`#fabric-rows-${rid} .item-row`).forEach(row => {
        const type = row.querySelector('select')?.value || '';
        const qty = parseFloat(row.querySelector('[id^="fq-"]')?.value) || 0;
        if (['portera','portera_wave','portera_bant','tul','tul_bant'].includes(type) && qty > 0) {
            t += Math.round((qty + 0.2) * p);
        }
    });
    return t;
}

// ===== ПОШИВ =====
function addSewingRow(rid) {
    if (!sewingCounters[rid]) sewingCounters[rid] = 0;
    sewingCounters[rid]++;
    const idx = sewingCounters[rid];
    const container = document.getElementById(`sewing-rows-${rid}`);
    const row = document.createElement('div');
    row.className = 'item-row';
    row.id = `sr-${rid}-${idx}`;
    row.style.flexDirection = 'column';
    row.style.alignItems = 'stretch';
    row.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <div class="field-group field-type">
                <label>Вид</label>
                <select onchange="onSewType(${rid},${idx})" id="st-${rid}-${idx}">
                    <option value="">-- Выбрать --</option>
                    <option value="portera">Портьера</option>
                    <option value="portera_wave">Портьера волна</option>
                    <option value="portera_bant">Портьера бантовка</option>
                    <option value="tul">Тюль</option>
                    <option value="tul_bant">Тюль бантовка</option>
                    <option value="rimskaya">Римская штора</option>
                    <option value="pokryvalo">Покрывало</option>
                </select>
            </div>
            <div id="sf-${rid}-${idx}" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:1;"></div>
            <div class="field-group field-total">
                <label>Итого</label>
                <div class="item-total" id="stt-${rid}-${idx}">0 ₽</div>
            </div>
            <button class="btn btn-delete" onclick="remSewing(${rid},${idx})">✕</button>
        </div>
        <div id="se-${rid}-${idx}"></div>`;
    container.appendChild(row);
}

function remSewing(rid, idx) {
    document.getElementById(`sr-${rid}-${idx}`)?.remove();
    recalcRoom(rid);
}

function onSewType(rid, idx) {
    const type = document.getElementById(`st-${rid}-${idx}`).value;
    const fc = document.getElementById(`sf-${rid}-${idx}`);
    const ec = document.getElementById(`se-${rid}-${idx}`);
    const oi = `calcSew(${rid},${idx})`;
    const defD = settings.price_strochka || 200;
    let h = '', eh = '';

    if (['portera','portera_wave','portera_bant','tul','tul_bant'].includes(type)) {
        h = `<div class="field-group field-small"><label>Ширина (A)</label><input type="number" id="sa-${rid}-${idx}" oninput="${oi}" step="0.01"></div>
             <div class="field-group field-small"><label>Высота (B)</label><input type="number" id="sb-${rid}-${idx}" oninput="${oi}" step="0.01"></div>`;
        if (type === 'portera_bant' || type === 'tul_bant') {
            h += `<div class="field-group field-small"><label>Шир.изд.(W)</label><input type="number" id="sw-${rid}-${idx}" oninput="${oi}" step="0.01"></div>`;
        }
        h += `<div class="field-group field-small"><label>Строчка(D)</label><input type="number" id="sd-${rid}-${idx}" oninput="${oi}" step="0.01" value="${defD}"></div>
              <div class="field-group field-small"><label>Кол-во(K)</label><input type="number" id="sk-${rid}-${idx}" oninput="${oi}" value="1" step="1"></div>
              <div class="field-group field-small"><label>Сложн.%</label><input type="number" id="sp-${rid}-${idx}" oninput="${oi}" value="0" step="1"></div>`;
    } else if (type === 'rimskaya') {
        h = `<div class="field-group field-small"><label>Площадь(м²)</label><input type="number" id="sarea-${rid}-${idx}" oninput="${oi}" step="0.01"></div>
             <div class="field-group field-price"><label>Цена за м²</label><input type="number" id="sprice-${rid}-${idx}" oninput="${oi}" step="0.01"></div>`;
        eh = `<div class="extra-fields">
                <div class="extra-field-row"><label>Тесьма:</label><input type="number" id="srt-q-${rid}-${idx}" placeholder="кол-во" oninput="${oi}" step="0.01"><span>×</span><input type="number" id="srt-p-${rid}-${idx}" placeholder="цена" oninput="${oi}" step="0.01"><span class="extra-field-total" id="srt-t-${rid}-${idx}">0 ₽</span></div>
                <div class="extra-field-row"><label>Вывешивание:</label><input type="number" id="srv-q-${rid}-${idx}" placeholder="кол-во" oninput="${oi}" step="0.01"><span>×</span><input type="number" id="srv-p-${rid}-${idx}" placeholder="цена" oninput="${oi}" step="0.01"><span class="extra-field-total" id="srv-t-${rid}-${idx}">0 ₽</span></div>
                <div class="extra-field-row"><label>Колечки:</label><input type="number" id="srr-q-${rid}-${idx}" placeholder="кол-во" oninput="${oi}" step="1"><span>×</span><input type="number" id="srr-p-${rid}-${idx}" placeholder="цена" oninput="${oi}" step="0.01"><span class="extra-field-total" id="srr-t-${rid}-${idx}">0 ₽</span></div>
              </div>`;
    } else if (type === 'pokryvalo') {
        h = `<div class="field-group field-small"><label>Площадь(м²)</label><input type="number" id="sarea-${rid}-${idx}" oninput="${oi}" step="0.01"></div>
             <div class="field-group field-price"><label>Цена за м²</label><input type="number" id="sprice-${rid}-${idx}" oninput="${oi}" step="0.01"></div>`;
        eh = `<div class="extra-fields">
                <div class="extra-field-row"><label>Стёжка:</label><input type="number" id="sps-q-${rid}-${idx}" placeholder="п.м." oninput="${oi}" step="0.01"><span>×</span><input type="number" id="sps-p-${rid}-${idx}" placeholder="цена" oninput="${oi}" step="0.01"><span class="extra-field-total" id="sps-t-${rid}-${idx}">0 ₽</span></div>
                <div class="extra-field-row"><label>Подклада:</label><input type="number" id="spd-q-${rid}-${idx}" placeholder="п.м." oninput="${oi}" step="0.01"><span>×</span><input type="number" id="spd-p-${rid}-${idx}" placeholder="цена" oninput="${oi}" step="0.01"><span class="extra-field-total" id="spd-t-${rid}-${idx}">0 ₽</span></div>
                <div class="extra-field-row"><label>Кант:</label><input type="number" id="spk-q-${rid}-${idx}" placeholder="п.м." oninput="${oi}" step="0.01"><span>×</span><input type="number" id="spk-p-${rid}-${idx}" placeholder="цена" oninput="${oi}" step="0.01"><span class="extra-field-total" id="spk-t-${rid}-${idx}">0 ₽</span></div>
              </div>`;
    }
    fc.innerHTML = h;
    ec.innerHTML = eh;
    calcSew(rid, idx);
}

function calcSew(rid, idx) {
    const type = document.getElementById(`st-${rid}-${idx}`)?.value || '';
    const gv = id => parseFloat(document.getElementById(id)?.value) || 0;
    let total = 0;

    switch (type) {
        case 'portera': {
            const A=gv(`sa-${rid}-${idx}`),B=gv(`sb-${rid}-${idx}`),D=gv(`sd-${rid}-${idx}`),K=gv(`sk-${rid}-${idx}`)||1,P=gv(`sp-${rid}-${idx}`);
            total = Math.round(((A*3)+(B*2))*D*(1+P/100)*K);
            break;
        }
        case 'portera_wave': {
            const A=gv(`sa-${rid}-${idx}`),B=gv(`sb-${rid}-${idx}`),D=gv(`sd-${rid}-${idx}`),K=gv(`sk-${rid}-${idx}`)||1,P=gv(`sp-${rid}-${idx}`);
            const wp = settings.price_wave_markup||150;
            total = Math.round((((A*3)+(B*2))*D+(A*wp))*(1+P/100)*K);
            break;
        }
        case 'portera_bant': {
            const A=gv(`sa-${rid}-${idx}`),B=gv(`sb-${rid}-${idx}`),W=gv(`sw-${rid}-${idx}`),D=gv(`sd-${rid}-${idx}`),K=gv(`sk-${rid}-${idx}`)||1,P=gv(`sp-${rid}-${idx}`);
            const bp = settings.price_bantovka||1200;
            total = Math.round((((A*3)+(B*2))*D+(W*bp))*(1+P/100)*K);
            break;
        }
        case 'tul': {
            const A=gv(`sa-${rid}-${idx}`),B=gv(`sb-${rid}-${idx}`),D=gv(`sd-${rid}-${idx}`),K=gv(`sk-${rid}-${idx}`)||1,P=gv(`sp-${rid}-${idx}`);
            total = Math.round(((A*2)+(B*2))*D*(1+P/100)*K);
            break;
        }
        case 'tul_bant': {
            const A=gv(`sa-${rid}-${idx}`),B=gv(`sb-${rid}-${idx}`),W=gv(`sw-${rid}-${idx}`),D=gv(`sd-${rid}-${idx}`),K=gv(`sk-${rid}-${idx}`)||1,P=gv(`sp-${rid}-${idx}`);
            total = Math.round(((A*2)+(B*2)+(W*4))*D*(1+P/100)*K);
            break;
        }
        case 'rimskaya': {
            total = Math.round(gv(`sarea-${rid}-${idx}`)*gv(`sprice-${rid}-${idx}`));
            ['rt','rv','rr'].forEach(x => {
                const q=gv(`s${x}-q-${rid}-${idx}`),p=gv(`s${x}-p-${rid}-${idx}`),t=Math.round(q*p);
                const el=document.getElementById(`s${x}-t-${rid}-${idx}`);
                if(el) el.textContent=fmt(t);
                total+=t;
            });
            break;
        }
        case 'pokryvalo': {
            total = Math.round(gv(`sarea-${rid}-${idx}`)*gv(`sprice-${rid}-${idx}`));
            ['ps','pd','pk'].forEach(x => {
                const q=gv(`s${x}-q-${rid}-${idx}`),p=gv(`s${x}-p-${rid}-${idx}`),t=Math.round(q*p);
                const el=document.getElementById(`s${x}-t-${rid}-${idx}`);
                if(el) el.textContent=fmt(t);
                total+=t;
            });
            break;
        }
    }
    const el = document.getElementById(`stt-${rid}-${idx}`);
    if (el) el.textContent = fmt(total);
    recalcRoom(rid);
}

// ===== ВЫВЕШИВАНИЕ =====
function recalcVyv(rid) {
    const c = document.getElementById(`vyveshivanie-block-${rid}`);
    if (c.dataset.removed) return;
    const pv = getVyvPrice();
    let meters = 0;
    document.querySelectorAll(`#fabric-rows-${rid} .item-row`).forEach(row => {
        const type = row.querySelector('select')?.value || '';
        const qty = parseFloat(row.querySelector('[id^="fq-"]')?.value) || 0;
        if (['portera','portera_wave','portera_bant','tul','tul_bant'].includes(type)) meters += qty;
    });
    if (meters > 0) {
        const total = Math.round(meters * pv);
        c.innerHTML = `<div class="vyveshivanie-block">
            <h4>📐 Вывешивание</h4>
            <div class="vyveshivanie-info">
                <span>Метраж: <strong>${meters.toFixed(2)} м</strong></span>
                <span>× <strong>${fmt(pv)}</strong></span>
                <span class="vyveshivanie-total">ИТОГО: ${fmt(total)}</span>
                <button class="btn btn-delete" onclick="remVyv(${rid})">✕ Удалить</button>
            </div>
        </div>`;
    } else {
        c.innerHTML = '';
    }
    recalcRoom(rid);
}

function remVyv(rid) {
    const c = document.getElementById(`vyveshivanie-block-${rid}`);
    c.innerHTML = '';
    c.dataset.removed = 'true';
    recalcRoom(rid);
}

function getVyvPrice() {
    const item = priceList.find(p => p.name === 'Вывешивание');
    return item ? parseFloat(item.sell) || 400 : 400;
}

function getVyvTotal(rid) {
    const c = document.getElementById(`vyveshivanie-block-${rid}`);
    if (c.dataset.removed || !c.innerHTML.trim()) return 0;
    const pv = getVyvPrice();
    let m = 0;
    document.querySelectorAll(`#fabric-rows-${rid} .item-row`).forEach(row => {
        const type = row.querySelector('select')?.value || '';
        const qty = parseFloat(row.querySelector('[id^="fq-"]')?.value) || 0;
        if (['portera','portera_wave','portera_bant','tul','tul_bant'].includes(type)) m += qty;
    });
    return Math.round(m * pv);
}

// ===== КАРНИЗ =====
function addCorniceBlock(rid) {
    const c = document.getElementById(`cornice-block-${rid}`);
    const b = document.getElementById(`btn-cornice-${rid}`);
    if (b) b.style.display = 'none';
    const cp = getCorniceDefPrices();
    c.innerHTML = `<div class="block">
        <div class="block-header"><span class="block-title">🔧 Карниз + Кронштейны</span><button class="btn btn-delete" onclick="remCornice(${rid})">✕</button></div>
        <div class="item-row">
            <div class="field-group field-type"><label>Тип</label>
                <select id="ct-${rid}" onchange="onCorniceType(${rid})">
                    <option value="">-- Выбрать --</option>
                    <option value="sm">СМ (пластиковый)</option>
                    <option value="profile">Профильный</option>
                    <option value="rimsky">Римский</option>
                </select>
            </div>
            <div class="field-group field-small"><label>Длина (м)</label><input type="number" id="cl-${rid}" oninput="calcCornice(${rid})" step="0.01"></div>
            <div class="field-group field-price"><label>Цена за м</label><input type="number" id="cp-${rid}" oninput="calcCornice(${rid})" step="0.01"></div>
            <div class="field-group field-total"><label>Итого</label><div class="item-total" id="ctt-${rid}">0 ₽</div></div>
        </div>
        <div class="item-row">
            <div class="field-group field-type"><label>Кронштейн</label>
                <select id="bs-${rid}"><option value="10">10 см</option><option value="15">15 см</option><option value="20">20 см</option><option value="25">25 см</option></select>
            </div>
            <div class="field-group field-small"><label>Кол-во</label><input type="number" id="bq-${rid}" oninput="calcCornice(${rid})" step="1"></div>
            <div class="field-group field-price"><label>Цена/шт</label><input type="number" id="bp-${rid}" oninput="calcCornice(${rid})" step="0.01"></div>
            <div class="field-group field-total"><label>Итого</label><div class="item-total" id="btt-${rid}">0 ₽</div></div>
        </div>
        <div style="text-align:right;padding:5px 10px;"><strong>Всего: <span id="cgt-${rid}">0 ₽</span></strong></div>
    </div>`;
}

function remCornice(rid) {
    document.getElementById(`cornice-block-${rid}`).innerHTML = '';
    const b = document.getElementById(`btn-cornice-${rid}`);
    if (b) b.style.display = '';
    recalcRoom(rid);
}

function getCorniceDefPrices() {
    const m = {};
    priceList.forEach(p => {
        if (p.name === 'Карниз СМ') m.sm = p.sell;
        if (p.name === 'Карниз профильный') m.profile = p.sell;
        if (p.name === 'Карниз римский') m.rimsky = p.sell;
    });
    return { sm: m.sm||550, profile: m.profile||1000, rimsky: m.rimsky||5000 };
}

function onCorniceType(rid) {
    const type = document.getElementById(`ct-${rid}`).value;
    const prices = getCorniceDefPrices();
    if (prices[type]) document.getElementById(`cp-${rid}`).value = prices[type];
    calcCornice(rid);
}

function calcCornice(rid) {
    const l=parseFloat(document.getElementById(`cl-${rid}`)?.value)||0;
    const p=parseFloat(document.getElementById(`cp-${rid}`)?.value)||0;
    const bq=parseFloat(document.getElementById(`bq-${rid}`)?.value)||0;
    const bp=parseFloat(document.getElementById(`bp-${rid}`)?.value)||0;
    const ct=Math.round(l*p), bt=Math.round(bq*bp);
    setT(`ctt-${rid}`,ct); setT(`btt-${rid}`,bt); setT(`cgt-${rid}`,ct+bt);
    recalcRoom(rid);
}

function getCorniceTotal(rid) {
    const l=parseFloat(document.getElementById(`cl-${rid}`)?.value)||0;
    const p=parseFloat(document.getElementById(`cp-${rid}`)?.value)||0;
    const bq=parseFloat(document.getElementById(`bq-${rid}`)?.value)||0;
    const bp=parseFloat(document.getElementById(`bp-${rid}`)?.value)||0;
    return Math.round(l*p)+Math.round(bq*bp);
}

// ===== ФУРНИТУРА =====
const FUR_ITEMS = [
    {id:'cord',label:'Корд для волны',u:'м'},
    {id:'hiron',label:'Крючки железные',u:'шт'},
    {id:'hsnail',label:'Крючки улитка',u:'шт'},
    {id:'hnail',label:'Крючки гвоздик',u:'шт'},
    {id:'holder',label:'Держатель (подхват)',u:'шт'}
];

function addFurnitureBlock(rid) {
    const c = document.getElementById(`furniture-block-${rid}`);
    const b = document.getElementById(`btn-furniture-${rid}`);
    if(b) b.style.display='none';
    let h = `<div class="block"><div class="block-header"><span class="block-title">🔩 Фурнитура</span><button class="btn btn-delete" onclick="remFurniture(${rid})">✕</button></div>`;
    FUR_ITEMS.forEach(fi => {
        h += `<div class="item-row">
            <div class="field-group field-wide"><label>${fi.label}</label></div>
            <div class="field-group field-small"><label>Кол-во(${fi.u})</label><input type="number" id="fu-${fi.id}-q-${rid}" oninput="calcFur(${rid})" step="0.01"></div>
            <div class="field-group field-price"><label>Цена</label><input type="number" id="fu-${fi.id}-p-${rid}" oninput="calcFur(${rid})" step="0.01"></div>
            <div class="field-group field-total"><label>Итого</label><div class="item-total" id="fu-${fi.id}-t-${rid}">0 ₽</div></div>
        </div>`;
    });
    h += `<div style="text-align:right;padding:5px 10px;"><strong>Всего: <span id="fgt-${rid}">0 ₽</span></strong></div></div>`;
    c.innerHTML = h;
}

function remFurniture(rid) {
    document.getElementById(`furniture-block-${rid}`).innerHTML = '';
    const b = document.getElementById(`btn-furniture-${rid}`);
    if(b) b.style.display='';
    recalcRoom(rid);
}

function calcFur(rid) {
    let g=0;
    FUR_ITEMS.forEach(fi => {
        const q=parseFloat(document.getElementById(`fu-${fi.id}-q-${rid}`)?.value)||0;
        const p=parseFloat(document.getElementById(`fu-${fi.id}-p-${rid}`)?.value)||0;
        const t=Math.round(q*p); setT(`fu-${fi.id}-t-${rid}`,t); g+=t;
    });
    setT(`fgt-${rid}`,g);
    recalcRoom(rid);
}

function getFurTotal(rid) {
    let t=0;
    FUR_ITEMS.forEach(fi => {
        const q=parseFloat(document.getElementById(`fu-${fi.id}-q-${rid}`)?.value)||0;
        const p=parseFloat(document.getElementById(`fu-${fi.id}-p-${rid}`)?.value)||0;
        t+=Math.round(q*p);
    });
    return t;
}

// ===== УСЛУГИ =====
function addServicesBlock(rid) {
    const c = document.getElementById(`services-block-${rid}`);
    const b = document.getElementById(`btn-services-${rid}`);
    if(b) b.style.display='none';
    c.innerHTML = `<div class="block">
        <div class="block-header"><span class="block-title">🚛 Услуги</span><button class="btn btn-delete" onclick="remServices(${rid})">✕</button></div>
        <div class="item-row">
            <div class="field-group field-wide"><label>Установка карниза</label></div>
            <div class="field-group field-small"><label>Метров</label><input type="number" id="siq-${rid}" oninput="calcSvc(${rid})" step="0.01"></div>
            <div class="field-group field-price"><label>Цена/м</label><input type="number" id="sip-${rid}" oninput="calcSvc(${rid})" step="0.01"></div>
            <div class="field-group field-total"><label>Итого</label><div class="item-total" id="sit-${rid}">0 ₽</div></div>
        </div>
        <div class="item-row">
            <div class="field-group field-wide"><label>Доставка</label></div>
            <div class="field-group field-price"><label>Сумма</label><input type="number" id="sdl-${rid}" oninput="calcSvc(${rid})" step="0.01"></div>
        </div>
        <div class="item-row">
            <div class="field-group field-wide"><label>Выезд дизайнера</label></div>
            <div class="field-group field-price"><label>Сумма</label><input type="number" id="sds-${rid}" oninput="calcSvc(${rid})" step="0.01"></div>
        </div>
        <div style="text-align:right;padding:5px 10px;"><strong>Всего: <span id="svgt-${rid}">0 ₽</span></strong></div>
    </div>`;
}

function remServices(rid) {
    document.getElementById(`services-block-${rid}`).innerHTML = '';
    const b = document.getElementById(`btn-services-${rid}`);
    if(b) b.style.display='';
    recalcRoom(rid);
}

function calcSvc(rid) {
    const iq=parseFloat(document.getElementById(`siq-${rid}`)?.value)||0;
    const ip=parseFloat(document.getElementById(`sip-${rid}`)?.value)||0;
    const dl=parseFloat(document.getElementById(`sdl-${rid}`)?.value)||0;
    const ds=parseFloat(document.getElementById(`sds-${rid}`)?.value)||0;
    const it=Math.round(iq*ip);
    setT(`sit-${rid}`,it);
    setT(`svgt-${rid}`,it+Math.round(dl)+Math.round(ds));
    recalcRoom(rid);
}

function getSvcTotal(rid) {
    const iq=parseFloat(document.getElementById(`siq-${rid}`)?.value)||0;
    const ip=parseFloat(document.getElementById(`sip-${rid}`)?.value)||0;
    const dl=parseFloat(document.getElementById(`sdl-${rid}`)?.value)||0;
    const ds=parseFloat(document.getElementById(`sds-${rid}`)?.value)||0;
    return Math.round(iq*ip)+Math.round(dl)+Math.round(ds);
}

// ===== НЕПРЕДВИДЕННЫЕ ТОВАРЫ =====
function addExtraItemRow(rid) {
    if(!extraCounters[rid]) extraCounters[rid]=0;
    extraCounters[rid]++;
    const idx=extraCounters[rid];
    document.getElementById(`extra-block-${rid}`).style.display='block';
    const c = document.getElementById(`extra-rows-${rid}`);
    const row = document.createElement('div');
    row.className='item-row'; row.id=`er-${rid}-${idx}`;
    row.innerHTML = `
        <div class="field-group field-wide"><label>Наименование</label><input type="text" placeholder="Наименование" class="extra-name"></div>
        <div class="field-group field-article"><label>Артикул</label><input type="text" placeholder="Артикул" class="extra-art"></div>
        <div class="field-group field-small"><label>Кол-во</label><input type="number" id="eq-${rid}-${idx}" oninput="calcExtra(${rid},${idx})" step="0.01"></div>
        <div class="field-group field-price"><label>Цена</label><input type="number" id="ep-${rid}-${idx}" oninput="calcExtra(${rid},${idx})" step="0.01"></div>
        <div class="field-group field-total"><label>Итого</label><div class="item-total" id="ett-${rid}-${idx}">0 ₽</div></div>
        <button class="btn btn-delete" onclick="remExtra(${rid},${idx})">✕</button>`;
    c.appendChild(row);
}

function remExtra(rid,idx) {
    document.getElementById(`er-${rid}-${idx}`)?.remove();
    if(!document.getElementById(`extra-rows-${rid}`).children.length) document.getElementById(`extra-block-${rid}`).style.display='none';
    recalcRoom(rid);
}

function calcExtra(rid,idx) {
    const q=parseFloat(document.getElementById(`eq-${rid}-${idx}`)?.value)||0;
    const p=parseFloat(document.getElementById(`ep-${rid}-${idx}`)?.value)||0;
    setT(`ett-${rid}-${idx}`,Math.round(q*p));
    recalcRoom(rid);
}

function getExtraTotal(rid) {
    let t=0;
    document.querySelectorAll(`#extra-rows-${rid} .item-row`).forEach(row => {
        const q=parseFloat(row.querySelector('[id^="eq-"]')?.value)||0;
        const p=parseFloat(row.querySelector('[id^="ep-"]')?.value)||0;
        t+=Math.round(q*p);
    });
    return t;
}

// ===== РАСЧЁТЫ =====
function getFabricTotal(rid) {
    let t=0;
    document.querySelectorAll(`#fabric-rows-${rid} .item-row`).forEach(row => {
        const q=parseFloat(row.querySelector('[id^="fq-"]')?.value)||0;
        const p=parseFloat(row.querySelector('[id^="fp-"]')?.value)||0;
        t+=Math.round(q*p);
    });
    return t;
}

function getSewTotal(rid) {
    let t=0;
    document.querySelectorAll(`#sewing-rows-${rid} [id^="stt-"]`).forEach(el => { t+=prs(el.textContent); });
    return t;
}

function recalcRoom(rid) {
    const sub = getFabricTotal(rid)+getTesmaTotal(rid)+getSewTotal(rid)+getCorniceTotal(rid)+getFurTotal(rid)+getVyvTotal(rid)+getSvcTotal(rid)+getExtraTotal(rid);
    setT(`subtotal-${rid}`,sub);
    recalcGrandTotal();
}

function recalcGrandTotal() {
    let g=0;
    document.querySelectorAll('[id^="subtotal-"]').forEach(el => { g+=prs(el.textContent); });
    document.getElementById('grandTotal').textContent=fmt(g);
}

function recalcAll() {
    document.querySelectorAll('.room').forEach(room => {
        const rid=parseInt(room.dataset.roomId);
        recalcTesma(rid); recalcVyv(rid); recalcRoom(rid);
    });
}

// ===== УТИЛИТЫ =====
function fmt(n) { return Math.round(n).toLocaleString('ru-RU')+' ₽'; }
function prs(s) { return parseInt(s.replace(/[^\d-]/g,''))||0; }
function setT(id,val) { const el=document.getElementById(id); if(el) el.textContent=fmt(val); }

// ===== НОВЫЙ ЗАКАЗ =====
function newOrder() {
    if(!confirm('Очистить все данные и начать новый заказ?')) return;
    document.getElementById('clientName').value='';
    document.getElementById('clientPhone').value='';
    document.getElementById('clientAddress').value='';
    document.getElementById('roomsContainer').innerHTML='';
    roomCounter=0; fabricCounters={}; sewingCounters={}; extraCounters={};
    addRoom();
}

// ===== PDF =====
function generatePDF() {
    const cn=document.getElementById('clientName').value||'—';
    const cp=document.getElementById('clientPhone').value||'—';
    const ca=document.getElementById('clientAddress').value||'—';
    const gt=document.getElementById('grandTotal').textContent;

    let h=`<div style="font-family:'Segoe UI',Arial,sans-serif;padding:20px;color:#1f2937;">
        <div style="text-align:center;background:linear-gradient(135deg,#7c3aed,#a855f7);color:white;padding:20px;border-radius:10px;margin-bottom:20px;">
            <h1 style="margin:0;font-size:24px;letter-spacing:2px;">DECOR BONJOUR</h1>
            <p style="margin:5px 0;font-size:14px;">📞 +7 918 555 80 94 | +7 918 555 80 96</p>
            <p style="margin:0;font-size:14px;">📍 пр. Сиверса 23</p>
        </div>
        <div style="background:#f5f3ff;padding:15px;border-radius:8px;margin-bottom:20px;">
            <p style="margin:3px 0;"><strong>Клиент:</strong> ${cn}</p>
            <p style="margin:3px 0;"><strong>Телефон:</strong> ${cp}</p>
            <p style="margin:3px 0;"><strong>Адрес:</strong> ${ca}</p>
        </div>`;

    document.querySelectorAll('.room').forEach(room => {
        const rid=room.dataset.roomId;
        const rn=room.querySelector('.room-name-input').value||`Комната ${rid}`;
        const sub=document.getElementById(`subtotal-${rid}`).textContent;

        h+=`<div style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:15px;overflow:hidden;">`;
        h+=`<div style="background:#ede9fe;padding:10px 15px;font-size:16px;font-weight:700;color:#6d28d9;">КОМНАТА: ${rn}</div><div style="padding:15px;">`;

        // Ткани
        room.querySelectorAll(`#fabric-rows-${rid} .item-row`).forEach(row => {
            const tp=row.querySelector('select')?.selectedOptions[0]?.text||'';
            const sup=row.querySelector('.supplier-input')?.value||'';
            const art=row.querySelector('.fabric-article')?.value||'';
            const qty=row.querySelector('[id^="fq-"]')?.value||'';
            const price=row.querySelector('[id^="fp-"]')?.value||'';
            const total=row.querySelector('[id^="ftt-"]')?.textContent||'';
            if(tp&&tp!=='-- Выбрать --'){
                h+=`<p style="margin:2px 0;font-size:13px;"><strong>${tp}</strong> | ${sup} | Арт: ${art}</p>`;
                h+=`<p style="margin:2px 0 8px;font-size:13px;">${qty} п.м. × ${price} ₽ = <strong>${total}</strong></p>`;
            }
        });

        // Тесьма
        room.querySelectorAll(`#tesma-rows-${rid} .tesma-row`).forEach(tr => {
            const name=tr.querySelector('span')?.textContent||'';
            const calc=tr.querySelector('.tesma-calc')?.textContent||'';
            const sum=tr.querySelector('.tesma-sum')?.textContent||'';
            h+=`<p style="margin:2px 0;font-size:13px;color:#10b981;">${name}: ${calc} = <strong>${sum}</strong></p>`;
        });

        // Пошив
        room.querySelectorAll(`#sewing-rows-${rid} [id^="sr-"]`).forEach(row => {
            const tp=row.querySelector('select')?.selectedOptions[0]?.text||'';
            const total=row.querySelector('[id^="stt-"]')?.textContent||'';
            const k=row.querySelector('[id*="sk-"]')?.value||'1';
            if(tp&&tp!=='-- Выбрать --') h+=`<p style="margin:2px 0;font-size:13px;"><strong>Пошив ${tp}</strong> (${k} шт.) — <strong>${total}</strong></p>`;
        });

        // Карниз
        const ctype=room.querySelector(`#ct-${rid}`);
        if(ctype&&ctype.value){
            const tn=ctype.selectedOptions[0]?.text||'';
            const cl=room.querySelector(`#cl-${rid}`)?.value||'';
            const cp2=room.querySelector(`#cp-${rid}`)?.value||'';
            const ct=room.querySelector(`#ctt-${rid}`)?.textContent||'';
            h+=`<p style="margin:8px 0 2px;font-size:13px;"><strong>Карниз ${tn}:</strong> ${cl} м × ${cp2} ₽ = <strong>${ct}</strong></p>`;
            const bq=room.querySelector(`#bq-${rid}`)?.value;
            if(bq&&parseFloat(bq)>0){
                const bp2=room.querySelector(`#bp-${rid}`)?.value||'';
                const bt=room.querySelector(`#btt-${rid}`)?.textContent||'';
                h+=`<p style="margin:2px 0;font-size:13px;">Кронштейны: ${bq} шт. × ${bp2} ₽ = <strong>${bt}</strong></p>`;
            }
        }

        // Фурнитура
        FUR_ITEMS.forEach(fi => {
            const q=room.querySelector(`#fu-${fi.id}-q-${rid}`)?.value;
            if(q&&parseFloat(q)>0){
                const p2=room.querySelector(`#fu-${fi.id}-p-${rid}`)?.value||'';
                const t=room.querySelector(`#fu-${fi.id}-t-${rid}`)?.textContent||'';
                h+=`<p style="margin:2px 0;font-size:13px;">${fi.label}: ${q} × ${p2} ₽ = <strong>${t}</strong></p>`;
            }
        });

        // Вывешивание
        const vyv=room.querySelector(`#vyveshivanie-block-${rid} .vyveshivanie-block`);
        if(vyv){
            const vt=vyv.querySelector('.vyveshivanie-total')?.textContent||'';
            h+=`<p style="margin:2px 0;font-size:13px;"><strong>Вывешивание:</strong> ${vt}</p>`;
        }

        // Услуги
        const sit=room.querySelector(`#sit-${rid}`);
        if(sit&&prs(sit.textContent)>0) h+=`<p style="margin:2px 0;font-size:13px;">Установка: <strong>${sit.textContent}</strong></p>`;
        const sdl=room.querySelector(`#sdl-${rid}`)?.value;
        if(sdl&&parseFloat(sdl)>0) h+=`<p style="margin:2px 0;font-size:13px;">Доставка: <strong>${fmt(parseFloat(sdl))}</strong></p>`;
        const sds=room.querySelector(`#sds-${rid}`)?.value;
        if(sds&&parseFloat(sds)>0) h+=`<p style="margin:2px 0;font-size:13px;">Выезд дизайнера: <strong>${fmt(parseFloat(sds))}</strong></p>`;

        // Непредвиденные
        room.querySelectorAll(`#extra-rows-${rid} .item-row`).forEach(row => {
            const nm=row.querySelector('.extra-name')?.value||'';
            const ar=row.querySelector('.extra-art')?.value||'';
            const q=row.querySelector('[id^="eq-"]')?.value||'';
            const t=row.querySelector('[id^="ett-"]')?.textContent||'';
            if(nm) h+=`<p style="margin:2px 0;font-size:13px;">${nm} | Арт: ${ar} | ${q} шт. — <strong>${t}</strong></p>`;
        });

        h+=`</div><div style="background:#ede9fe;padding:10px 15px;text-align:right;font-size:16px;font-weight:700;color:#6d28d9;">ПОДИТОГ: ${sub}</div></div>`;
    });

    h+=`<div style="background:linear-gradient(135deg,#7c3aed,#a855f7);color:white;padding:20px;border-radius:10px;text-align:center;margin-top:15px;">
        <p style="font-size:16px;margin:0 0 5px;">ОБЩАЯ СУММА ЗАКАЗА</p>
        <p style="font-size:28px;font-weight:700;margin:0;">${gt}</p>
    </div></div>`;

    const tmp=document.createElement('div');
    tmp.innerHTML=h; tmp.style.cssText='position:absolute;left:-9999px;width:210mm;';
    document.body.appendChild(tmp);

    html2pdf().set({
        margin:10,
        filename:`DECOR_BONJOUR_${cn.replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`,
        image:{type:'jpeg',quality:0.98},
        html2canvas:{scale:2,useCORS:true},
        jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}
    }).from(tmp).save().then(()=>document.body.removeChild(tmp));
}
