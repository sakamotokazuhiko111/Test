'use strict';

// ===== Storage helpers =====
function loadKey(key, def) {
  try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; }
}
function saveKey(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// ===== State =====
let depts    = loadKey('pm_depts',    []);
let cases    = loadKey('pm_cases',    []);
let revenues = loadKey('pm_revenues', []);
let costs    = loadKey('pm_costs',    []);

let deptNextId = loadKey('pm_deptNextId', 1);
let caseNextId = loadKey('pm_caseNextId', 1);
let revNextId  = loadKey('pm_revNextId',  1);
let costNextId = loadKey('pm_costNextId', 1);

let currentTab = 'dashboard';

// Sort state per table
const sortState = {
  cases: { key: 'id', dir: 'desc' },
  rev:   { key: 'date', dir: 'desc' },
  cost:  { key: 'date', dir: 'desc' },
};

// Filter state
const F = {
  caseSearch: '', caseDept: '', caseStatus: '', casePriority: '',
  revDept: '', revCase: '', revMonth: '',
  costDept: '', costCase: '', costCat: '', costMonth: '',
  pnlDept: '', pnlYear: '', pnlView: 'dept',
};

// P&L expand state (department ids that are collapsed)
const collapsedDepts = new Set();

// Pending delete
let pendingDelete = null;

// ===== Seed demo data =====
if (depts.length === 0) {
  [
    { name: '営業部',           manager: '山田 太郎', note: '' },
    { name: '開発部',           manager: '中村 恵',   note: '' },
    { name: 'コンサルティング部', manager: '佐藤 賢一', note: '' },
  ].forEach(d => { depts.push({ id: deptNextId++, ...d }); });
  saveKey('pm_depts', depts);
  saveKey('pm_deptNextId', deptNextId);
}

if (cases.length === 0) {
  const d = depts;
  [
    { name: '基幹システム刷新', client: '株式会社サンプル', departmentId: d[1].id, plannedRevenue: 5000000, plannedCost: 2800000, status: '進行中', priority: '高', assignee: '田中 一郎', dueDate: '2026-06-30', note: '要件定義フェーズ' },
    { name: 'ECサイト構築',    client: '合同会社テスト',   departmentId: d[1].id, plannedRevenue: 1200000, plannedCost:  600000, status: '商談中', priority: '中', assignee: '佐藤 花子', dueDate: '2026-07-15', note: '' },
    { name: 'セキュリティ診断', client: '株式会社ABC',     departmentId: d[0].id, plannedRevenue:  800000, plannedCost:  320000, status: '新規',  priority: '高', assignee: '鈴木 次郎', dueDate: '2026-05-20', note: '見積送付済み' },
    { name: 'DX推進支援',      client: '株式会社XYZ',     departmentId: d[2].id, plannedRevenue: 3500000, plannedCost: 1500000, status: '完了',  priority: '中', assignee: '田中 一郎', dueDate: '2026-04-30', note: '検収完了' },
    { name: 'クラウド移行',    client: '有限会社デモ',    departmentId: d[2].id, plannedRevenue: 2200000, plannedCost: 1100000, status: '保留',  priority: '低', assignee: '高橋 三郎', dueDate: '2026-09-01', note: '予算確定待ち' },
    { name: 'AIチャットBot',   client: '株式会社フューチャー', departmentId: d[1].id, plannedRevenue: 4000000, plannedCost: 2200000, status: '進行中', priority: '高', assignee: '中村 恵', dueDate: '2026-08-31', note: '' },
  ].forEach(c => { cases.push({ id: caseNextId++, createdAt: new Date().toISOString(), ...c }); });
  saveKey('pm_cases', cases);
  saveKey('pm_caseNextId', caseNextId);
}

if (revenues.length === 0) {
  const entries = [
    { caseId: 1, date: '2026-03-15', amount: 1500000, note: '中間検収' },
    { caseId: 1, date: '2026-04-20', amount: 1000000, note: '追加分' },
    { caseId: 4, date: '2026-02-28', amount: 1500000, note: '前払い' },
    { caseId: 4, date: '2026-04-25', amount: 2000000, note: '最終検収' },
    { caseId: 2, date: '2026-04-10', amount:  600000, note: '着手金' },
    { caseId: 6, date: '2026-03-31', amount:  800000, note: '第1フェーズ' },
  ];
  entries.forEach(e => { revenues.push({ id: revNextId++, ...e }); });
  saveKey('pm_revenues', revenues);
  saveKey('pm_revNextId', revNextId);
}

if (costs.length === 0) {
  const entries = [
    { caseId: 1, category: '人件費', date: '2026-03-01', amount:  900000, note: '3月分工数' },
    { caseId: 1, category: '外注費', date: '2026-03-20', amount:  400000, note: 'UI制作' },
    { caseId: 1, category: '人件費', date: '2026-04-01', amount:  850000, note: '4月分工数' },
    { caseId: 4, category: '人件費', date: '2026-02-01', amount:  600000, note: 'コンサル工数' },
    { caseId: 4, category: '外注費', date: '2026-03-10', amount:  350000, note: '調査委託' },
    { caseId: 4, category: '経費',   date: '2026-04-01', amount:   50000, note: '交通費等' },
    { caseId: 2, category: '人件費', date: '2026-04-05', amount:  280000, note: '4月工数' },
    { caseId: 6, category: '人件費', date: '2026-03-01', amount:  500000, note: '開発工数' },
    { caseId: 6, category: '材料費', date: '2026-03-15', amount:  120000, note: 'APIライセンス' },
  ];
  entries.forEach(e => { costs.push({ id: costNextId++, ...e }); });
  saveKey('pm_costs', costs);
  saveKey('pm_costNextId', costNextId);
}

// ===== Helpers =====
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmtYen(n) {
  if (n == null || n === '') return '―';
  return Number(n).toLocaleString('ja-JP');
}
function fmtDate(s) {
  if (!s) return '―';
  const [y,m,d] = s.split('-');
  return `${y}/${m}/${d}`;
}
function isOverdue(dueDate, status) {
  if (!dueDate || ['完了','失注'].includes(status)) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}
function getDept(id) { return depts.find(d => d.id === id); }
function getCase(id) { return cases.find(c => c.id === id); }
function deptName(id) { return getDept(id)?.name ?? '未割当'; }
function statusBadge(s) { return `<span class="badge badge-${esc(s)}">${esc(s)}</span>`; }
function prioritySpan(p) { return `<span class="priority-${esc(p)}">${esc(p)}</span>`; }
function pctClass(r) { return r >= 30 ? 'pct-good' : r >= 10 ? 'pct-warn' : 'pct-bad'; }
function pnlClass(v) { return v >= 0 ? 'positive-num' : 'negative-num'; }

// ===== P&L Calculations =====
function calcPnL(caseId) {
  const rev  = revenues.filter(r => r.caseId === caseId).reduce((s,r) => s + Number(r.amount), 0);
  const cost = costs.filter(c => c.caseId === caseId).reduce((s,c) => s + Number(c.amount), 0);
  const gross = rev - cost;
  const margin = rev > 0 ? (gross / rev * 100) : null;
  return { rev, cost, gross, margin };
}

function calcDeptPnL(deptId) {
  const dCases = cases.filter(c => c.departmentId === deptId);
  let plannedRev = 0, plannedCost = 0, rev = 0, cost = 0;
  dCases.forEach(c => {
    plannedRev  += Number(c.plannedRevenue  ?? 0);
    plannedCost += Number(c.plannedCost ?? 0);
    const p = calcPnL(c.id);
    rev  += p.rev;
    cost += p.cost;
  });
  const gross  = rev - cost;
  const margin = rev > 0 ? (gross / rev * 100) : null;
  const achieve = plannedRev > 0 ? (rev / plannedRev * 100) : null;
  return { plannedRev, plannedCost, rev, cost, gross, margin, achieve, caseCount: dCases.length };
}

// ===== Tab Navigation =====
function showTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.hidden = true);
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab).hidden = false;
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  currentTab = tab;

  const addBtn = document.getElementById('btnHeaderAdd');
  const labels = { cases: '＋ 新規案件', revenue: '＋ 売上登録', cost: '＋ 原価登録', dept: '＋ 部署登録' };
  if (labels[tab]) { addBtn.textContent = labels[tab]; addBtn.hidden = false; }
  else { addBtn.hidden = true; }

  renderCurrentTab();
}

function renderCurrentTab() {
  if (currentTab === 'dashboard') renderDashboard();
  else if (currentTab === 'cases')   renderCases();
  else if (currentTab === 'revenue') { populateCaseSelects(); renderRevenue(); }
  else if (currentTab === 'cost')    { populateCaseSelects(); renderCost(); }
  else if (currentTab === 'pnl')     renderPnL();
  else if (currentTab === 'dept')    renderDepts();
}

// ===== Populate helpers =====
function populateDeptOptions(selectId, includeAll = false) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = includeAll ? '<option value="">すべての部署</option>' : '<option value="">未割当</option>';
  depts.forEach(d => { sel.innerHTML += `<option value="${d.id}">${esc(d.name)}</option>`; });
  sel.value = cur;
}

function populateCaseSelects() {
  ['revCase','costCase'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">すべての案件</option>';
    cases.forEach(c => { sel.innerHTML += `<option value="${c.id}">${esc(c.name)}</option>`; });
    sel.value = cur;
  });
  // dept filter selects in revenue/cost tabs
  ['revFiltDept','costFiltDept','caseFiltDept','pnlFiltDept'].forEach(id => populateDeptOptions(id, true));
}

function populatePnLYear() {
  const years = new Set();
  [...revenues, ...costs].forEach(e => { if (e.date) years.add(e.date.slice(0,4)); });
  const sel = document.getElementById('pnlFiltYear');
  const cur = sel.value;
  sel.innerHTML = '<option value="">全期間</option>';
  [...years].sort().reverse().forEach(y => { sel.innerHTML += `<option value="${y}">${y}年</option>`; });
  if (cur) sel.value = cur;
}

// ===== Dashboard =====
function renderDashboard() {
  const totalRev  = revenues.reduce((s,r) => s + Number(r.amount), 0);
  const totalCost = costs.reduce((s,c) => s + Number(c.amount), 0);
  const totalGross = totalRev - totalCost;
  const margin = totalRev > 0 ? totalGross / totalRev * 100 : null;
  const active = cases.filter(c => ['新規','進行中','商談中'].includes(c.status)).length;
  const plannedTotalRev = cases.reduce((s,c) => s + Number(c.plannedRevenue ?? 0), 0);

  document.getElementById('kpiGrid').innerHTML = [
    { label: '売上実績合計', value: fmtYen(totalRev), sub: '円' },
    { label: '原価実績合計', value: fmtYen(totalCost), sub: '円' },
    { label: '粗利合計',     value: fmtYen(totalGross), sub: '円', cls: totalGross >= 0 ? 'positive' : 'negative' },
    { label: '粗利率',       value: margin != null ? margin.toFixed(1) + '%' : '―', sub: '' },
    { label: '計画売上合計', value: fmtYen(plannedTotalRev), sub: '円' },
    { label: 'アクティブ案件', value: active, sub: '件' },
  ].map(k => `
    <div class="kpi-card">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value${k.cls ? ' ' + k.cls : ''}">${k.value}</div>
      <div class="kpi-sub">${k.sub}</div>
    </div>`).join('');

  // Dept PnL mini table
  const deptRows = depts.map(d => ({ d, p: calcDeptPnL(d.id) }))
    .sort((a,b) => b.p.gross - a.p.gross);
  document.getElementById('dashDeptPnl').innerHTML = `
    <table class="mini-table">
      <thead><tr><th>部署</th><th class="num">売上実績</th><th class="num">原価実績</th><th class="num">粗利</th><th class="num">粗利率</th></tr></thead>
      <tbody>${deptRows.map(({d,p}) => `<tr>
        <td>${esc(d.name)}</td>
        <td class="num">${fmtYen(p.rev)}</td>
        <td class="num">${fmtYen(p.cost)}</td>
        <td class="num ${pnlClass(p.gross)}">${fmtYen(p.gross)}</td>
        <td class="num ${p.margin != null ? pctClass(p.margin) : ''}">${p.margin != null ? p.margin.toFixed(1)+'%' : '―'}</td>
      </tr>`).join('')}</tbody>
    </table>`;

  // Top 5 projects by gross profit
  const topProjects = cases.map(c => ({ c, p: calcPnL(c.id) }))
    .filter(({p}) => p.rev > 0)
    .sort((a,b) => b.p.gross - a.p.gross)
    .slice(0, 5);
  document.getElementById('dashTopProjects').innerHTML = topProjects.length ? `
    <table class="mini-table">
      <thead><tr><th>案件名</th><th class="num">粗利</th><th class="num">粗利率</th></tr></thead>
      <tbody>${topProjects.map(({c,p}) => `<tr>
        <td>${esc(c.name)}</td>
        <td class="num ${pnlClass(p.gross)}">${fmtYen(p.gross)}</td>
        <td class="num ${p.margin != null ? pctClass(p.margin) : ''}">${p.margin != null ? p.margin.toFixed(1)+'%' : '―'}</td>
      </tr>`).join('')}</tbody>
    </table>` : '<div class="empty-state">データなし</div>';

  // Recent revenue
  const recentRev = [...revenues].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5);
  document.getElementById('dashRecentRevenue').innerHTML = recentRev.length ? `
    <table class="mini-table">
      <thead><tr><th>日付</th><th>案件</th><th class="num">金額</th></tr></thead>
      <tbody>${recentRev.map(r => `<tr>
        <td>${fmtDate(r.date)}</td>
        <td>${esc(getCase(r.caseId)?.name ?? '―')}</td>
        <td class="num">${fmtYen(r.amount)}</td>
      </tr>`).join('')}</tbody>
    </table>` : '<div class="empty-state">データなし</div>';

  // Recent cost
  const recentCost = [...costs].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5);
  document.getElementById('dashRecentCost').innerHTML = recentCost.length ? `
    <table class="mini-table">
      <thead><tr><th>日付</th><th>案件</th><th>カテゴリ</th><th class="num">金額</th></tr></thead>
      <tbody>${recentCost.map(c => `<tr>
        <td>${fmtDate(c.date)}</td>
        <td>${esc(getCase(c.caseId)?.name ?? '―')}</td>
        <td><span class="badge badge-cat">${esc(c.category)}</span></td>
        <td class="num">${fmtYen(c.amount)}</td>
      </tr>`).join('')}</tbody>
    </table>` : '<div class="empty-state">データなし</div>';
}

// ===== Cases =====
let caseSortKey = 'id', caseSortDir = 'desc';

function filteredCases() {
  return cases.filter(c => {
    if (F.caseDept   && String(c.departmentId) !== F.caseDept) return false;
    if (F.caseStatus && c.status !== F.caseStatus)             return false;
    if (F.casePriority && c.priority !== F.casePriority)       return false;
    if (F.caseSearch) {
      const q = F.caseSearch.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.client.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

function renderCases() {
  populateDeptOptions('caseFiltDept', true);
  const list = [...filteredCases()].sort((a,b) => {
    let av = caseSortKey === 'deptName' ? deptName(a.departmentId) : (a[caseSortKey] ?? '');
    let bv = caseSortKey === 'deptName' ? deptName(b.departmentId) : (b[caseSortKey] ?? '');
    if (['plannedRevenue','plannedCost','id'].includes(caseSortKey)) { av = Number(av); bv = Number(bv); }
    const cmp = String(av).localeCompare(String(bv), 'ja', { numeric: true });
    return caseSortDir === 'asc' ? cmp : -cmp;
  });

  const empty = document.getElementById('caseEmpty');
  const footer = document.getElementById('caseFooter');
  if (list.length === 0) {
    document.getElementById('caseTableBody').innerHTML = '';
    empty.hidden = false;
    footer.textContent = '';
    return;
  }
  empty.hidden = true;
  footer.textContent = `${list.length} 件表示 / 全 ${cases.length} 件`;

  document.getElementById('caseTableBody').innerHTML = list.map(c => {
    const over = isOverdue(c.dueDate, c.status);
    const plannedGross = (Number(c.plannedRevenue ?? 0)) - (Number(c.plannedCost ?? 0));
    return `<tr>
      <td>${c.id}</td>
      <td>${esc(deptName(c.departmentId))}</td>
      <td><strong>${esc(c.name)}</strong></td>
      <td>${esc(c.client)}</td>
      <td class="num">${fmtYen(c.plannedRevenue)}</td>
      <td class="num">${fmtYen(c.plannedCost)}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${prioritySpan(c.priority || '中')}</td>
      <td>${esc(c.assignee || '―')}</td>
      <td style="color:${over ? 'var(--color-danger)' : 'inherit'}">${fmtDate(c.dueDate)}${over ? ' ⚠' : ''}</td>
      <td>
        <button class="btn btn-icon" onclick="openCaseEdit(${c.id})" title="編集">✏️</button>
        <button class="btn btn-icon" onclick="openConfirm('case',${c.id},'${esc(c.name)}')" title="削除">🗑️</button>
      </td>
    </tr>`;
  }).join('');

  document.querySelectorAll('#caseTable th[data-sort]').forEach(th => {
    th.classList.remove('sort-asc','sort-desc');
    if (th.dataset.sort === caseSortKey) th.classList.add(caseSortDir === 'asc' ? 'sort-asc' : 'sort-desc');
  });
}

// ===== Revenue =====
let revSortKey = 'date', revSortDir = 'desc';

function enrichedRevenues() {
  return revenues.map(r => {
    const c = getCase(r.caseId);
    return { ...r, caseName: c?.name ?? '―', deptName: deptName(c?.departmentId) };
  });
}

function filteredRevenues() {
  return enrichedRevenues().filter(r => {
    if (F.revDept  && depts.find(d => d.id === Number(F.revDept))?.name !== r.deptName) return false;
    if (F.revCase  && String(r.caseId) !== F.revCase) return false;
    if (F.revMonth && !r.date.startsWith(F.revMonth)) return false;
    return true;
  });
}

function renderRevenue() {
  populateDeptOptions('revFiltDept', true);
  const caseOpts = document.getElementById('revFiltCase');
  if (caseOpts) {
    const cur = caseOpts.value;
    caseOpts.innerHTML = '<option value="">すべての案件</option>';
    cases.forEach(c => { caseOpts.innerHTML += `<option value="${c.id}">${esc(c.name)}</option>`; });
    caseOpts.value = cur;
  }

  const list = [...filteredRevenues()].sort((a,b) => {
    let av = a[revSortKey] ?? ''; let bv = b[revSortKey] ?? '';
    if (revSortKey === 'amount') { av = Number(av); bv = Number(bv); }
    const cmp = String(av).localeCompare(String(bv), 'ja', { numeric: true });
    return revSortDir === 'asc' ? cmp : -cmp;
  });

  const empty = document.getElementById('revEmpty');
  const footer = document.getElementById('revFooter');
  const tbody = document.getElementById('revTableBody');

  if (list.length === 0) { tbody.innerHTML = ''; empty.hidden = false; footer.textContent = ''; return; }
  empty.hidden = true;
  const total = list.reduce((s,r) => s + Number(r.amount), 0);
  footer.textContent = `${list.length} 件 / 合計 ${fmtYen(total)} 円`;

  tbody.innerHTML = list.map(r => `<tr>
    <td>${fmtDate(r.date)}</td>
    <td>${esc(r.deptName)}</td>
    <td>${esc(r.caseName)}</td>
    <td class="num">${fmtYen(r.amount)}</td>
    <td>${esc(r.note || '―')}</td>
    <td>
      <button class="btn btn-icon" onclick="openRevEdit(${r.id})" title="編集">✏️</button>
      <button class="btn btn-icon" onclick="openConfirm('rev',${r.id},'${esc(r.date)} の売上')" title="削除">🗑️</button>
    </td>
  </tr>`).join('');

  document.querySelectorAll('[data-table="rev"]').forEach(th => {
    th.classList.remove('sort-asc','sort-desc');
    if (th.dataset.sort === revSortKey) th.classList.add(revSortDir === 'asc' ? 'sort-asc' : 'sort-desc');
  });
}

// ===== Cost =====
let costSortKey = 'date', costSortDir = 'desc';

function enrichedCosts() {
  return costs.map(c => {
    const cs = getCase(c.caseId);
    return { ...c, caseName: cs?.name ?? '―', deptName: deptName(cs?.departmentId) };
  });
}

function filteredCosts() {
  return enrichedCosts().filter(c => {
    if (F.costDept && depts.find(d => d.id === Number(F.costDept))?.name !== c.deptName) return false;
    if (F.costCase && String(c.caseId) !== F.costCase) return false;
    if (F.costCat  && c.category !== F.costCat) return false;
    if (F.costMonth && !c.date.startsWith(F.costMonth)) return false;
    return true;
  });
}

function renderCost() {
  populateDeptOptions('costFiltDept', true);
  const caseOpts = document.getElementById('costFiltCase');
  if (caseOpts) {
    const cur = caseOpts.value;
    caseOpts.innerHTML = '<option value="">すべての案件</option>';
    cases.forEach(c => { caseOpts.innerHTML += `<option value="${c.id}">${esc(c.name)}</option>`; });
    caseOpts.value = cur;
  }

  const list = [...filteredCosts()].sort((a,b) => {
    let av = a[costSortKey] ?? ''; let bv = b[costSortKey] ?? '';
    if (costSortKey === 'amount') { av = Number(av); bv = Number(bv); }
    const cmp = String(av).localeCompare(String(bv), 'ja', { numeric: true });
    return costSortDir === 'asc' ? cmp : -cmp;
  });

  const empty = document.getElementById('costEmpty');
  const footer = document.getElementById('costFooter');
  const tbody = document.getElementById('costTableBody');

  if (list.length === 0) { tbody.innerHTML = ''; empty.hidden = false; footer.textContent = ''; return; }
  empty.hidden = true;
  const total = list.reduce((s,c) => s + Number(c.amount), 0);
  footer.textContent = `${list.length} 件 / 合計 ${fmtYen(total)} 円`;

  tbody.innerHTML = list.map(c => `<tr>
    <td>${fmtDate(c.date)}</td>
    <td>${esc(c.deptName)}</td>
    <td>${esc(c.caseName)}</td>
    <td><span class="badge badge-cat">${esc(c.category)}</span></td>
    <td class="num">${fmtYen(c.amount)}</td>
    <td>${esc(c.note || '―')}</td>
    <td>
      <button class="btn btn-icon" onclick="openCostEdit(${c.id})" title="編集">✏️</button>
      <button class="btn btn-icon" onclick="openConfirm('cost',${c.id},'${esc(c.date)} の原価')" title="削除">🗑️</button>
    </td>
  </tr>`).join('');

  document.querySelectorAll('[data-table="cost"]').forEach(th => {
    th.classList.remove('sort-asc','sort-desc');
    if (th.dataset.sort === costSortKey) th.classList.add(costSortDir === 'asc' ? 'sort-asc' : 'sort-desc');
  });
}

// ===== P&L =====
function filterRevCost(caseId) {
  const yr = F.pnlYear;
  const revTotal  = revenues.filter(r => r.caseId === caseId && (!yr || r.date.startsWith(yr))).reduce((s,r) => s + Number(r.amount), 0);
  const costTotal = costs.filter(c => c.caseId === caseId && (!yr || c.date.startsWith(yr))).reduce((s,c) => s + Number(c.amount), 0);
  return { rev: revTotal, cost: costTotal };
}

function renderPnL() {
  populateDeptOptions('pnlFiltDept', true);
  populatePnLYear();

  const filtDeptId = F.pnlDept ? Number(F.pnlDept) : null;
  const targetDepts = filtDeptId ? depts.filter(d => d.id === filtDeptId) : depts;

  const tbody = document.getElementById('pnlTableBody');
  const tfoot = document.getElementById('pnlTableFoot');
  const empty = document.getElementById('pnlEmpty');

  let grandPRev = 0, grandPCost = 0, grandRev = 0, grandCost = 0;
  let rows = '';

  if (F.pnlView === 'project') {
    // Flat project view
    const caseList = filtDeptId ? cases.filter(c => c.departmentId === filtDeptId) : cases;
    if (caseList.length === 0) { tbody.innerHTML = ''; tfoot.innerHTML = ''; empty.hidden = false; return; }
    empty.hidden = true;

    rows = caseList.map(c => {
      const { rev, cost } = filterRevCost(c.id);
      const pRev = Number(c.plannedRevenue ?? 0);
      const pCost = Number(c.plannedCost ?? 0);
      const gross = rev - cost;
      const margin = rev > 0 ? gross / rev * 100 : null;
      const achieve = pRev > 0 ? rev / pRev * 100 : null;
      grandPRev += pRev; grandPCost += pCost; grandRev += rev; grandCost += cost;
      return `<tr>
        <td>${esc(deptName(c.departmentId))} / ${esc(c.name)}</td>
        <td class="num">${fmtYen(pRev)}</td>
        <td class="num">${fmtYen(rev)}</td>
        <td class="num ${achieve != null ? pctClass(achieve) : ''}">${achieve != null ? achieve.toFixed(1)+'%' : '―'}</td>
        <td class="num">${fmtYen(pCost)}</td>
        <td class="num">${fmtYen(cost)}</td>
        <td class="num ${pnlClass(gross)}">${fmtYen(gross)}</td>
        <td class="num ${margin != null ? pctClass(margin) : ''}">${margin != null ? margin.toFixed(1)+'%' : '―'}</td>
      </tr>`;
    }).join('');
  } else {
    // Dept grouped view
    if (targetDepts.length === 0) { tbody.innerHTML = ''; tfoot.innerHTML = ''; empty.hidden = false; return; }
    empty.hidden = true;

    rows = targetDepts.map(dept => {
      const dCases = cases.filter(c => c.departmentId === dept.id);
      let dPRev = 0, dPCost = 0, dRev = 0, dCost = 0;
      const caseRows = dCases.map(c => {
        const { rev, cost } = filterRevCost(c.id);
        const pRev = Number(c.plannedRevenue ?? 0);
        const pCost = Number(c.plannedCost ?? 0);
        dPRev += pRev; dPCost += pCost; dRev += rev; dCost += cost;
        const gross = rev - cost;
        const margin = rev > 0 ? gross / rev * 100 : null;
        const achieve = pRev > 0 ? rev / pRev * 100 : null;
        return `<tr class="case-row" data-dept="${dept.id}" ${collapsedDepts.has(dept.id) ? 'hidden' : ''}>
          <td>└ ${esc(c.name)}</td>
          <td class="num">${fmtYen(pRev)}</td>
          <td class="num">${fmtYen(rev)}</td>
          <td class="num ${achieve != null ? pctClass(achieve) : ''}">${achieve != null ? achieve.toFixed(1)+'%' : '―'}</td>
          <td class="num">${fmtYen(pCost)}</td>
          <td class="num">${fmtYen(cost)}</td>
          <td class="num ${pnlClass(gross)}">${fmtYen(gross)}</td>
          <td class="num ${margin != null ? pctClass(margin) : ''}">${margin != null ? margin.toFixed(1)+'%' : '―'}</td>
        </tr>`;
      }).join('');

      grandPRev += dPRev; grandPCost += dPCost; grandRev += dRev; grandCost += dCost;
      const dGross = dRev - dCost;
      const dMargin = dRev > 0 ? dGross / dRev * 100 : null;
      const dAchieve = dPRev > 0 ? dRev / dPRev * 100 : null;
      const arrow = collapsedDepts.has(dept.id) ? '▶' : '▼';

      return `<tr class="group-row" onclick="toggleDept(${dept.id})">
        <td>${arrow} ${esc(dept.name)}（${dCases.length}件）</td>
        <td class="num">${fmtYen(dPRev)}</td>
        <td class="num">${fmtYen(dRev)}</td>
        <td class="num ${dAchieve != null ? pctClass(dAchieve) : ''}">${dAchieve != null ? dAchieve.toFixed(1)+'%' : '―'}</td>
        <td class="num">${fmtYen(dPCost)}</td>
        <td class="num">${fmtYen(dCost)}</td>
        <td class="num ${pnlClass(dGross)}">${fmtYen(dGross)}</td>
        <td class="num ${dMargin != null ? pctClass(dMargin) : ''}">${dMargin != null ? dMargin.toFixed(1)+'%' : '―'}</td>
      </tr>${caseRows}`;
    }).join('');
  }

  tbody.innerHTML = rows;
  const grandGross = grandRev - grandCost;
  const grandMargin = grandRev > 0 ? grandGross / grandRev * 100 : null;
  const grandAchieve = grandPRev > 0 ? grandRev / grandPRev * 100 : null;
  tfoot.innerHTML = `<tr>
    <td>合計</td>
    <td class="num">${fmtYen(grandPRev)}</td>
    <td class="num">${fmtYen(grandRev)}</td>
    <td class="num ${grandAchieve != null ? pctClass(grandAchieve) : ''}">${grandAchieve != null ? grandAchieve.toFixed(1)+'%' : '―'}</td>
    <td class="num">${fmtYen(grandPCost)}</td>
    <td class="num">${fmtYen(grandCost)}</td>
    <td class="num ${pnlClass(grandGross)}">${fmtYen(grandGross)}</td>
    <td class="num ${grandMargin != null ? pctClass(grandMargin) : ''}">${grandMargin != null ? grandMargin.toFixed(1)+'%' : '―'}</td>
  </tr>`;
}

window.toggleDept = function(deptId) {
  if (collapsedDepts.has(deptId)) collapsedDepts.delete(deptId);
  else collapsedDepts.add(deptId);
  renderPnL();
};

// ===== Depts =====
function renderDepts() {
  const tbody = document.getElementById('deptTableBody');
  const empty = document.getElementById('deptEmpty');
  if (depts.length === 0) { tbody.innerHTML = ''; empty.hidden = false; return; }
  empty.hidden = true;
  tbody.innerHTML = depts.map(d => {
    const caseCount = cases.filter(c => c.departmentId === d.id).length;
    return `<tr>
      <td>${d.id}</td>
      <td><strong>${esc(d.name)}</strong></td>
      <td>${esc(d.manager || '―')}</td>
      <td>${caseCount} 件</td>
      <td>${esc(d.note || '―')}</td>
      <td>
        <button class="btn btn-icon" onclick="openDeptEdit(${d.id})" title="編集">✏️</button>
        <button class="btn btn-icon" onclick="openConfirm('dept',${d.id},'${esc(d.name)}')" title="削除">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

// ===== Modal helpers =====
function openModal(id) { document.getElementById(id).hidden = false; }
function closeModal(id) { document.getElementById(id).hidden = true; }

function clearErrors(...ids) {
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });
}

// ===== Case CRUD =====
function openCaseAdd() {
  document.getElementById('caseId').value = '';
  document.getElementById('caseForm').reset();
  clearErrors('errCaseName','errCaseClient','errCaseStatus');
  populateDeptOptions('caseDept', false);
  document.getElementById('caseModalTitle').textContent = '案件登録';
  openModal('caseModalOverlay');
}
window.openCaseEdit = function(id) {
  const c = cases.find(x => x.id === id);
  if (!c) return;
  clearErrors('errCaseName','errCaseClient','errCaseStatus');
  populateDeptOptions('caseDept', false);
  document.getElementById('caseId').value = c.id;
  document.getElementById('caseName').value = c.name;
  document.getElementById('caseClient').value = c.client;
  document.getElementById('caseDept').value = c.departmentId ?? '';
  document.getElementById('caseRevenue').value = c.plannedRevenue ?? '';
  document.getElementById('casePlannedCost').value = c.plannedCost ?? '';
  document.getElementById('caseStatus').value = c.status;
  document.getElementById('casePriority').value = c.priority || '中';
  document.getElementById('caseAssignee').value = c.assignee || '';
  document.getElementById('caseDue').value = c.dueDate || '';
  document.getElementById('caseNote').value = c.note || '';
  document.getElementById('caseModalTitle').textContent = '案件編集';
  openModal('caseModalOverlay');
};

document.getElementById('caseForm').addEventListener('submit', e => {
  e.preventDefault();
  clearErrors('errCaseName','errCaseClient','errCaseStatus');
  const name   = document.getElementById('caseName').value.trim();
  const client = document.getElementById('caseClient').value.trim();
  const status = document.getElementById('caseStatus').value;
  let ok = true;
  if (!name)   { document.getElementById('errCaseName').textContent = '案件名を入力してください'; ok = false; }
  if (!client) { document.getElementById('errCaseClient').textContent = '顧客名を入力してください'; ok = false; }
  if (!status) { document.getElementById('errCaseStatus').textContent = 'ステータスを選択してください'; ok = false; }
  if (!ok) return;

  const data = {
    name, client,
    departmentId: document.getElementById('caseDept').value ? Number(document.getElementById('caseDept').value) : null,
    plannedRevenue: document.getElementById('caseRevenue').value !== '' ? Number(document.getElementById('caseRevenue').value) : null,
    plannedCost: document.getElementById('casePlannedCost').value !== '' ? Number(document.getElementById('casePlannedCost').value) : null,
    status, priority: document.getElementById('casePriority').value,
    assignee: document.getElementById('caseAssignee').value.trim(),
    dueDate:  document.getElementById('caseDue').value,
    note:     document.getElementById('caseNote').value.trim(),
  };
  const id = document.getElementById('caseId').value;
  if (id) {
    const idx = cases.findIndex(c => c.id === Number(id));
    if (idx >= 0) cases[idx] = { ...cases[idx], ...data };
  } else {
    cases.push({ id: caseNextId++, createdAt: new Date().toISOString(), ...data });
    saveKey('pm_caseNextId', caseNextId);
  }
  saveKey('pm_cases', cases);
  closeModal('caseModalOverlay');
  renderCurrentTab();
});

// ===== Revenue CRUD =====
function openRevAdd() {
  document.getElementById('revId').value = '';
  document.getElementById('revForm').reset();
  clearErrors('errRevCase','errRevDate','errRevAmount');
  const sel = document.getElementById('revCase');
  sel.innerHTML = '<option value="">選択してください</option>';
  cases.forEach(c => { sel.innerHTML += `<option value="${c.id}">${esc(c.name)}</option>`; });
  document.getElementById('revModalTitle').textContent = '売上登録';
  openModal('revModalOverlay');
}
window.openRevEdit = function(id) {
  const r = revenues.find(x => x.id === id);
  if (!r) return;
  clearErrors('errRevCase','errRevDate','errRevAmount');
  const sel = document.getElementById('revCase');
  sel.innerHTML = '<option value="">選択してください</option>';
  cases.forEach(c => { sel.innerHTML += `<option value="${c.id}">${esc(c.name)}</option>`; });
  document.getElementById('revId').value = r.id;
  document.getElementById('revCase').value = r.caseId;
  document.getElementById('revDate').value = r.date;
  document.getElementById('revAmount').value = r.amount;
  document.getElementById('revNote').value = r.note || '';
  document.getElementById('revModalTitle').textContent = '売上編集';
  openModal('revModalOverlay');
};

document.getElementById('revForm').addEventListener('submit', e => {
  e.preventDefault();
  clearErrors('errRevCase','errRevDate','errRevAmount');
  const caseId = document.getElementById('revCase').value;
  const date   = document.getElementById('revDate').value;
  const amount = document.getElementById('revAmount').value;
  let ok = true;
  if (!caseId) { document.getElementById('errRevCase').textContent = '案件を選択してください'; ok = false; }
  if (!date)   { document.getElementById('errRevDate').textContent = '日付を入力してください'; ok = false; }
  if (!amount) { document.getElementById('errRevAmount').textContent = '金額を入力してください'; ok = false; }
  if (!ok) return;

  const data = { caseId: Number(caseId), date, amount: Number(amount), note: document.getElementById('revNote').value.trim() };
  const id = document.getElementById('revId').value;
  if (id) {
    const idx = revenues.findIndex(r => r.id === Number(id));
    if (idx >= 0) revenues[idx] = { ...revenues[idx], ...data };
  } else {
    revenues.push({ id: revNextId++, ...data });
    saveKey('pm_revNextId', revNextId);
  }
  saveKey('pm_revenues', revenues);
  closeModal('revModalOverlay');
  renderCurrentTab();
});

// ===== Cost CRUD =====
function openCostAdd() {
  document.getElementById('costId').value = '';
  document.getElementById('costForm').reset();
  clearErrors('errCostCase','errCostCat','errCostDate','errCostAmount');
  const sel = document.getElementById('costCase');
  sel.innerHTML = '<option value="">選択してください</option>';
  cases.forEach(c => { sel.innerHTML += `<option value="${c.id}">${esc(c.name)}</option>`; });
  document.getElementById('costModalTitle').textContent = '原価登録';
  openModal('costModalOverlay');
}
window.openCostEdit = function(id) {
  const c = costs.find(x => x.id === id);
  if (!c) return;
  clearErrors('errCostCase','errCostCat','errCostDate','errCostAmount');
  const sel = document.getElementById('costCase');
  sel.innerHTML = '<option value="">選択してください</option>';
  cases.forEach(cs => { sel.innerHTML += `<option value="${cs.id}">${esc(cs.name)}</option>`; });
  document.getElementById('costId').value = c.id;
  document.getElementById('costCase').value = c.caseId;
  document.getElementById('costCat').value = c.category;
  document.getElementById('costDate').value = c.date;
  document.getElementById('costAmount').value = c.amount;
  document.getElementById('costNote').value = c.note || '';
  document.getElementById('costModalTitle').textContent = '原価編集';
  openModal('costModalOverlay');
};

document.getElementById('costForm').addEventListener('submit', e => {
  e.preventDefault();
  clearErrors('errCostCase','errCostCat','errCostDate','errCostAmount');
  const caseId   = document.getElementById('costCase').value;
  const category = document.getElementById('costCat').value;
  const date     = document.getElementById('costDate').value;
  const amount   = document.getElementById('costAmount').value;
  let ok = true;
  if (!caseId)   { document.getElementById('errCostCase').textContent = '案件を選択してください'; ok = false; }
  if (!category) { document.getElementById('errCostCat').textContent = 'カテゴリを選択してください'; ok = false; }
  if (!date)     { document.getElementById('errCostDate').textContent = '日付を入力してください'; ok = false; }
  if (!amount)   { document.getElementById('errCostAmount').textContent = '金額を入力してください'; ok = false; }
  if (!ok) return;

  const data = { caseId: Number(caseId), category, date, amount: Number(amount), note: document.getElementById('costNote').value.trim() };
  const id = document.getElementById('costId').value;
  if (id) {
    const idx = costs.findIndex(c => c.id === Number(id));
    if (idx >= 0) costs[idx] = { ...costs[idx], ...data };
  } else {
    costs.push({ id: costNextId++, ...data });
    saveKey('pm_costNextId', costNextId);
  }
  saveKey('pm_costs', costs);
  closeModal('costModalOverlay');
  renderCurrentTab();
});

// ===== Dept CRUD =====
function openDeptAdd() {
  document.getElementById('deptId').value = '';
  document.getElementById('deptForm').reset();
  clearErrors('errDeptName');
  document.getElementById('deptModalTitle').textContent = '部署登録';
  openModal('deptModalOverlay');
}
window.openDeptEdit = function(id) {
  const d = depts.find(x => x.id === id);
  if (!d) return;
  clearErrors('errDeptName');
  document.getElementById('deptId').value = d.id;
  document.getElementById('deptName').value = d.name;
  document.getElementById('deptManager').value = d.manager || '';
  document.getElementById('deptNote').value = d.note || '';
  document.getElementById('deptModalTitle').textContent = '部署編集';
  openModal('deptModalOverlay');
};

document.getElementById('deptForm').addEventListener('submit', e => {
  e.preventDefault();
  clearErrors('errDeptName');
  const name = document.getElementById('deptName').value.trim();
  if (!name) { document.getElementById('errDeptName').textContent = '部署名を入力してください'; return; }
  const data = { name, manager: document.getElementById('deptManager').value.trim(), note: document.getElementById('deptNote').value.trim() };
  const id = document.getElementById('deptId').value;
  if (id) {
    const idx = depts.findIndex(d => d.id === Number(id));
    if (idx >= 0) depts[idx] = { ...depts[idx], ...data };
  } else {
    depts.push({ id: deptNextId++, ...data });
    saveKey('pm_deptNextId', deptNextId);
  }
  saveKey('pm_depts', depts);
  closeModal('deptModalOverlay');
  renderDepts();
});

// ===== Confirm Delete =====
window.openConfirm = function(type, id, label) {
  pendingDelete = { type, id };
  document.getElementById('confirmMsg').textContent = `「${label}」を削除してもよろしいですか？`;
  openModal('confirmOverlay');
};
document.getElementById('confirmOk').addEventListener('click', () => {
  if (!pendingDelete) return;
  const { type, id } = pendingDelete;
  if (type === 'case')  { cases    = cases.filter(c => c.id !== id);    saveKey('pm_cases', cases); }
  if (type === 'rev')   { revenues = revenues.filter(r => r.id !== id); saveKey('pm_revenues', revenues); }
  if (type === 'cost')  { costs    = costs.filter(c => c.id !== id);    saveKey('pm_costs', costs); }
  if (type === 'dept')  { depts    = depts.filter(d => d.id !== id);    saveKey('pm_depts', depts); }
  pendingDelete = null;
  closeModal('confirmOverlay');
  renderCurrentTab();
});
document.getElementById('confirmCancel').addEventListener('click', () => closeModal('confirmOverlay'));

// ===== Header + button =====
document.getElementById('btnHeaderAdd').addEventListener('click', () => {
  if (currentTab === 'cases')   openCaseAdd();
  else if (currentTab === 'revenue') openRevAdd();
  else if (currentTab === 'cost')    openCostAdd();
  else if (currentTab === 'dept')    openDeptAdd();
});

// ===== Nav =====
document.querySelectorAll('.nav-tab').forEach(btn => {
  btn.addEventListener('click', () => showTab(btn.dataset.tab));
});

// ===== Close buttons =====
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});
['caseModalOverlay','revModalOverlay','costModalOverlay','deptModalOverlay','confirmOverlay'].forEach(id => {
  document.getElementById(id).addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(id); });
});

// ===== Case table sort =====
document.querySelectorAll('#caseTable th[data-sort]').forEach(th => {
  th.addEventListener('click', () => {
    const k = th.dataset.sort;
    if (caseSortKey === k) caseSortDir = caseSortDir === 'asc' ? 'desc' : 'asc';
    else { caseSortKey = k; caseSortDir = 'asc'; }
    renderCases();
  });
});

// ===== Revenue sort =====
document.querySelectorAll('[data-table="rev"]').forEach(th => {
  th.addEventListener('click', () => {
    const k = th.dataset.sort;
    if (revSortKey === k) revSortDir = revSortDir === 'asc' ? 'desc' : 'asc';
    else { revSortKey = k; revSortDir = 'asc'; }
    renderRevenue();
  });
});

// ===== Cost sort =====
document.querySelectorAll('[data-table="cost"]').forEach(th => {
  th.addEventListener('click', () => {
    const k = th.dataset.sort;
    if (costSortKey === k) costSortDir = costSortDir === 'asc' ? 'desc' : 'asc';
    else { costSortKey = k; costSortDir = 'asc'; }
    renderCost();
  });
});

// ===== Case filters =====
document.getElementById('caseSearch').addEventListener('input', e => { F.caseSearch = e.target.value; renderCases(); });
document.getElementById('caseFiltDept').addEventListener('change', e => { F.caseDept = e.target.value; renderCases(); });
document.getElementById('caseFiltStatus').addEventListener('change', e => { F.caseStatus = e.target.value; renderCases(); });
document.getElementById('caseFiltPriority').addEventListener('change', e => { F.casePriority = e.target.value; renderCases(); });
document.getElementById('caseResetBtn').addEventListener('click', () => {
  F.caseSearch = ''; F.caseDept = ''; F.caseStatus = ''; F.casePriority = '';
  ['caseSearch','caseFiltDept','caseFiltStatus','caseFiltPriority'].forEach(id => { document.getElementById(id).value = ''; });
  renderCases();
});

// ===== Revenue filters =====
document.getElementById('revFiltDept').addEventListener('change', e => { F.revDept = e.target.value; renderRevenue(); });
document.getElementById('revFiltCase').addEventListener('change', e => { F.revCase = e.target.value; renderRevenue(); });
document.getElementById('revFiltMonth').addEventListener('change', e => { F.revMonth = e.target.value; renderRevenue(); });
document.getElementById('revResetBtn').addEventListener('click', () => {
  F.revDept = ''; F.revCase = ''; F.revMonth = '';
  ['revFiltDept','revFiltCase','revFiltMonth'].forEach(id => { document.getElementById(id).value = ''; });
  renderRevenue();
});

// ===== Cost filters =====
document.getElementById('costFiltDept').addEventListener('change', e => { F.costDept = e.target.value; renderCost(); });
document.getElementById('costFiltCase').addEventListener('change', e => { F.costCase = e.target.value; renderCost(); });
document.getElementById('costFiltCat').addEventListener('change', e => { F.costCat = e.target.value; renderCost(); });
document.getElementById('costFiltMonth').addEventListener('change', e => { F.costMonth = e.target.value; renderCost(); });
document.getElementById('costResetBtn').addEventListener('click', () => {
  F.costDept = ''; F.costCase = ''; F.costCat = ''; F.costMonth = '';
  ['costFiltDept','costFiltCase','costFiltCat','costFiltMonth'].forEach(id => { document.getElementById(id).value = ''; });
  renderCost();
});

// ===== P&L filters =====
document.getElementById('pnlFiltDept').addEventListener('change', e => { F.pnlDept = e.target.value; renderPnL(); });
document.getElementById('pnlFiltYear').addEventListener('change', e => { F.pnlYear = e.target.value; renderPnL(); });
document.getElementById('pnlView').addEventListener('change', e => { F.pnlView = e.target.value; renderPnL(); });

// ===== Init =====
showTab('dashboard');
