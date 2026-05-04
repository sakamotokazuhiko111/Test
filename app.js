'use strict';

// ===== Storage =====
const STORAGE_KEY = 'anken_v1';

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch { return []; }
}

function save(cases) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
}

// ===== State =====
let cases = load();
let nextId = cases.length ? Math.max(...cases.map(c => c.id)) + 1 : 1;
let sortKey = 'id';
let sortDir = 'desc';
let filterStatus = '';
let filterPriority = '';
let searchText = '';
let pendingDeleteId = null;

// Seed demo data when empty
if (cases.length === 0) {
  const demo = [
    { name: '基幹システム刷新', client: '株式会社サンプル', amount: 5000000, status: '進行中', priority: '高', assignee: '田中 一郎', dueDate: '2026-06-30', note: '要件定義フェーズ' },
    { name: 'ECサイト構築', client: '合同会社テスト', amount: 1200000, status: '商談中', priority: '中', assignee: '佐藤 花子', dueDate: '2026-07-15', note: '' },
    { name: 'セキュリティ診断', client: '株式会社ABC', amount: 800000, status: '新規', priority: '高', assignee: '鈴木 次郎', dueDate: '2026-05-20', note: '見積送付済み' },
    { name: 'DX推進支援', client: '株式会社XYZ', amount: 3500000, status: '完了', priority: '中', assignee: '田中 一郎', dueDate: '2026-04-30', note: '検収完了' },
    { name: 'クラウド移行', client: '有限会社デモ', amount: 2200000, status: '保留', priority: '低', assignee: '高橋 三郎', dueDate: '2026-09-01', note: '予算確定待ち' },
  ];
  demo.forEach(d => cases.push({ id: nextId++, createdAt: new Date().toISOString(), ...d }));
  save(cases);
}

// ===== Helpers =====
function fmt(n) {
  if (n == null || n === '') return '―';
  return Number(n).toLocaleString('ja-JP') + ' 円';
}

function fmtDate(s) {
  if (!s) return '―';
  const [y, m, d] = s.split('-');
  return `${y}/${m}/${d}`;
}

function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function statusBadge(s) {
  const cls = `badge badge-${s}` ;
  return `<span class="${cls}">${s}</span>`;
}

function priorityCell(p) {
  return `<span class="priority-${p}">${p}</span>`;
}

// ===== KPI =====
function renderKPI() {
  const total = cases.length;
  const active = cases.filter(c => ['新規','進行中','商談中'].includes(c.status)).length;
  const done = cases.filter(c => c.status === '完了').length;
  const totalAmt = cases.filter(c => c.status !== '失注').reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const overdue = cases.filter(c => !['完了','失注'].includes(c.status) && isOverdue(c.dueDate)).length;

  const grid = document.getElementById('kpiGrid');
  grid.innerHTML = [
    { label: '総案件数', value: total, sub: '件' },
    { label: 'アクティブ', value: active, sub: '件' },
    { label: '完了', value: done, sub: '件' },
    { label: '期限超過', value: overdue, sub: '件' },
    { label: '総受注金額', value: totalAmt.toLocaleString('ja-JP'), sub: '円' },
  ].map(k => `
    <div class="kpi-card">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value">${k.value}</div>
      <div class="kpi-sub">${k.sub}</div>
    </div>`).join('');
}

// ===== Table =====
function filtered() {
  return cases.filter(c => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterPriority && c.priority !== filterPriority) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.client.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

function sorted(list) {
  return [...list].sort((a, b) => {
    let av = a[sortKey] ?? '';
    let bv = b[sortKey] ?? '';
    if (sortKey === 'amount') { av = Number(av); bv = Number(bv); }
    if (sortKey === 'dueDate') { av = av || '9999'; bv = bv || '9999'; }
    const cmp = String(av).localeCompare(String(bv), 'ja', { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });
}

function renderTable() {
  const list = sorted(filtered());
  const tbody = document.getElementById('caseTableBody');
  const empty = document.getElementById('emptyState');
  const footer = document.getElementById('tableFooter');

  if (list.length === 0) {
    tbody.innerHTML = '';
    empty.hidden = false;
    footer.textContent = '';
    return;
  }
  empty.hidden = true;
  footer.textContent = `${list.length} 件表示 / 全 ${cases.length} 件`;

  tbody.innerHTML = list.map(c => {
    const over = isOverdue(c.dueDate) && !['完了','失注'].includes(c.status);
    return `<tr>
      <td>${c.id}</td>
      <td><strong>${escHtml(c.name)}</strong>${c.note ? `<br><small style="color:var(--color-text-muted)">${escHtml(c.note)}</small>` : ''}</td>
      <td>${escHtml(c.client)}</td>
      <td style="text-align:right">${fmt(c.amount)}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${priorityCell(c.priority || '中')}</td>
      <td>${escHtml(c.assignee || '―')}</td>
      <td style="color:${over ? 'var(--color-danger)' : 'inherit'}">${fmtDate(c.dueDate)}${over ? ' ⚠' : ''}</td>
      <td>
        <button class="btn btn-icon" onclick="openEdit(${c.id})" title="編集">✏️</button>
        <button class="btn btn-icon" onclick="openConfirmDelete(${c.id})" title="削除">🗑️</button>
      </td>
    </tr>`;
  }).join('');

  // Update sort indicators
  document.querySelectorAll('.table th[data-sort]').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === sortKey) th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
  });
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== Modal =====
function openModal(title) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalOverlay').hidden = false;
  document.getElementById('fieldName').focus();
}
function closeModal() {
  document.getElementById('modalOverlay').hidden = true;
  document.getElementById('caseForm').reset();
  clearErrors();
}

function clearErrors() {
  ['Name','Client','Status'].forEach(f => { document.getElementById('err' + f).textContent = ''; });
}

function populateForm(c) {
  document.getElementById('fieldId').value = c.id;
  document.getElementById('fieldName').value = c.name;
  document.getElementById('fieldClient').value = c.client;
  document.getElementById('fieldAmount').value = c.amount ?? '';
  document.getElementById('fieldStatus').value = c.status;
  document.getElementById('fieldPriority').value = c.priority || '中';
  document.getElementById('fieldAssignee').value = c.assignee || '';
  document.getElementById('fieldDueDate').value = c.dueDate || '';
  document.getElementById('fieldNote').value = c.note || '';
}

function readForm() {
  return {
    name:     document.getElementById('fieldName').value.trim(),
    client:   document.getElementById('fieldClient').value.trim(),
    amount:   document.getElementById('fieldAmount').value !== '' ? Number(document.getElementById('fieldAmount').value) : null,
    status:   document.getElementById('fieldStatus').value,
    priority: document.getElementById('fieldPriority').value || '中',
    assignee: document.getElementById('fieldAssignee').value.trim(),
    dueDate:  document.getElementById('fieldDueDate').value,
    note:     document.getElementById('fieldNote').value.trim(),
  };
}

function validate(data) {
  let ok = true;
  if (!data.name) { document.getElementById('errName').textContent = '案件名を入力してください'; ok = false; }
  if (!data.client) { document.getElementById('errClient').textContent = '顧客名を入力してください'; ok = false; }
  if (!data.status) { document.getElementById('errStatus').textContent = 'ステータスを選択してください'; ok = false; }
  return ok;
}

// ===== CRUD =====
window.openEdit = function(id) {
  const c = cases.find(x => x.id === id);
  if (!c) return;
  populateForm(c);
  openModal('案件編集');
};

function openAdd() {
  document.getElementById('fieldId').value = '';
  openModal('案件登録');
}

window.openConfirmDelete = function(id) {
  pendingDeleteId = id;
  const c = cases.find(x => x.id === id);
  document.getElementById('confirmMsg').textContent = `「${c?.name}」を削除してもよろしいですか？`;
  document.getElementById('confirmOverlay').hidden = false;
};

function doDelete() {
  cases = cases.filter(c => c.id !== pendingDeleteId);
  save(cases);
  render();
  document.getElementById('confirmOverlay').hidden = true;
}

// ===== Render all =====
function render() {
  renderKPI();
  renderTable();
}

// ===== Event Listeners =====
document.getElementById('btnAdd').addEventListener('click', openAdd);
document.getElementById('btnModalClose').addEventListener('click', closeModal);
document.getElementById('btnCancel').addEventListener('click', closeModal);

document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

document.getElementById('caseForm').addEventListener('submit', e => {
  e.preventDefault();
  clearErrors();
  const data = readForm();
  if (!validate(data)) return;

  const id = document.getElementById('fieldId').value;
  if (id) {
    const idx = cases.findIndex(c => c.id === Number(id));
    if (idx >= 0) cases[idx] = { ...cases[idx], ...data };
  } else {
    cases.push({ id: nextId++, createdAt: new Date().toISOString(), ...data });
  }

  save(cases);
  render();
  closeModal();
});

document.getElementById('searchInput').addEventListener('input', e => {
  searchText = e.target.value;
  render();
});
document.getElementById('filterStatus').addEventListener('change', e => {
  filterStatus = e.target.value;
  render();
});
document.getElementById('filterPriority').addEventListener('change', e => {
  filterPriority = e.target.value;
  render();
});
document.getElementById('btnReset').addEventListener('click', () => {
  searchText = '';
  filterStatus = '';
  filterPriority = '';
  document.getElementById('searchInput').value = '';
  document.getElementById('filterStatus').value = '';
  document.getElementById('filterPriority').value = '';
  render();
});

document.querySelectorAll('.table th[data-sort]').forEach(th => {
  th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (sortKey === key) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDir = 'asc';
    }
    render();
  });
});

document.getElementById('btnConfirmCancel').addEventListener('click', () => {
  document.getElementById('confirmOverlay').hidden = true;
});
document.getElementById('btnConfirmOk').addEventListener('click', doDelete);

document.getElementById('confirmOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) document.getElementById('confirmOverlay').hidden = true;
});

// ===== Init =====
render();
