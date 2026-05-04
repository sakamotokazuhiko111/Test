const Employee = require('../models/Employee');
const Department = require('../models/Department');

function validate(data) {
  const errors = [];
  if (!data.name || !data.name.trim()) errors.push('氏名は必須です');
  if (data.email && data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.push('メールアドレスの形式が正しくありません');
  }
  return errors;
}

exports.index = (req, res) => {
  const filters = {
    name: req.query.name || '',
    departmentId: req.query.departmentId || '',
    position: req.query.position || '',
    status: req.query.status || '',
  };
  const employees = Employee.findAll(filters);
  const departments = Department.findAll();
  res.render('employees/index', { employees, departments, filters });
};

exports.newForm = (req, res) => {
  const departments = Department.findAll();
  res.render('employees/new', { errors: [], data: {}, departments });
};

exports.create = (req, res) => {
  const errors = validate(req.body);
  if (errors.length) {
    const departments = Department.findAll();
    return res.render('employees/new', { errors, data: req.body, departments });
  }
  try {
    const id = Employee.create(req.body);
    res.redirect(`/employees/${id}?flash=` + encodeURIComponent('社員を登録しました') + '&flashType=success');
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      const departments = Department.findAll();
      return res.render('employees/new', { errors: ['このメールアドレスはすでに使用されています'], data: req.body, departments });
    }
    throw e;
  }
};

exports.show = (req, res) => {
  const employee = Employee.findById(req.params.id);
  if (!employee) return res.status(404).render('error', { message: '社員が見つかりません', status: 404 });
  res.render('employees/show', { employee });
};

exports.editForm = (req, res) => {
  const employee = Employee.findById(req.params.id);
  if (!employee) return res.status(404).render('error', { message: '社員が見つかりません', status: 404 });
  const departments = Department.findAll();
  res.render('employees/edit', { employee, errors: [], departments });
};

exports.update = (req, res) => {
  const employee = Employee.findById(req.params.id);
  if (!employee) return res.status(404).render('error', { message: '社員が見つかりません', status: 404 });
  const errors = validate(req.body);
  if (errors.length) {
    const departments = Department.findAll();
    return res.render('employees/edit', { employee: { ...employee, ...req.body }, errors, departments });
  }
  try {
    Employee.update(req.params.id, req.body);
    res.redirect(`/employees/${req.params.id}?flash=` + encodeURIComponent('社員情報を更新しました') + '&flashType=success');
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      const departments = Department.findAll();
      return res.render('employees/edit', { employee: { ...employee, ...req.body }, errors: ['このメールアドレスはすでに使用されています'], departments });
    }
    throw e;
  }
};

exports.destroy = (req, res) => {
  Employee.destroy(req.params.id);
  res.redirect('/employees?flash=' + encodeURIComponent('社員を削除しました') + '&flashType=success');
};

exports.exportCsv = (req, res) => {
  const filters = {
    name: req.query.name || '',
    departmentId: req.query.departmentId || '',
    position: req.query.position || '',
    status: req.query.status || '',
  };
  const rows = Employee.getAllForCsv(filters);
  const headers = ['ID', '氏名', 'フリガナ', '部署', '役職', 'メール', '電話', '入社日', 'ステータス'];

  function csvCell(v) {
    return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  }

  const lines = [headers.map(csvCell).join(',')];
  for (const r of rows) {
    lines.push([
      r.id, r.name, r.name_kana, r.department_name, r.position,
      r.email, r.phone, r.hire_date, r.status === 'active' ? '在職' : '退職',
    ].map(csvCell).join(','));
  }

  const filename = `employees_${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('﻿' + lines.join('\r\n'));
};
