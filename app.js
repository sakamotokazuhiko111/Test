'use strict';

// ===== Storage =====
function loadKey(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }
function saveKey(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

// ===== Data =====
let customers     = loadKey('pm_customers',  []);
let prospects     = loadKey('pm_prospects',  []);
let orders        = loadKey('pm_orders',     []);
let annualTargets = loadKey('pm_targets',    []);
let depts         = loadKey('pm_depts',      []);
let cases         = loadKey('pm_cases',      []);
let revenues      = loadKey('pm_revenues',   []);
let costs         = loadKey('pm_costs',      []);

let custNextId    = loadKey('pm_custNextId',   1);
let prospNextId   = loadKey('pm_prospNextId',  1);
let orderNextId   = loadKey('pm_orderNextId',  1);
let targetNextId  = loadKey('pm_targetNextId', 1);
let deptNextId    = loadKey('pm_deptNextId',   1);
let caseNextId    = loadKey('pm_caseNextId',   1);
let revNextId     = loadKey('pm_revNextId',    1);
let costNextId    = loadKey('pm_costNextId',   1);

let currentTab = 'dashboard';
const collapsedDepts = new Set();
let pendingDelete = null;

// Sort state
let caseSortKey = 'id', caseSortDir = 'desc';
let revSortKey  = 'date', revSortDir = 'desc';
let costSortKey = 'date', costSortDir = 'desc';

// Filter state
const F = {
  custSearch: '', custIndustry: '',
  prospDept: '', prospStage: '', prospAssignee: '',
  orderDept: '', orderMonth: '', orderStatus: '',
  caseSearch: '', caseDept: '', caseStatus: '', casePriority: '',
  revDept: '', revCase: '', revMonth: '',
  costDept: '', costCase: '', costCat: '', costMonth: '',
  pnlDept: '', pnlYear: '', pnlView: 'dept',
  targetYear: '',
};

// ===== Seed data =====
if (depts.length === 0) {
  [{ name: '営業部', manager: '山田 太郎', note: '' },
   { name: '開発部', manager: '中村 恵', note: '' },
   { name: 'コンサルティング部', manager: '佐藤 賢一', note: '' }]
    .forEach(d => depts.push({ id: deptNextId++, ...d }));
  saveKey('pm_depts', depts); saveKey('pm_deptNextId', deptNextId);
}

if (customers.length === 0) {
  [{ name: '株式会社サンプル',       industry: 'IT',     contact: '高橋 勇', tel: '03-1234-5678', email: 'takahashi@sample.co.jp' },
   { name: '合同会社テスト',         industry: '製造',   contact: '林 美子',  tel: '06-2345-6789', email: 'hayashi@test.co.jp' },
   { name: '株式会社ABC',            industry: '金融',   contact: '渡辺 健',  tel: '03-3456-7890', email: 'watanabe@abc.co.jp' },
   { name: '株式会社XYZ',            industry: '流通',   contact: '小林 愛',  tel: '052-4567-8901', email: 'kobayashi@xyz.co.jp' },
   { name: '有限会社デモ',           industry: 'サービス', contact: '加藤 誠', tel: '011-5678-9012', email: 'kato@demo.co.jp' },
   { name: '株式会社フューチャー',   industry: 'IT',     contact: '吉田 翼',  tel: '03-6789-0123', email: 'yoshida@future.co.jp' }]
    .forEach(c => customers.push({ id: custNextId++, createdAt: new Date().toISOString(), note: '', ...c }));
  saveKey('pm_customers', customers); saveKey('pm_custNextId', custNextId);
}

if (orders.length === 0) {
  const [d1, d2, d3] = depts;
  const [c1, c2, c3, c4, c5, c6] = customers;
  [{ customerId: c1.id, departmentId: d2.id, name: '基幹システム刷新',  orderDate: '2026-03-01', revenue: 5000000, expectedCost: 2800000, deliveryDate: '2026-09-30', assignee: '田中 一郎', note: '' },
   { customerId: c4.id, departmentId: d3.id, name: 'DX推進支援',        orderDate: '2026-01-15', revenue: 3500000, expectedCost: 1500000, deliveryDate: '2026-04-30', assignee: '佐藤 賢一', note: '' }]
    .forEach(o => orders.push({ id: orderNextId++, prospectId: null, caseId: null, createdAt: new Date().toISOString(), ...o }));
  saveKey('pm_orders', orders); saveKey('pm_orderNextId', orderNextId);
}

if (cases.length === 0) {
  const [d1, d2, d3] = depts;
  [{ name: '基幹システム刷新',  client: '株式会社サンプル',   departmentId: d2.id, plannedRevenue: 5000000, plannedCost: 2800000, status: '進行中', priority: '高', assignee: '田中 一郎', dueDate: '2026-06-30', note: '要件定義フェーズ', orderId: orders[0]?.id ?? null },
   { name: 'ECサイト構築',      client: '合同会社テスト',     departmentId: d2.id, plannedRevenue: 1200000, plannedCost:  600000, status: '商談中', priority: '中', assignee: '佐藤 花子', dueDate: '2026-07-15', note: '', orderId: null },
   { name: 'セキュリティ診断',  client: '株式会社ABC',        departmentId: d1.id, plannedRevenue:  800000, plannedCost:  320000, status: '新規',  priority: '高', assignee: '鈴木 次郎', dueDate: '2026-05-20', note: '見積送付済み', orderId: null },
   { name: 'DX推進支援',        client: '株式会社XYZ',        departmentId: d3.id, plannedRevenue: 3500000, plannedCost: 1500000, status: '完了',  priority: '中', assignee: '田中 一郎', dueDate: '2026-04-30', note: '検収完了', orderId: orders[1]?.id ?? null },
   { name: 'クラウド移行',      client: '有限会社デモ',       departmentId: d3.id, plannedRevenue: 2200000, plannedCost: 1100000, status: '保留',  priority: '低', assignee: '高橋 三郎', dueDate: '2026-09-01', note: '予算確定待ち', orderId: null },
   { name: 'AIチャットBot',     client: '株式会社フューチャー', departmentId: d2.id, plannedRevenue: 4000000, plannedCost: 2200000, status: '進行中', priority: '高', assignee: '中村 恵',  dueDate: '2026-08-31', note: '', orderId: null }]
    .forEach(c => cases.push({ id: caseNextId++, createdAt: new Date().toISOString(), ...c }));
  // Link orders → cases
  if (orders[0]) { orders[0].caseId = cases[0].id; }
  if (orders[1]) { orders[1].caseId = cases[3].id; }
  saveKey('pm_cases', cases); saveKey('pm_caseNextId', caseNextId);
  saveKey('pm_orders', orders);
}

if (prospects.length === 0) {
  const [d1, d2, d3] = depts;
  const [c1, c2, c3, c4, c5, c6] = customers;
  [{ customerId: c1.id, departmentId: d2.id, name: '新ERPシステム導入',   stage: '交渉',        probability: 70, expectedRevenue: 8000000, expectedCost: 4000000, assignee: '田中 一郎', expectedDate: '2026-06-30', note: '最終提案済み', orderId: null },
   { customerId: c2.id, departmentId: d2.id, name: 'Webリニューアル',     stage: '見積',        probability: 50, expectedRevenue: 1500000, expectedCost:  700000, assignee: '佐藤 花子', expectedDate: '2026-07-31', note: '', orderId: null },
   { customerId: c6.id, departmentId: d2.id, name: 'AIデータ分析基盤',   stage: '提案',        probability: 30, expectedRevenue: 6000000, expectedCost: 3200000, assignee: '中村 恵',  expectedDate: '2026-09-30', note: 'PoC実施中', orderId: null },
   { customerId: c3.id, departmentId: d1.id, name: 'セキュリティ強化',    stage: 'リード',      probability: 10, expectedRevenue: 2000000, expectedCost:  800000, assignee: '鈴木 次郎', expectedDate: '2026-10-31', note: '展示会経由', orderId: null },
   { customerId: c5.id, departmentId: d3.id, name: 'BPRコンサルティング', stage: 'クロージング', probability: 90, expectedRevenue: 5000000, expectedCost: 2000000, assignee: '佐藤 賢一', expectedDate: '2026-05-31', note: '契約書最終確認中', orderId: null }]
    .forEach(p => prospects.push({ id: prospNextId++, createdAt: new Date().toISOString(), ...p }));
  saveKey('pm_prospects', prospects); saveKey('pm_prospNextId', prospNextId);
}

if (revenues.length === 0) {
  [{ caseId: 1, date: '2026-03-15', amount: 1500000, note: '中間検収' },
   { caseId: 1, date: '2026-04-20', amount: 1000000, note: '追加分' },
   { caseId: 4, date: '2026-02-28', amount: 1500000, note: '前払い' },
   { caseId: 4, date: '2026-04-25', amount: 2000000, note: '最終検収' },
   { caseId: 2, date: '2026-04-10', amount:  600000, note: '着手金' },
   { caseId: 6, date: '2026-03-31', amount:  800000, note: '第1フェーズ' }]
    .forEach(r => revenues.push({ id: revNextId++, ...r }));
  saveKey('pm_revenues', revenues); saveKey('pm_revNextId', revNextId);
}

if (costs.length === 0) {
  [{ caseId: 1, category: '人件費', date: '2026-03-01', amount:  900000, note: '3月分工数' },
   { caseId: 1, category: '外注費', date: '2026-03-20', amount:  400000, note: 'UI制作' },
   { caseId: 1, category: '人件費', date: '2026-04-01', amount:  850000, note: '4月分工数' },
   { caseId: 4, category: '人件費', date: '2026-02-01', amount:  600000, note: 'コンサル工数' },
   { caseId: 4, category: '外注費', date: '2026-03-10', amount:  350000, note: '調査委託' },
   { caseId: 4, category: '経費',   date: '2026-04-01', amount:   50000, note: '交通費等' },
   { caseId: 2, category: '人件費', date: '2026-04-05', amount:  280000, note: '4月工数' },
   { caseId: 6, category: '人件費', date: '2026-03-01', amount:  500000, note: '開発工数' },
   { caseId: 6, category: '材料費', date: '2026-03-15', amount:  120000, note: 'APIライセンス' }]
    .forEach(c => costs.push({ id: costNextId++, ...c }));
  saveKey('pm_costs', costs); saveKey('pm_costNextId', costNextId);
}

if (annualTargets.length === 0) {
  const [d1, d2, d3] = depts;
  [{ fiscalYear: 2026, departmentId: 0,     orderTarget: 120000000, revenueTarget: 100000000 },
   { fiscalYear: 2026, departmentId: d1.id, orderTarget:  30000000, revenueTarget:  25000000 },
   { fiscalYear: 2026, departmentId: d2.id, orderTarget:  50000000, revenueTarget:  40000000 },
   { fiscalYear: 2026, departmentId: d3.id, orderTarget:  40000000, revenueTarget:  35000000 }]
    .forEach(t => annualTargets.push({ id: targetNextId++, ...t }));
  saveKey('pm_targets', annualTargets); saveKey('pm_targetNextId', targetNextId);
}

// ===== Helpers =====
function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtYen(n) { if (n == null || n === '') return '―'; return Number(n).toLocaleString('ja-JP'); }
function fmtDate(s) { if (!s) return '―'; const [y,m,d] = s.split('-'); return `${y}/${m}/${d}`; }
function isOverdue(due, status) { if (!due || ['完了','失注'].includes(status)) return false; return new Date(due) < new Date(new Date().toDateString()); }
function getDept(id)   { return depts.find(d => d.id === id); }
function getCase(id)   { return cases.find(c => c.id === id); }
function getCust(id)   { return customers.find(c => c.id === id); }
function deptName(id)  { return getDept(id)?.name ?? '未割当'; }
function custName(id)  { return getCust(id)?.name ?? '―'; }
function statusBadge(s) { return `<span class="badge badge-${esc(s)}">${esc(s)}</span>`; }
function stageBadge(s)  { return `<span class="badge stage-${esc(s)}">${esc(s)}</span>`; }
function prioritySpan(p) { return `<span class="priority-${esc(p)}">${esc(p)}</span>`; }
function pctClass(r) { return r >= 100 ? 'pct-good' : r >= 70 ? 'pct-warn' : 'pct-bad'; }
function fillClass(r) { return r >= 100 ? 'good' : r >= 70 ? 'warn' : 'bad'; }
function pnlClass(v) { return v >= 0 ? 'positive-num' : 'negative-num'; }

function fiscalYear(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
}

function progressBar(pct, cls) {
  const w = Math.min(pct, 100).toFixed(0);
  return `<div class="progress-wrap">
    <div class="progress-bar"><div class="progress-fill ${cls}" style="width:${w}%"></div></div>
    <span class="progress-pct ${pct >= 100 ? 'pct-good' : pct >= 70 ? 'pct-warn' : 'pct-bad'}">${pct.toFixed(1)}%</span>
  </div>`;
}

// ===== P&L calculations =====
function calcCasePnL(caseId) {
  const rev  = revenues.filter(r => r.caseId === caseId).reduce((s,r) => s + Number(r.amount), 0);
  const cost = costs.filter(c => c.caseId === caseId).reduce((s,c) => s + Number(c.amount), 0);
  return { rev, cost, gross: rev - cost, margin: rev > 0 ? (rev - cost) / rev * 100 : null };
}

// ===== Tab Navigation =====
function showTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.hidden = true);
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab).hidden = false;
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  currentTab = tab;
  const addBtn = document.getElementById('btnHeaderAdd');
  const labels = { customers: '＋ 顧客登録', prospects: '＋ 候補案件登録', orders: '＋ 受注登録', cases: '＋ 案件登録', revenue: '＋ 売上登録', cost: '＋ 原価登録', targets: '＋ 目標設定', dept: '＋ 部署登録' };
  if (labels[tab]) { addBtn.textContent = labels[tab]; addBtn.hidden = false; }
  else addBtn.hidden = true;
  renderCurrentTab();
}

function renderCurrentTab() {
  if (currentTab === 'dashboard') renderDashboard();
  else if (currentTab === 'customers') renderCustomers();
  else if (currentTab === 'prospects') { populateAllSelects(); renderProspects(); }
  else if (currentTab === 'orders')    { populateAllSelects(); renderOrders(); }
  else if (currentTab === 'cases')     { populateAllSelects(); renderCases(); }
  else if (currentTab === 'revenue')   { populateAllSelects(); renderRevenue(); }
  else if (currentTab === 'cost')      { populateAllSelects(); renderCost(); }
  else if (currentTab === 'pnl')       renderPnL();
  else if (currentTab === 'targets')   renderTargets();
  else if (currentTab === 'dept')      renderDepts();
}

// ===== Populate selects =====
function populateDeptSelect(id, includeAll) {
  const el = document.getElementById(id); if (!el) return;
  const cur = el.value;
  el.innerHTML = includeAll ? '<option value="">すべての部署</option>' : '<option value="">未割当</option>';
  depts.forEach(d => el.innerHTML += `<option value="${d.id}">${esc(d.name)}</option>`);
  el.value = cur;
}
function populateCustSelect(id) {
  const el = document.getElementById(id); if (!el) return;
  const cur = el.value;
  el.innerHTML = '<option value="">選択してください</option>';
  customers.forEach(c => el.innerHTML += `<option value="${c.id}">${esc(c.name)}</option>`);
  el.value = cur;
}
function populateCaseSelect(id) {
  const el = document.getElementById(id); if (!el) return;
  const cur = el.value;
  el.innerHTML = '<option value="">すべての案件</option>';
  cases.forEach(c => el.innerHTML += `<option value="${c.id}">${esc(c.name)}</option>`);
  el.value = cur;
}

function populateAllSelects() {
  ['prospFiltDept','orderFiltDept','caseFiltDept','revFiltDept','costFiltDept','pnlFiltDept'].forEach(id => populateDeptSelect(id, true));
  ['caseDept','prospDept','orderDept'].forEach(id => populateDeptSelect(id, false));
  ['prospCust','orderCust'].forEach(id => populateCustSelect(id));
  ['revFiltCase','costFiltCase','revCase','costCase'].forEach(id => populateCaseSelect(id));
  populateAssigneeFilter();
}

function populateAssigneeFilter() {
  const sel = document.getElementById('prospFiltAssignee'); if (!sel) return;
  const cur = sel.value;
  const names = [...new Set(prospects.map(p => p.assignee).filter(Boolean))].sort();
  sel.innerHTML = '<option value="">すべての担当者</option>';
  names.forEach(n => sel.innerHTML += `<option value="${esc(n)}">${esc(n)}</option>`);
  sel.value = cur;
}

// ===== DASHBOARD =====
function renderDashboard() {
  const totalRev   = revenues.reduce((s,r) => s + Number(r.amount), 0);
  const totalCost  = costs.reduce((s,c) => s + Number(c.amount), 0);
  const totalGross = totalRev - totalCost;
  const margin     = totalRev > 0 ? totalGross / totalRev * 100 : null;
  const totalOrders = orders.reduce((s,o) => s + Number(o.revenue), 0);
  const pipeline   = prospects.filter(p => !['受注済','失注'].includes(p.stage))
    .reduce((s,p) => s + (Number(p.expectedRevenue) * (Number(p.probability) / 100)), 0);
  const activeCase = cases.filter(c => ['新規','進行中','商談中'].includes(c.status)).length;

  const fy = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;
  const fyTarget = annualTargets.find(t => t.fiscalYear === fy && t.departmentId === 0);
  const fyOrders = orders.filter(o => fiscalYear(o.orderDate) === fy).reduce((s,o) => s + Number(o.revenue), 0);
  const orderAchieve = fyTarget?.orderTarget > 0 ? fyOrders / fyTarget.orderTarget * 100 : null;
  const revAchieve   = fyTarget?.revenueTarget > 0 ? totalRev / fyTarget.revenueTarget * 100 : null;

  document.getElementById('kpiGrid').innerHTML = [
    { label: '売上実績',       value: fmtYen(totalRev),   sub: '円' },
    { label: '粗利',           value: fmtYen(totalGross), sub: '円', cls: totalGross >= 0 ? 'positive' : 'negative' },
    { label: '粗利率',         value: margin != null ? margin.toFixed(1)+'%' : '―', sub: '' },
    { label: '受注高',         value: fmtYen(totalOrders), sub: '円' },
    { label: '受注高達成率',   value: orderAchieve != null ? orderAchieve.toFixed(1)+'%' : '―', sub: `対${fy}年度目標`, cls: orderAchieve != null ? (orderAchieve >= 100 ? 'positive' : orderAchieve >= 70 ? 'warn' : 'negative') : '' },
    { label: '売上達成率',     value: revAchieve != null ? revAchieve.toFixed(1)+'%' : '―', sub: `対${fy}年度目標`, cls: revAchieve != null ? (revAchieve >= 100 ? 'positive' : revAchieve >= 70 ? 'warn' : 'negative') : '' },
    { label: 'パイプライン',   value: fmtYen(Math.round(pipeline)), sub: '円 (加重期待値)' },
    { label: 'アクティブ案件', value: activeCase, sub: '件' },
  ].map(k => `<div class="kpi-card"><div class="kpi-label">${k.label}</div><div class="kpi-value${k.cls?' '+k.cls:''}">${k.value}</div><div class="kpi-sub">${k.sub}</div></div>`).join('');

  // Pipeline by stage
  const stages = ['リード','提案','見積','交渉','クロージング'];
  const stageTotals = stages.map(s => ({ s, items: prospects.filter(p => p.stage === s) }));
  const maxCount = Math.max(...stageTotals.map(x => x.items.length), 1);

  const pipelineHTML = `<div class="pipeline-grid">${stageTotals.map(({s, items}) => {
    const amt = items.reduce((a,p) => a + Number(p.expectedRevenue || 0), 0);
    const pct = (items.length / maxCount * 100).toFixed(0);
    return `<div class="pipeline-card">
      <div class="pipeline-stage-label">${s}</div>
      <div class="pipeline-count">${items.length}件</div>
      <div class="pipeline-amount">¥${fmtYen(amt)}</div>
      <div class="pipeline-bar"><div class="pipeline-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('')}</div>`;

  // Year targets summary
  const targetHTML = fyTarget ? `
    <div class="target-summary-grid">
      <div class="target-summary-item">
        <div class="target-summary-label">受注高（${fy}年度）</div>
        <div class="target-summary-vals">
          <span class="target-summary-actual">${fmtYen(fyOrders)}</span>
          <span class="target-summary-of">/ 目標 ${fmtYen(fyTarget.orderTarget)} 円</span>
        </div>
        ${progressBar(orderAchieve ?? 0, fillClass(orderAchieve ?? 0))}
      </div>
      <div class="target-summary-item">
        <div class="target-summary-label">売上（${fy}年度）</div>
        <div class="target-summary-vals">
          <span class="target-summary-actual">${fmtYen(totalRev)}</span>
          <span class="target-summary-of">/ 目標 ${fmtYen(fyTarget.revenueTarget)} 円</span>
        </div>
        ${progressBar(revAchieve ?? 0, fillClass(revAchieve ?? 0))}
      </div>
    </div>` : '<div class="empty-state">年度目標が設定されていません</div>';

  // Dept P&L
  const deptRows = depts.map(d => {
    const dCases = cases.filter(c => c.departmentId === d.id);
    let rev = 0, cost = 0;
    dCases.forEach(c => { const p = calcCasePnL(c.id); rev += p.rev; cost += p.cost; });
    const gross = rev - cost;
    const m = rev > 0 ? gross / rev * 100 : null;
    return { name: d.name, rev, cost, gross, m };
  }).sort((a,b) => b.gross - a.gross);

  // Top projects
  const topProjects = cases.map(c => ({ c, p: calcCasePnL(c.id) }))
    .filter(({p}) => p.rev > 0).sort((a,b) => b.p.gross - a.p.gross).slice(0,5);

  // Recent
  const recentRev  = [...revenues].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5);
  const recentCost = [...costs].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5);

  document.getElementById('dashGrid').innerHTML = `
    <div class="card">
      <div class="card-header"><h3>パイプライン（ステージ別）</h3></div>
      <div class="card-body" style="padding:14px">${pipelineHTML}</div>
    </div>
    <div class="card" style="grid-column: span 2">
      <div class="card-header"><h3>${fy}年度 目標達成状況</h3></div>
      <div class="card-body">${targetHTML}</div>
    </div>
    <div class="card">
      <div class="card-header"><h3>部署別損益</h3></div>
      <div class="card-body">
        <table class="mini-table"><thead><tr><th>部署</th><th class="num">売上</th><th class="num">粗利</th><th class="num">粗利率</th></tr></thead>
        <tbody>${deptRows.map(r => `<tr><td>${esc(r.name)}</td><td class="num">${fmtYen(r.rev)}</td><td class="num ${pnlClass(r.gross)}">${fmtYen(r.gross)}</td><td class="num ${r.m!=null?pctClass(r.m):''}">${r.m!=null?r.m.toFixed(1)+'%':'―'}</td></tr>`).join('')}</tbody></table>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>粗利 TOP5 プロジェクト</h3></div>
      <div class="card-body">
        <table class="mini-table"><thead><tr><th>案件名</th><th class="num">粗利</th><th class="num">粗利率</th></tr></thead>
        <tbody>${topProjects.map(({c,p}) => `<tr><td>${esc(c.name)}</td><td class="num ${pnlClass(p.gross)}">${fmtYen(p.gross)}</td><td class="num ${p.margin!=null?pctClass(p.margin):''}">${p.margin!=null?p.margin.toFixed(1)+'%':'―'}</td></tr>`).join('')}</tbody></table>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>最近の売上登録</h3></div>
      <div class="card-body">
        <table class="mini-table"><thead><tr><th>日付</th><th>案件</th><th class="num">金額</th></tr></thead>
        <tbody>${recentRev.map(r => `<tr><td>${fmtDate(r.date)}</td><td>${esc(getCase(r.caseId)?.name??'―')}</td><td class="num">${fmtYen(r.amount)}</td></tr>`).join('')}</tbody></table>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>最近の原価登録</h3></div>
      <div class="card-body">
        <table class="mini-table"><thead><tr><th>日付</th><th>案件</th><th>カテゴリ</th><th class="num">金額</th></tr></thead>
        <tbody>${recentCost.map(c => `<tr><td>${fmtDate(c.date)}</td><td>${esc(getCase(c.caseId)?.name??'―')}</td><td><span class="badge badge-cat">${esc(c.category)}</span></td><td class="num">${fmtYen(c.amount)}</td></tr>`).join('')}</tbody></table>
      </div>
    </div>`;
}

// ===== CUSTOMERS =====
function renderCustomers() {
  const list = customers.filter(c => {
    if (F.custIndustry && c.industry !== F.custIndustry) return false;
    if (F.custSearch) { const q = F.custSearch.toLowerCase(); if (!c.name.toLowerCase().includes(q) && !(c.contact??'').toLowerCase().includes(q)) return false; }
    return true;
  });
  const empty = document.getElementById('custEmpty');
  const tbody = document.getElementById('custTableBody');
  document.getElementById('custFooter').textContent = list.length ? `${list.length} 件表示 / 全 ${customers.length} 件` : '';
  if (!list.length) { tbody.innerHTML=''; empty.hidden=false; return; }
  empty.hidden = true;
  tbody.innerHTML = list.map(c => {
    const pCount = prospects.filter(p => p.customerId === c.id).length;
    const oCount = orders.filter(o => o.customerId === c.id).length;
    return `<tr>
      <td>${c.id}</td>
      <td><strong>${esc(c.name)}</strong></td>
      <td>${esc(c.industry||'―')}</td>
      <td>${esc(c.contact||'―')}</td>
      <td>${esc(c.tel||'―')}</td>
      <td>${esc(c.email||'―')}</td>
      <td>${pCount}件</td>
      <td>${oCount}件</td>
      <td>
        <button class="btn btn-icon" onclick="openCustEdit(${c.id})">✏️</button>
        <button class="btn btn-icon" onclick="openConfirm('cust',${c.id},'${esc(c.name)}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

// ===== PROSPECTS =====
function renderProspects() {
  // Pipeline cards
  const stages = ['リード','提案','見積','交渉','クロージング','受注済','失注'];
  const active = prospects.filter(p => !['受注済','失注'].includes(p.stage));
  const maxAmt = Math.max(...stages.map(s => active.filter(p=>p.stage===s).reduce((a,p)=>a+Number(p.expectedRevenue||0),0)), 1);
  document.getElementById('pipelineGrid').innerHTML = stages.slice(0,5).map(s => {
    const items = active.filter(p => p.stage === s);
    const amt = items.reduce((a,p)=>a+Number(p.expectedRevenue||0),0);
    return `<div class="pipeline-card">
      <div class="pipeline-stage-label">${s}</div>
      <div class="pipeline-count">${items.length}件</div>
      <div class="pipeline-amount">¥${fmtYen(amt)}</div>
      <div class="pipeline-bar"><div class="pipeline-fill" style="width:${(amt/maxAmt*100).toFixed(0)}%"></div></div>
    </div>`;
  }).join('');

  const list = prospects.filter(p => {
    if (F.prospDept && String(p.departmentId) !== F.prospDept) return false;
    if (F.prospStage && p.stage !== F.prospStage) return false;
    if (F.prospAssignee && p.assignee !== F.prospAssignee) return false;
    return true;
  });
  const tbody = document.getElementById('prospTableBody');
  const empty = document.getElementById('prospEmpty');
  document.getElementById('prospFooter').textContent = list.length ? `${list.length} 件 / 加重期待値合計 ¥${fmtYen(Math.round(list.reduce((s,p)=>s+Number(p.expectedRevenue||0)*(Number(p.probability||0)/100),0)))}` : '';
  if (!list.length) { tbody.innerHTML=''; empty.hidden=false; return; }
  empty.hidden = true;
  tbody.innerHTML = list.map(p => {
    const already = !!p.orderId;
    return `<tr>
      <td>${esc(custName(p.customerId))}</td>
      <td><strong>${esc(p.name)}</strong></td>
      <td>${esc(deptName(p.departmentId))}</td>
      <td class="num">¥${fmtYen(p.expectedRevenue)}</td>
      <td>${p.probability != null ? p.probability + '%' : '―'}</td>
      <td>${stageBadge(p.stage)}</td>
      <td>${esc(p.assignee||'―')}</td>
      <td>${fmtDate(p.expectedDate)}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-icon" onclick="openProspEdit(${p.id})">✏️</button>
        ${already
          ? `<button class="btn btn-xs btn-xs-muted" disabled title="受注済">受注済</button>`
          : `<button class="btn btn-xs btn-xs-success" onclick="openOrderFromProspect(${p.id})">受注確定</button>`}
        <button class="btn btn-icon" onclick="openConfirm('prosp',${p.id},'${esc(p.name)}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

// ===== ORDERS =====
function renderOrders() {
  const fyOrders = orders.reduce((s,o) => s + Number(o.revenue), 0);
  const pending  = orders.filter(o => !o.caseId).length;
  const done     = orders.filter(o => !!o.caseId).length;
  document.getElementById('orderKpiGrid').innerHTML = [
    { label: '受注高合計', value: fmtYen(fyOrders), sub: '円' },
    { label: '未案件化',   value: pending, sub: '件' },
    { label: '案件化済',   value: done,    sub: '件' },
  ].map(k => `<div class="kpi-card"><div class="kpi-label">${k.label}</div><div class="kpi-value">${k.value}</div><div class="kpi-sub">${k.sub}</div></div>`).join('');

  const list = orders.filter(o => {
    if (F.orderDept && String(o.departmentId) !== F.orderDept) return false;
    if (F.orderMonth && !o.orderDate.startsWith(F.orderMonth)) return false;
    if (F.orderStatus === 'pending' && o.caseId) return false;
    if (F.orderStatus === 'done'    && !o.caseId) return false;
    return true;
  });
  const tbody = document.getElementById('orderTableBody');
  const empty = document.getElementById('orderEmpty');
  document.getElementById('orderFooter').textContent = list.length ? `${list.length} 件 / 合計 ¥${fmtYen(list.reduce((s,o)=>s+Number(o.revenue),0))}` : '';
  if (!list.length) { tbody.innerHTML=''; empty.hidden=false; return; }
  empty.hidden = true;
  tbody.innerHTML = [...list].sort((a,b)=>b.orderDate.localeCompare(a.orderDate)).map(o => {
    const linked = !!o.caseId;
    const c = getCase(o.caseId);
    return `<tr>
      <td>${fmtDate(o.orderDate)}</td>
      <td>${esc(custName(o.customerId))}</td>
      <td><strong>${esc(o.name)}</strong></td>
      <td>${esc(deptName(o.departmentId))}</td>
      <td class="num">¥${fmtYen(o.revenue)}</td>
      <td>${fmtDate(o.deliveryDate)}</td>
      <td>${esc(o.assignee||'―')}</td>
      <td>${linked
        ? `<span class="badge badge-linked">案件化済</span><br><small>${esc(c?.name??'')}</small>`
        : `<button class="btn btn-xs btn-xs-primary" onclick="openCaseFromOrder(${o.id})">案件化</button>`}
      </td>
      <td>
        <button class="btn btn-icon" onclick="openOrderEdit(${o.id})">✏️</button>
        <button class="btn btn-icon" onclick="openConfirm('order',${o.id},'${esc(o.name)}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

// ===== CASES =====
function renderCases() {
  const list = cases.filter(c => {
    if (F.caseDept     && String(c.departmentId) !== F.caseDept) return false;
    if (F.caseStatus   && c.status !== F.caseStatus) return false;
    if (F.casePriority && c.priority !== F.casePriority) return false;
    if (F.caseSearch) { const q = F.caseSearch.toLowerCase(); if (!c.name.toLowerCase().includes(q) && !c.client.toLowerCase().includes(q)) return false; }
    return true;
  });
  const sorted = [...list].sort((a,b) => {
    let av = caseSortKey === 'deptName' ? deptName(a.departmentId) : (a[caseSortKey] ?? '');
    let bv = caseSortKey === 'deptName' ? deptName(b.departmentId) : (b[caseSortKey] ?? '');
    if (['plannedRevenue','plannedCost','id'].includes(caseSortKey)) { av=Number(av); bv=Number(bv); }
    return (caseSortDir === 'asc' ? 1 : -1) * String(av).localeCompare(String(bv),'ja',{numeric:true});
  });
  const empty = document.getElementById('caseEmpty');
  document.getElementById('caseFooter').textContent = sorted.length ? `${sorted.length} 件表示 / 全 ${cases.length} 件` : '';
  if (!sorted.length) { document.getElementById('caseTableBody').innerHTML=''; empty.hidden=false; return; }
  empty.hidden = true;
  document.getElementById('caseTableBody').innerHTML = sorted.map(c => {
    const over = isOverdue(c.dueDate, c.status);
    return `<tr>
      <td>${c.id}</td><td>${esc(deptName(c.departmentId))}</td>
      <td><strong>${esc(c.name)}</strong></td>
      <td>${esc(c.client)}</td>
      <td class="num">${fmtYen(c.plannedRevenue)}</td>
      <td class="num">${fmtYen(c.plannedCost)}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${prioritySpan(c.priority||'中')}</td>
      <td>${esc(c.assignee||'―')}</td>
      <td style="color:${over?'var(--color-danger)':'inherit'}">${fmtDate(c.dueDate)}${over?' ⚠':''}</td>
      <td>
        <button class="btn btn-icon" onclick="openCaseEdit(${c.id})">✏️</button>
        <button class="btn btn-icon" onclick="openConfirm('case',${c.id},'${esc(c.name)}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
  document.querySelectorAll('#caseTable th[data-sort]').forEach(th => {
    th.classList.remove('sort-asc','sort-desc');
    if (th.dataset.sort === caseSortKey) th.classList.add(caseSortDir==='asc'?'sort-asc':'sort-desc');
  });
}

// ===== REVENUE =====
function renderRevenue() {
  const enriched = revenues.map(r => { const c = getCase(r.caseId); return { ...r, caseName: c?.name??'―', deptName: deptName(c?.departmentId) }; });
  const list = enriched.filter(r => {
    if (F.revDept  && !depts.find(d=>d.id===Number(F.revDept)&&d.name===r.deptName)) return false;
    if (F.revCase  && String(r.caseId) !== F.revCase) return false;
    if (F.revMonth && !r.date.startsWith(F.revMonth)) return false;
    return true;
  });
  const sorted = [...list].sort((a,b) => { let av=a[revSortKey]??'',bv=b[revSortKey]??''; if(revSortKey==='amount'){av=Number(av);bv=Number(bv);} return (revSortDir==='asc'?1:-1)*String(av).localeCompare(String(bv),'ja',{numeric:true}); });
  const tbody = document.getElementById('revTableBody');
  const empty = document.getElementById('revEmpty');
  document.getElementById('revFooter').textContent = sorted.length ? `${sorted.length} 件 / 合計 ¥${fmtYen(sorted.reduce((s,r)=>s+Number(r.amount),0))}` : '';
  if (!sorted.length) { tbody.innerHTML=''; empty.hidden=false; return; }
  empty.hidden = true;
  tbody.innerHTML = sorted.map(r => `<tr>
    <td>${fmtDate(r.date)}</td><td>${esc(r.deptName)}</td><td>${esc(r.caseName)}</td>
    <td class="num">¥${fmtYen(r.amount)}</td><td>${esc(r.note||'―')}</td>
    <td><button class="btn btn-icon" onclick="openRevEdit(${r.id})">✏️</button>
        <button class="btn btn-icon" onclick="openConfirm('rev',${r.id},'${fmtDate(r.date)} の売上')">🗑️</button></td>
  </tr>`).join('');
  document.querySelectorAll('[data-table="rev"]').forEach(th => { th.classList.remove('sort-asc','sort-desc'); if(th.dataset.sort===revSortKey)th.classList.add(revSortDir==='asc'?'sort-asc':'sort-desc'); });
}

// ===== COST =====
function renderCost() {
  const enriched = costs.map(c => { const cs = getCase(c.caseId); return { ...c, caseName: cs?.name??'―', deptName: deptName(cs?.departmentId) }; });
  const list = enriched.filter(c => {
    if (F.costDept  && !depts.find(d=>d.id===Number(F.costDept)&&d.name===c.deptName)) return false;
    if (F.costCase  && String(c.caseId) !== F.costCase) return false;
    if (F.costCat   && c.category !== F.costCat) return false;
    if (F.costMonth && !c.date.startsWith(F.costMonth)) return false;
    return true;
  });
  const sorted = [...list].sort((a,b) => { let av=a[costSortKey]??'',bv=b[costSortKey]??''; if(costSortKey==='amount'){av=Number(av);bv=Number(bv);} return (costSortDir==='asc'?1:-1)*String(av).localeCompare(String(bv),'ja',{numeric:true}); });
  const tbody = document.getElementById('costTableBody');
  const empty = document.getElementById('costEmpty');
  document.getElementById('costFooter').textContent = sorted.length ? `${sorted.length} 件 / 合計 ¥${fmtYen(sorted.reduce((s,c)=>s+Number(c.amount),0))}` : '';
  if (!sorted.length) { tbody.innerHTML=''; empty.hidden=false; return; }
  empty.hidden = true;
  tbody.innerHTML = sorted.map(c => `<tr>
    <td>${fmtDate(c.date)}</td><td>${esc(c.deptName)}</td><td>${esc(c.caseName)}</td>
    <td><span class="badge badge-cat">${esc(c.category)}</span></td>
    <td class="num">¥${fmtYen(c.amount)}</td><td>${esc(c.note||'―')}</td>
    <td><button class="btn btn-icon" onclick="openCostEdit(${c.id})">✏️</button>
        <button class="btn btn-icon" onclick="openConfirm('cost',${c.id},'${fmtDate(c.date)} の原価')">🗑️</button></td>
  </tr>`).join('');
  document.querySelectorAll('[data-table="cost"]').forEach(th => { th.classList.remove('sort-asc','sort-desc'); if(th.dataset.sort===costSortKey)th.classList.add(costSortDir==='asc'?'sort-asc':'sort-desc'); });
}

// ===== P&L =====
function renderPnL() {
  populateDeptSelect('pnlFiltDept', true);
  const years = new Set(); [...revenues, ...costs].forEach(e => { if(e.date) years.add(e.date.slice(0,4)); });
  const pnlYearSel = document.getElementById('pnlFiltYear');
  const curYr = pnlYearSel.value;
  pnlYearSel.innerHTML = '<option value="">全期間</option>';
  [...years].sort().reverse().forEach(y => pnlYearSel.innerHTML += `<option value="${y}">${y}年</option>`);
  pnlYearSel.value = curYr;

  const filtDeptId = F.pnlDept ? Number(F.pnlDept) : null;
  const yr = F.pnlYear;
  const targetDepts = filtDeptId ? depts.filter(d=>d.id===filtDeptId) : depts;
  const tbody = document.getElementById('pnlTableBody');
  const tfoot = document.getElementById('pnlTableFoot');
  const empty = document.getElementById('pnlEmpty');

  function calcFiltered(caseId) {
    const rev  = revenues.filter(r=>r.caseId===caseId&&(!yr||r.date.startsWith(yr))).reduce((s,r)=>s+Number(r.amount),0);
    const cost = costs.filter(c=>c.caseId===caseId&&(!yr||c.date.startsWith(yr))).reduce((s,c)=>s+Number(c.amount),0);
    return { rev, cost };
  }

  let grandPR=0,grandPC=0,grandR=0,grandC=0;
  let rows = '';

  if (F.pnlView === 'project') {
    const caseList = filtDeptId ? cases.filter(c=>c.departmentId===filtDeptId) : cases;
    if (!caseList.length) { tbody.innerHTML=''; tfoot.innerHTML=''; empty.hidden=false; return; }
    empty.hidden = true;
    rows = caseList.map(c => {
      const {rev,cost} = calcFiltered(c.id);
      const pRev=Number(c.plannedRevenue??0), pCost=Number(c.plannedCost??0);
      const gross=rev-cost, margin=rev>0?gross/rev*100:null, achieve=pRev>0?rev/pRev*100:null;
      grandPR+=pRev;grandPC+=pCost;grandR+=rev;grandC+=cost;
      return `<tr><td>${esc(deptName(c.departmentId))} / ${esc(c.name)}</td>
        <td class="num">${fmtYen(pRev)}</td><td class="num">${fmtYen(rev)}</td>
        <td class="num ${achieve!=null?pctClass(achieve):''}">${achieve!=null?achieve.toFixed(1)+'%':'―'}</td>
        <td class="num">${fmtYen(pCost)}</td><td class="num">${fmtYen(cost)}</td>
        <td class="num ${pnlClass(gross)}">${fmtYen(gross)}</td>
        <td class="num ${margin!=null?pctClass(margin):''}">${margin!=null?margin.toFixed(1)+'%':'―'}</td></tr>`;
    }).join('');
  } else {
    if (!targetDepts.length) { tbody.innerHTML=''; tfoot.innerHTML=''; empty.hidden=false; return; }
    empty.hidden = true;
    rows = targetDepts.map(dept => {
      const dCases = cases.filter(c=>c.departmentId===dept.id);
      let dPR=0,dPC=0,dR=0,dC=0;
      const caseRows = dCases.map(c => {
        const {rev,cost}=calcFiltered(c.id), pRev=Number(c.plannedRevenue??0), pCost=Number(c.plannedCost??0);
        dPR+=pRev;dPC+=pCost;dR+=rev;dC+=cost;
        const gross=rev-cost, margin=rev>0?gross/rev*100:null, achieve=pRev>0?rev/pRev*100:null;
        return `<tr class="case-row" data-dept="${dept.id}" ${collapsedDepts.has(dept.id)?'hidden':''}>
          <td>└ ${esc(c.name)}</td>
          <td class="num">${fmtYen(pRev)}</td><td class="num">${fmtYen(rev)}</td>
          <td class="num ${achieve!=null?pctClass(achieve):''}">${achieve!=null?achieve.toFixed(1)+'%':'―'}</td>
          <td class="num">${fmtYen(pCost)}</td><td class="num">${fmtYen(cost)}</td>
          <td class="num ${pnlClass(gross)}">${fmtYen(gross)}</td>
          <td class="num ${margin!=null?pctClass(margin):''}">${margin!=null?margin.toFixed(1)+'%':'―'}</td>
        </tr>`;
      }).join('');
      grandPR+=dPR;grandPC+=dPC;grandR+=dR;grandC+=dC;
      const dGross=dR-dC, dMargin=dR>0?dGross/dR*100:null, dAchieve=dPR>0?dR/dPR*100:null;
      const arrow = collapsedDepts.has(dept.id)?'▶':'▼';
      return `<tr class="group-row" onclick="toggleDept(${dept.id})">
        <td>${arrow} ${esc(dept.name)}（${dCases.length}件）</td>
        <td class="num">${fmtYen(dPR)}</td><td class="num">${fmtYen(dR)}</td>
        <td class="num ${dAchieve!=null?pctClass(dAchieve):''}">${dAchieve!=null?dAchieve.toFixed(1)+'%':'―'}</td>
        <td class="num">${fmtYen(dPC)}</td><td class="num">${fmtYen(dC)}</td>
        <td class="num ${pnlClass(dGross)}">${fmtYen(dGross)}</td>
        <td class="num ${dMargin!=null?pctClass(dMargin):''}">${dMargin!=null?dMargin.toFixed(1)+'%':'―'}</td>
      </tr>${caseRows}`;
    }).join('');
  }
  tbody.innerHTML = rows;
  const gGross=grandR-grandC, gMargin=grandR>0?gGross/grandR*100:null, gAchieve=grandPR>0?grandR/grandPR*100:null;
  tfoot.innerHTML = `<tr><td>合計</td>
    <td class="num">${fmtYen(grandPR)}</td><td class="num">${fmtYen(grandR)}</td>
    <td class="num ${gAchieve!=null?pctClass(gAchieve):''}">${gAchieve!=null?gAchieve.toFixed(1)+'%':'―'}</td>
    <td class="num">${fmtYen(grandPC)}</td><td class="num">${fmtYen(grandC)}</td>
    <td class="num ${pnlClass(gGross)}">${fmtYen(gGross)}</td>
    <td class="num ${gMargin!=null?pctClass(gMargin):''}">${gMargin!=null?gMargin.toFixed(1)+'%':'―'}</td>
  </tr>`;
}
window.toggleDept = id => { collapsedDepts.has(id)?collapsedDepts.delete(id):collapsedDepts.add(id); renderPnL(); };

// ===== TARGETS =====
function renderTargets() {
  const years = [...new Set(annualTargets.map(t => t.fiscalYear))].sort().reverse();
  const sel = document.getElementById('targetFiltYear');
  const cur = sel.value || String(years[0] ?? new Date().getFullYear());
  sel.innerHTML = '';
  if (!years.length) sel.innerHTML = `<option value="${new Date().getFullYear()}">${new Date().getFullYear()}年度</option>`;
  else years.forEach(y => sel.innerHTML += `<option value="${y}">${y}年度</option>`);
  sel.value = cur; F.targetYear = cur;
  const fy = Number(cur);

  const grandTarget = annualTargets.find(t => t.fiscalYear === fy && t.departmentId === 0);
  const fyOrders = orders.filter(o => fiscalYear(o.orderDate) === fy);
  const totalOrderAmt = fyOrders.reduce((s,o)=>s+Number(o.revenue),0);
  const totalRevAmt   = revenues.reduce((s,r)=>s+Number(r.amount),0);

  function buildSection(label, target, orderAmt, revAmt) {
    const oT = target?.orderTarget ?? 0, rT = target?.revenueTarget ?? 0;
    const oA = oT > 0 ? orderAmt / oT * 100 : null;
    const rA = rT > 0 ? revAmt  / rT * 100 : null;
    return `<div class="target-section">
      <div class="target-section-header">
        <h3>${esc(label)}</h3>
        <button class="btn btn-ghost" style="font-size:12px;padding:4px 10px" onclick="openTargetEdit(${fy},${target?.departmentId??0})">編集</button>
      </div>
      <div class="target-summary-grid">
        <div class="target-summary-item">
          <div class="target-summary-label">受注高</div>
          <div class="target-summary-vals">
            <span class="target-summary-actual">¥${fmtYen(orderAmt)}</span>
            <span class="target-summary-of">/ 目標 ¥${fmtYen(oT)}</span>
          </div>
          ${oA != null ? progressBar(oA, fillClass(oA)) : '<span style="color:var(--color-text-muted);font-size:12px">目標未設定</span>'}
        </div>
        <div class="target-summary-item">
          <div class="target-summary-label">売上</div>
          <div class="target-summary-vals">
            <span class="target-summary-actual">¥${fmtYen(revAmt)}</span>
            <span class="target-summary-of">/ 目標 ¥${fmtYen(rT)}</span>
          </div>
          ${rA != null ? progressBar(rA, fillClass(rA)) : '<span style="color:var(--color-text-muted);font-size:12px">目標未設定</span>'}
        </div>
      </div>
    </div>`;
  }

  let html = `<h3 style="font-size:13px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:10px">${fy}年度 全社</h3>`;
  html += buildSection('全社合計', grandTarget, totalOrderAmt, totalRevAmt);

  html += `<h3 style="font-size:13px;font-weight:700;color:var(--color-text-muted);text-transform:uppercase;margin:20px 0 10px">部署別詳細</h3>`;
  html += `<div class="target-section"><div class="card-body">
    <table class="target-dept-table">
      <thead><tr>
        <th>部署</th>
        <th class="num">受注高目標</th><th class="num">受注高実績</th><th>達成率</th>
        <th class="num">売上目標</th><th class="num">売上実績</th><th>達成率</th>
        <th>操作</th>
      </tr></thead>
      <tbody>`;
  let totOT=0,totRT=0,totOA=0,totRA=0;
  depts.forEach(d => {
    const t = annualTargets.find(x => x.fiscalYear===fy && x.departmentId===d.id);
    const oAmt = fyOrders.filter(o=>o.departmentId===d.id).reduce((s,o)=>s+Number(o.revenue),0);
    const rAmt = revenues.filter(r=>{ const c=getCase(r.caseId); return c?.departmentId===d.id; }).reduce((s,r)=>s+Number(r.amount),0);
    const oT=t?.orderTarget??0, rT=t?.revenueTarget??0;
    const oPct=oT>0?oAmt/oT*100:null, rPct=rT>0?rAmt/rT*100:null;
    totOT+=oT;totRT+=rT;totOA+=oAmt;totRA+=rAmt;
    html += `<tr>
      <td><strong>${esc(d.name)}</strong></td>
      <td class="num">${fmtYen(oT)||'―'}</td>
      <td class="num">${fmtYen(oAmt)}</td>
      <td style="min-width:160px">${oPct!=null?progressBar(oPct,fillClass(oPct)):'<span style="color:var(--color-text-muted)">目標未設定</span>'}</td>
      <td class="num">${fmtYen(rT)||'―'}</td>
      <td class="num">${fmtYen(rAmt)}</td>
      <td style="min-width:160px">${rPct!=null?progressBar(rPct,fillClass(rPct)):'<span style="color:var(--color-text-muted)">目標未設定</span>'}</td>
      <td><button class="btn btn-icon" onclick="openTargetEdit(${fy},${d.id})">✏️</button></td>
    </tr>`;
  });
  const tOPct=totOT>0?totOA/totOT*100:null, tRPct=totRT>0?totRA/totRT*100:null;
  html += `</tbody><tfoot><tr>
    <td>合計</td>
    <td class="num">${fmtYen(totOT)}</td><td class="num">${fmtYen(totOA)}</td>
    <td>${tOPct!=null?progressBar(tOPct,fillClass(tOPct)):'―'}</td>
    <td class="num">${fmtYen(totRT)}</td><td class="num">${fmtYen(totRA)}</td>
    <td>${tRPct!=null?progressBar(tRPct,fillClass(tRPct)):'―'}</td>
    <td></td>
  </tr></tfoot></table></div></div>`;
  document.getElementById('targetContent').innerHTML = html;
}

// ===== DEPTS =====
function renderDepts() {
  const tbody = document.getElementById('deptTableBody');
  const empty = document.getElementById('deptEmpty');
  if (!depts.length) { tbody.innerHTML=''; empty.hidden=false; return; }
  empty.hidden = true;
  tbody.innerHTML = depts.map(d => `<tr>
    <td>${d.id}</td><td><strong>${esc(d.name)}</strong></td><td>${esc(d.manager||'―')}</td>
    <td>${cases.filter(c=>c.departmentId===d.id).length}件</td>
    <td>${esc(d.note||'―')}</td>
    <td><button class="btn btn-icon" onclick="openDeptEdit(${d.id})">✏️</button>
        <button class="btn btn-icon" onclick="openConfirm('dept',${d.id},'${esc(d.name)}')">🗑️</button></td>
  </tr>`).join('');
}

// ===== Modal helpers =====
function openModal(id) { document.getElementById(id).hidden = false; }
function closeModal(id) { document.getElementById(id).hidden = true; }
function clearErrs(...ids) { ids.forEach(id => { const e=document.getElementById(id); if(e) e.textContent=''; }); }

// ===== Customer CRUD =====
function openCustAdd() {
  clearErrs('errCustName');
  document.getElementById('custId').value='';
  document.getElementById('custForm').reset();
  document.getElementById('custModalTitle').textContent='顧客登録';
  openModal('custModalOverlay');
}
window.openCustEdit = id => {
  const c = customers.find(x=>x.id===id); if(!c) return;
  clearErrs('errCustName');
  document.getElementById('custId').value=c.id;
  document.getElementById('custName').value=c.name;
  document.getElementById('custIndustry').value=c.industry||'';
  document.getElementById('custContact').value=c.contact||'';
  document.getElementById('custTel').value=c.tel||'';
  document.getElementById('custEmail').value=c.email||'';
  document.getElementById('custNote').value=c.note||'';
  document.getElementById('custModalTitle').textContent='顧客編集';
  openModal('custModalOverlay');
};
document.getElementById('custForm').addEventListener('submit', e => {
  e.preventDefault(); clearErrs('errCustName');
  const name = document.getElementById('custName').value.trim();
  if (!name) { document.getElementById('errCustName').textContent='顧客名を入力してください'; return; }
  const data = { name, industry: document.getElementById('custIndustry').value, contact: document.getElementById('custContact').value.trim(), tel: document.getElementById('custTel').value.trim(), email: document.getElementById('custEmail').value.trim(), note: document.getElementById('custNote').value.trim() };
  const id = document.getElementById('custId').value;
  if (id) { const i=customers.findIndex(c=>c.id===Number(id)); if(i>=0) customers[i]={...customers[i],...data}; }
  else customers.push({ id: custNextId++, createdAt: new Date().toISOString(), ...data });
  saveKey('pm_customers',customers); saveKey('pm_custNextId',custNextId);
  closeModal('custModalOverlay'); renderCurrentTab();
});

// ===== Prospect CRUD =====
function openProspAdd() {
  clearErrs('errProspCust','errProspName','errProspStage');
  document.getElementById('prospId').value='';
  document.getElementById('prospForm').reset();
  populateCustSelect('prospCust'); populateDeptSelect('prospDept',false);
  document.getElementById('prospModalTitle').textContent='候補案件登録';
  openModal('prospModalOverlay');
}
window.openProspEdit = id => {
  const p=prospects.find(x=>x.id===id); if(!p) return;
  clearErrs('errProspCust','errProspName','errProspStage');
  populateCustSelect('prospCust'); populateDeptSelect('prospDept',false);
  document.getElementById('prospId').value=p.id;
  document.getElementById('prospCust').value=p.customerId;
  document.getElementById('prospDept').value=p.departmentId||'';
  document.getElementById('prospName').value=p.name;
  document.getElementById('prospStage').value=p.stage;
  document.getElementById('prospProb').value=p.probability??'';
  document.getElementById('prospAmount').value=p.expectedRevenue??'';
  document.getElementById('prospCost').value=p.expectedCost??'';
  document.getElementById('prospAssignee').value=p.assignee||'';
  document.getElementById('prospDate').value=p.expectedDate||'';
  document.getElementById('prospNote').value=p.note||'';
  document.getElementById('prospModalTitle').textContent='候補案件編集';
  openModal('prospModalOverlay');
};
document.getElementById('prospForm').addEventListener('submit', e => {
  e.preventDefault(); clearErrs('errProspCust','errProspName','errProspStage');
  const cust=document.getElementById('prospCust').value, name=document.getElementById('prospName').value.trim(), stage=document.getElementById('prospStage').value;
  let ok=true;
  if(!cust){document.getElementById('errProspCust').textContent='顧客を選択してください';ok=false;}
  if(!name){document.getElementById('errProspName').textContent='案件名を入力してください';ok=false;}
  if(!stage){document.getElementById('errProspStage').textContent='ステージを選択してください';ok=false;}
  if(!ok) return;
  const data={customerId:Number(cust),departmentId:document.getElementById('prospDept').value?Number(document.getElementById('prospDept').value):null,name,stage,probability:document.getElementById('prospProb').value!==''?Number(document.getElementById('prospProb').value):null,expectedRevenue:document.getElementById('prospAmount').value!==''?Number(document.getElementById('prospAmount').value):null,expectedCost:document.getElementById('prospCost').value!==''?Number(document.getElementById('prospCost').value):null,assignee:document.getElementById('prospAssignee').value.trim(),expectedDate:document.getElementById('prospDate').value,note:document.getElementById('prospNote').value.trim()};
  const id=document.getElementById('prospId').value;
  if(id){const i=prospects.findIndex(p=>p.id===Number(id));if(i>=0)prospects[i]={...prospects[i],...data};}
  else prospects.push({id:prospNextId++,createdAt:new Date().toISOString(),orderId:null,...data});
  saveKey('pm_prospects',prospects);saveKey('pm_prospNextId',prospNextId);
  closeModal('prospModalOverlay');renderCurrentTab();
});

// ===== Order CRUD =====
function openOrderAdd() {
  clearErrs('errOrderCust','errOrderName','errOrderDate','errOrderRevenue');
  document.getElementById('orderId').value=''; document.getElementById('orderProspectId').value='';
  document.getElementById('orderForm').reset();
  populateCustSelect('orderCust'); populateDeptSelect('orderDept',false);
  document.getElementById('orderModalTitle').textContent='受注登録';
  openModal('orderModalOverlay');
}
window.openOrderFromProspect = prospId => {
  const p=prospects.find(x=>x.id===prospId); if(!p) return;
  clearErrs('errOrderCust','errOrderName','errOrderDate','errOrderRevenue');
  populateCustSelect('orderCust'); populateDeptSelect('orderDept',false);
  document.getElementById('orderId').value='';
  document.getElementById('orderProspectId').value=prospId;
  document.getElementById('orderCust').value=p.customerId;
  document.getElementById('orderDept').value=p.departmentId||'';
  document.getElementById('orderName').value=p.name;
  document.getElementById('orderRevenue').value=p.expectedRevenue??'';
  document.getElementById('orderCostAmt').value=p.expectedCost??'';
  document.getElementById('orderAssignee').value=p.assignee||'';
  document.getElementById('orderDate').value=new Date().toISOString().slice(0,10);
  document.getElementById('orderModalTitle').textContent='受注登録（候補案件より）';
  openModal('orderModalOverlay');
};
window.openOrderEdit = id => {
  const o=orders.find(x=>x.id===id); if(!o) return;
  clearErrs('errOrderCust','errOrderName','errOrderDate','errOrderRevenue');
  populateCustSelect('orderCust'); populateDeptSelect('orderDept',false);
  document.getElementById('orderId').value=o.id;
  document.getElementById('orderProspectId').value=o.prospectId||'';
  document.getElementById('orderCust').value=o.customerId;
  document.getElementById('orderDept').value=o.departmentId||'';
  document.getElementById('orderName').value=o.name;
  document.getElementById('orderDate').value=o.orderDate;
  document.getElementById('orderRevenue').value=o.revenue;
  document.getElementById('orderCostAmt').value=o.expectedCost??'';
  document.getElementById('orderDelivery').value=o.deliveryDate||'';
  document.getElementById('orderAssignee').value=o.assignee||'';
  document.getElementById('orderNote').value=o.note||'';
  document.getElementById('orderModalTitle').textContent='受注編集';
  openModal('orderModalOverlay');
};
document.getElementById('orderForm').addEventListener('submit', e => {
  e.preventDefault(); clearErrs('errOrderCust','errOrderName','errOrderDate','errOrderRevenue');
  const cust=document.getElementById('orderCust').value,name=document.getElementById('orderName').value.trim(),date=document.getElementById('orderDate').value,rev=document.getElementById('orderRevenue').value;
  let ok=true;
  if(!cust){document.getElementById('errOrderCust').textContent='顧客を選択してください';ok=false;}
  if(!name){document.getElementById('errOrderName').textContent='案件名を入力してください';ok=false;}
  if(!date){document.getElementById('errOrderDate').textContent='受注日を入力してください';ok=false;}
  if(!rev){document.getElementById('errOrderRevenue').textContent='受注金額を入力してください';ok=false;}
  if(!ok) return;
  const prospectId=document.getElementById('orderProspectId').value?Number(document.getElementById('orderProspectId').value):null;
  const data={customerId:Number(cust),departmentId:document.getElementById('orderDept').value?Number(document.getElementById('orderDept').value):null,name,orderDate:date,revenue:Number(rev),expectedCost:document.getElementById('orderCostAmt').value!==''?Number(document.getElementById('orderCostAmt').value):null,deliveryDate:document.getElementById('orderDelivery').value,assignee:document.getElementById('orderAssignee').value.trim(),note:document.getElementById('orderNote').value.trim()};
  const id=document.getElementById('orderId').value;
  if(id){const i=orders.findIndex(o=>o.id===Number(id));if(i>=0)orders[i]={...orders[i],...data};}
  else {
    const newOrder={id:orderNextId++,prospectId,caseId:null,createdAt:new Date().toISOString(),...data};
    orders.push(newOrder);
    // Update prospect stage if came from prospect
    if(prospectId){const pi=prospects.findIndex(p=>p.id===prospectId);if(pi>=0){prospects[pi].orderId=newOrder.id;prospects[pi].stage='受注済';saveKey('pm_prospects',prospects);}}
  }
  saveKey('pm_orders',orders);saveKey('pm_orderNextId',orderNextId);
  closeModal('orderModalOverlay');renderCurrentTab();
});

// ===== Case from Order =====
window.openCaseFromOrder = orderId => {
  const o=orders.find(x=>x.id===orderId); if(!o) return;
  const cust=getCust(o.customerId);
  clearErrs('errCaseName','errCaseClient','errCaseStatus');
  populateDeptSelect('caseDept',false);
  document.getElementById('caseId').value='';
  document.getElementById('caseOrderId').value=orderId;
  document.getElementById('caseName').value=o.name;
  document.getElementById('caseClient').value=cust?.name||'';
  document.getElementById('caseDept').value=o.departmentId||'';
  document.getElementById('caseRevenue').value=o.revenue??'';
  document.getElementById('casePlannedCost').value=o.expectedCost??'';
  document.getElementById('caseStatus').value='新規';
  document.getElementById('casePriority').value='中';
  document.getElementById('caseAssignee').value=o.assignee||'';
  document.getElementById('caseDue').value=o.deliveryDate||'';
  document.getElementById('caseNote').value='';
  document.getElementById('caseModalTitle').textContent='案件登録（受注より）';
  openModal('caseModalOverlay');
};

// ===== Case CRUD =====
function openCaseAdd() {
  clearErrs('errCaseName','errCaseClient','errCaseStatus');
  document.getElementById('caseId').value=''; document.getElementById('caseOrderId').value='';
  document.getElementById('caseForm').reset();
  populateDeptSelect('caseDept',false);
  document.getElementById('caseModalTitle').textContent='案件登録';
  openModal('caseModalOverlay');
}
window.openCaseEdit = id => {
  const c=cases.find(x=>x.id===id); if(!c) return;
  clearErrs('errCaseName','errCaseClient','errCaseStatus');
  populateDeptSelect('caseDept',false);
  document.getElementById('caseId').value=c.id;
  document.getElementById('caseOrderId').value=c.orderId||'';
  document.getElementById('caseName').value=c.name;
  document.getElementById('caseClient').value=c.client;
  document.getElementById('caseDept').value=c.departmentId||'';
  document.getElementById('caseRevenue').value=c.plannedRevenue??'';
  document.getElementById('casePlannedCost').value=c.plannedCost??'';
  document.getElementById('caseStatus').value=c.status;
  document.getElementById('casePriority').value=c.priority||'中';
  document.getElementById('caseAssignee').value=c.assignee||'';
  document.getElementById('caseDue').value=c.dueDate||'';
  document.getElementById('caseNote').value=c.note||'';
  document.getElementById('caseModalTitle').textContent='案件編集';
  openModal('caseModalOverlay');
};
document.getElementById('caseForm').addEventListener('submit', e => {
  e.preventDefault(); clearErrs('errCaseName','errCaseClient','errCaseStatus');
  const name=document.getElementById('caseName').value.trim(),client=document.getElementById('caseClient').value.trim(),status=document.getElementById('caseStatus').value;
  let ok=true;
  if(!name){document.getElementById('errCaseName').textContent='案件名を入力してください';ok=false;}
  if(!client){document.getElementById('errCaseClient').textContent='顧客名を入力してください';ok=false;}
  if(!status){document.getElementById('errCaseStatus').textContent='ステータスを選択してください';ok=false;}
  if(!ok) return;
  const orderId=document.getElementById('caseOrderId').value?Number(document.getElementById('caseOrderId').value):null;
  const data={name,client,departmentId:document.getElementById('caseDept').value?Number(document.getElementById('caseDept').value):null,plannedRevenue:document.getElementById('caseRevenue').value!==''?Number(document.getElementById('caseRevenue').value):null,plannedCost:document.getElementById('casePlannedCost').value!==''?Number(document.getElementById('casePlannedCost').value):null,status,priority:document.getElementById('casePriority').value,assignee:document.getElementById('caseAssignee').value.trim(),dueDate:document.getElementById('caseDue').value,note:document.getElementById('caseNote').value.trim(),orderId};
  const id=document.getElementById('caseId').value;
  if(id){const i=cases.findIndex(c=>c.id===Number(id));if(i>=0)cases[i]={...cases[i],...data};}
  else {
    const newCase={id:caseNextId++,createdAt:new Date().toISOString(),...data};
    cases.push(newCase);
    // Link order → case
    if(orderId){const oi=orders.findIndex(o=>o.id===orderId);if(oi>=0){orders[oi].caseId=newCase.id;saveKey('pm_orders',orders);}}
  }
  saveKey('pm_cases',cases);saveKey('pm_caseNextId',caseNextId);
  closeModal('caseModalOverlay');renderCurrentTab();
});

// ===== Revenue CRUD =====
function openRevAdd() {
  clearErrs('errRevCase','errRevDate','errRevAmount');
  document.getElementById('revId').value=''; document.getElementById('revForm').reset();
  populateCaseSelect('revCase');
  document.getElementById('revModalTitle').textContent='売上登録'; openModal('revModalOverlay');
}
window.openRevEdit = id => {
  const r=revenues.find(x=>x.id===id); if(!r) return;
  clearErrs('errRevCase','errRevDate','errRevAmount');
  populateCaseSelect('revCase');
  document.getElementById('revId').value=r.id; document.getElementById('revCase').value=r.caseId;
  document.getElementById('revDate').value=r.date; document.getElementById('revAmount').value=r.amount;
  document.getElementById('revNote').value=r.note||'';
  document.getElementById('revModalTitle').textContent='売上編集'; openModal('revModalOverlay');
};
document.getElementById('revForm').addEventListener('submit', e => {
  e.preventDefault(); clearErrs('errRevCase','errRevDate','errRevAmount');
  const cid=document.getElementById('revCase').value,date=document.getElementById('revDate').value,amt=document.getElementById('revAmount').value;
  let ok=true;
  if(!cid){document.getElementById('errRevCase').textContent='案件を選択してください';ok=false;}
  if(!date){document.getElementById('errRevDate').textContent='日付を入力してください';ok=false;}
  if(!amt){document.getElementById('errRevAmount').textContent='金額を入力してください';ok=false;}
  if(!ok) return;
  const data={caseId:Number(cid),date,amount:Number(amt),note:document.getElementById('revNote').value.trim()};
  const id=document.getElementById('revId').value;
  if(id){const i=revenues.findIndex(r=>r.id===Number(id));if(i>=0)revenues[i]={...revenues[i],...data};}
  else revenues.push({id:revNextId++,...data});
  saveKey('pm_revenues',revenues);saveKey('pm_revNextId',revNextId);
  closeModal('revModalOverlay');renderCurrentTab();
});

// ===== Cost CRUD =====
function openCostAdd() {
  clearErrs('errCostCase','errCostCat','errCostDate','errCostAmount');
  document.getElementById('costId').value=''; document.getElementById('costForm').reset();
  populateCaseSelect('costCase');
  document.getElementById('costModalTitle').textContent='原価登録'; openModal('costModalOverlay');
}
window.openCostEdit = id => {
  const c=costs.find(x=>x.id===id); if(!c) return;
  clearErrs('errCostCase','errCostCat','errCostDate','errCostAmount');
  populateCaseSelect('costCase');
  document.getElementById('costId').value=c.id; document.getElementById('costCase').value=c.caseId;
  document.getElementById('costCat').value=c.category; document.getElementById('costDate').value=c.date;
  document.getElementById('costAmount').value=c.amount; document.getElementById('costNote').value=c.note||'';
  document.getElementById('costModalTitle').textContent='原価編集'; openModal('costModalOverlay');
};
document.getElementById('costForm').addEventListener('submit', e => {
  e.preventDefault(); clearErrs('errCostCase','errCostCat','errCostDate','errCostAmount');
  const cid=document.getElementById('costCase').value,cat=document.getElementById('costCat').value,date=document.getElementById('costDate').value,amt=document.getElementById('costAmount').value;
  let ok=true;
  if(!cid){document.getElementById('errCostCase').textContent='案件を選択してください';ok=false;}
  if(!cat){document.getElementById('errCostCat').textContent='カテゴリを選択してください';ok=false;}
  if(!date){document.getElementById('errCostDate').textContent='日付を入力してください';ok=false;}
  if(!amt){document.getElementById('errCostAmount').textContent='金額を入力してください';ok=false;}
  if(!ok) return;
  const data={caseId:Number(cid),category:cat,date,amount:Number(amt),note:document.getElementById('costNote').value.trim()};
  const id=document.getElementById('costId').value;
  if(id){const i=costs.findIndex(c=>c.id===Number(id));if(i>=0)costs[i]={...costs[i],...data};}
  else costs.push({id:costNextId++,...data});
  saveKey('pm_costs',costs);saveKey('pm_costNextId',costNextId);
  closeModal('costModalOverlay');renderCurrentTab();
});

// ===== Target CRUD =====
function openTargetAdd() {
  clearErrs('errTargetYear','errTargetDept');
  document.getElementById('targetId').value=''; document.getElementById('targetForm').reset();
  const yrSel=document.getElementById('targetYear');
  const y=new Date().getFullYear(); yrSel.innerHTML='';
  for(let i=y-1;i<=y+3;i++) yrSel.innerHTML+=`<option value="${i}">${i}年度</option>`;
  yrSel.value=y;
  const ds=document.getElementById('targetDept'); ds.innerHTML='<option value="0">全社</option>';
  depts.forEach(d=>ds.innerHTML+=`<option value="${d.id}">${esc(d.name)}</option>`);
  document.getElementById('targetModalTitle').textContent='目標設定'; openModal('targetModalOverlay');
}
window.openTargetEdit = (fy, deptId) => {
  clearErrs('errTargetYear','errTargetDept');
  const t=annualTargets.find(x=>x.fiscalYear===fy&&x.departmentId===deptId);
  const yrSel=document.getElementById('targetYear'); yrSel.innerHTML='';
  for(let i=fy-1;i<=fy+3;i++) yrSel.innerHTML+=`<option value="${i}">${i}年度</option>`;
  yrSel.value=fy;
  const ds=document.getElementById('targetDept'); ds.innerHTML='<option value="0">全社</option>';
  depts.forEach(d=>ds.innerHTML+=`<option value="${d.id}">${esc(d.name)}</option>`);
  ds.value=String(deptId);
  document.getElementById('targetId').value=t?.id||'';
  document.getElementById('targetOrderAmt').value=t?.orderTarget??'';
  document.getElementById('targetRevAmt').value=t?.revenueTarget??'';
  document.getElementById('targetModalTitle').textContent='目標編集'; openModal('targetModalOverlay');
};
document.getElementById('targetForm').addEventListener('submit', e => {
  e.preventDefault(); clearErrs('errTargetYear','errTargetDept');
  const fy=Number(document.getElementById('targetYear').value);
  const deptId=Number(document.getElementById('targetDept').value);
  const data={fiscalYear:fy,departmentId:deptId,orderTarget:document.getElementById('targetOrderAmt').value!==''?Number(document.getElementById('targetOrderAmt').value):0,revenueTarget:document.getElementById('targetRevAmt').value!==''?Number(document.getElementById('targetRevAmt').value):0};
  const id=document.getElementById('targetId').value;
  if(id){const i=annualTargets.findIndex(t=>t.id===Number(id));if(i>=0)annualTargets[i]={...annualTargets[i],...data};}
  else {
    // Check for duplicate
    const dup=annualTargets.findIndex(t=>t.fiscalYear===fy&&t.departmentId===deptId);
    if(dup>=0){annualTargets[dup]={...annualTargets[dup],...data};}
    else annualTargets.push({id:targetNextId++,...data});
  }
  saveKey('pm_targets',annualTargets);saveKey('pm_targetNextId',targetNextId);
  closeModal('targetModalOverlay');renderTargets();
});

// ===== Dept CRUD =====
function openDeptAdd() {
  clearErrs('errDeptName'); document.getElementById('deptId').value=''; document.getElementById('deptForm').reset();
  document.getElementById('deptModalTitle').textContent='部署登録'; openModal('deptModalOverlay');
}
window.openDeptEdit = id => {
  const d=depts.find(x=>x.id===id); if(!d) return;
  clearErrs('errDeptName');
  document.getElementById('deptId').value=d.id; document.getElementById('deptName').value=d.name;
  document.getElementById('deptManager').value=d.manager||''; document.getElementById('deptNote').value=d.note||'';
  document.getElementById('deptModalTitle').textContent='部署編集'; openModal('deptModalOverlay');
};
document.getElementById('deptForm').addEventListener('submit', e => {
  e.preventDefault(); clearErrs('errDeptName');
  const name=document.getElementById('deptName').value.trim();
  if(!name){document.getElementById('errDeptName').textContent='部署名を入力してください';return;}
  const data={name,manager:document.getElementById('deptManager').value.trim(),note:document.getElementById('deptNote').value.trim()};
  const id=document.getElementById('deptId').value;
  if(id){const i=depts.findIndex(d=>d.id===Number(id));if(i>=0)depts[i]={...depts[i],...data};}
  else depts.push({id:deptNextId++,...data});
  saveKey('pm_depts',depts);saveKey('pm_deptNextId',deptNextId);
  closeModal('deptModalOverlay');renderDepts();
});

// ===== Confirm Delete =====
window.openConfirm = (type,id,label) => {
  pendingDelete={type,id};
  document.getElementById('confirmMsg').textContent=`「${label}」を削除してもよろしいですか？`;
  openModal('confirmOverlay');
};
document.getElementById('confirmOk').addEventListener('click', () => {
  if(!pendingDelete) return;
  const {type,id}=pendingDelete;
  if(type==='cust')  { customers=customers.filter(c=>c.id!==id);     saveKey('pm_customers',customers); }
  if(type==='prosp') { prospects=prospects.filter(p=>p.id!==id);     saveKey('pm_prospects',prospects); }
  if(type==='order') { orders=orders.filter(o=>o.id!==id);           saveKey('pm_orders',orders); }
  if(type==='case')  { cases=cases.filter(c=>c.id!==id);             saveKey('pm_cases',cases); }
  if(type==='rev')   { revenues=revenues.filter(r=>r.id!==id);       saveKey('pm_revenues',revenues); }
  if(type==='cost')  { costs=costs.filter(c=>c.id!==id);             saveKey('pm_costs',costs); }
  if(type==='dept')  { depts=depts.filter(d=>d.id!==id);             saveKey('pm_depts',depts); }
  pendingDelete=null; closeModal('confirmOverlay'); renderCurrentTab();
});
document.getElementById('confirmCancel').addEventListener('click', ()=>closeModal('confirmOverlay'));

// ===== Header button =====
document.getElementById('btnHeaderAdd').addEventListener('click', () => {
  if(currentTab==='customers') openCustAdd();
  else if(currentTab==='prospects') openProspAdd();
  else if(currentTab==='orders')    openOrderAdd();
  else if(currentTab==='cases')     openCaseAdd();
  else if(currentTab==='revenue')   openRevAdd();
  else if(currentTab==='cost')      openCostAdd();
  else if(currentTab==='targets')   openTargetAdd();
  else if(currentTab==='dept')      openDeptAdd();
});

// ===== Nav =====
document.querySelectorAll('.nav-tab').forEach(btn => btn.addEventListener('click', ()=>showTab(btn.dataset.tab)));

// ===== Close modals =====
document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click',()=>closeModal(btn.dataset.close)));
['custModalOverlay','prospModalOverlay','orderModalOverlay','caseModalOverlay','revModalOverlay','costModalOverlay','targetModalOverlay','deptModalOverlay','confirmOverlay']
  .forEach(id=>document.getElementById(id).addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal(id);}));

// ===== Filters =====
document.getElementById('custSearch').addEventListener('input',e=>{F.custSearch=e.target.value;renderCustomers();});
document.getElementById('custFiltIndustry').addEventListener('change',e=>{F.custIndustry=e.target.value;renderCustomers();});
document.getElementById('custResetBtn').addEventListener('click',()=>{F.custSearch='';F.custIndustry='';document.getElementById('custSearch').value='';document.getElementById('custFiltIndustry').value='';renderCustomers();});

document.getElementById('prospFiltDept').addEventListener('change',e=>{F.prospDept=e.target.value;renderProspects();});
document.getElementById('prospFiltStage').addEventListener('change',e=>{F.prospStage=e.target.value;renderProspects();});
document.getElementById('prospFiltAssignee').addEventListener('change',e=>{F.prospAssignee=e.target.value;renderProspects();});
document.getElementById('prospResetBtn').addEventListener('click',()=>{F.prospDept='';F.prospStage='';F.prospAssignee='';['prospFiltDept','prospFiltStage','prospFiltAssignee'].forEach(id=>document.getElementById(id).value='');renderProspects();});

document.getElementById('orderFiltDept').addEventListener('change',e=>{F.orderDept=e.target.value;renderOrders();});
document.getElementById('orderFiltMonth').addEventListener('change',e=>{F.orderMonth=e.target.value;renderOrders();});
document.getElementById('orderFiltStatus').addEventListener('change',e=>{F.orderStatus=e.target.value;renderOrders();});
document.getElementById('orderResetBtn').addEventListener('click',()=>{F.orderDept='';F.orderMonth='';F.orderStatus='';['orderFiltDept','orderFiltMonth','orderFiltStatus'].forEach(id=>document.getElementById(id).value='');renderOrders();});

document.getElementById('caseSearch').addEventListener('input',e=>{F.caseSearch=e.target.value;renderCases();});
document.getElementById('caseFiltDept').addEventListener('change',e=>{F.caseDept=e.target.value;renderCases();});
document.getElementById('caseFiltStatus').addEventListener('change',e=>{F.caseStatus=e.target.value;renderCases();});
document.getElementById('caseFiltPriority').addEventListener('change',e=>{F.casePriority=e.target.value;renderCases();});
document.getElementById('caseResetBtn').addEventListener('click',()=>{F.caseSearch='';F.caseDept='';F.caseStatus='';F.casePriority='';['caseSearch','caseFiltDept','caseFiltStatus','caseFiltPriority'].forEach(id=>document.getElementById(id).value='');renderCases();});

document.getElementById('revFiltDept').addEventListener('change',e=>{F.revDept=e.target.value;renderRevenue();});
document.getElementById('revFiltCase').addEventListener('change',e=>{F.revCase=e.target.value;renderRevenue();});
document.getElementById('revFiltMonth').addEventListener('change',e=>{F.revMonth=e.target.value;renderRevenue();});
document.getElementById('revResetBtn').addEventListener('click',()=>{F.revDept='';F.revCase='';F.revMonth='';['revFiltDept','revFiltCase','revFiltMonth'].forEach(id=>document.getElementById(id).value='');renderRevenue();});

document.getElementById('costFiltDept').addEventListener('change',e=>{F.costDept=e.target.value;renderCost();});
document.getElementById('costFiltCase').addEventListener('change',e=>{F.costCase=e.target.value;renderCost();});
document.getElementById('costFiltCat').addEventListener('change',e=>{F.costCat=e.target.value;renderCost();});
document.getElementById('costFiltMonth').addEventListener('change',e=>{F.costMonth=e.target.value;renderCost();});
document.getElementById('costResetBtn').addEventListener('click',()=>{F.costDept='';F.costCase='';F.costCat='';F.costMonth='';['costFiltDept','costFiltCase','costFiltCat','costFiltMonth'].forEach(id=>document.getElementById(id).value='');renderCost();});

document.getElementById('pnlFiltDept').addEventListener('change',e=>{F.pnlDept=e.target.value;renderPnL();});
document.getElementById('pnlFiltYear').addEventListener('change',e=>{F.pnlYear=e.target.value;renderPnL();});
document.getElementById('pnlView').addEventListener('change',e=>{F.pnlView=e.target.value;renderPnL();});

document.getElementById('targetFiltYear').addEventListener('change',e=>{F.targetYear=e.target.value;renderTargets();});

// ===== Case table sort =====
document.querySelectorAll('#caseTable th[data-sort]').forEach(th=>th.addEventListener('click',()=>{const k=th.dataset.sort;if(caseSortKey===k)caseSortDir=caseSortDir==='asc'?'desc':'asc';else{caseSortKey=k;caseSortDir='asc';}renderCases();}));
document.querySelectorAll('[data-table="rev"]').forEach(th=>th.addEventListener('click',()=>{const k=th.dataset.sort;if(revSortKey===k)revSortDir=revSortDir==='asc'?'desc':'asc';else{revSortKey=k;revSortDir='asc';}renderRevenue();}));
document.querySelectorAll('[data-table="cost"]').forEach(th=>th.addEventListener('click',()=>{const k=th.dataset.sort;if(costSortKey===k)costSortDir=costSortDir==='asc'?'desc':'asc';else{costSortKey=k;costSortDir='asc';}renderCost();}));

// ===== Init =====
showTab('dashboard');
