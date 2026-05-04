const Department = require('../models/Department');

exports.index = (req, res) => {
  const departments = Department.findAll().map(d => ({
    ...d,
    employeeCount: Department.countEmployees(d.id),
  }));
  res.render('departments/index', { departments });
};

exports.newForm = (req, res) => {
  res.render('departments/new', { errors: [], data: {} });
};

exports.create = (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.render('departments/new', { errors: ['部署名は必須です'], data: req.body });
  }
  try {
    Department.create({ name: name.trim() });
    res.redirect('/departments?flash=' + encodeURIComponent('部署を登録しました') + '&flashType=success');
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.render('departments/new', { errors: ['この部署名はすでに存在します'], data: req.body });
    }
    throw e;
  }
};

exports.editForm = (req, res) => {
  const dept = Department.findById(req.params.id);
  if (!dept) return res.status(404).render('error', { message: '部署が見つかりません', status: 404 });
  res.render('departments/edit', { dept, errors: [] });
};

exports.update = (req, res) => {
  const dept = Department.findById(req.params.id);
  if (!dept) return res.status(404).render('error', { message: '部署が見つかりません', status: 404 });
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.render('departments/edit', { dept, errors: ['部署名は必須です'] });
  }
  try {
    Department.update(req.params.id, { name: name.trim() });
    res.redirect('/departments?flash=' + encodeURIComponent('部署を更新しました') + '&flashType=success');
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.render('departments/edit', { dept, errors: ['この部署名はすでに存在します'] });
    }
    throw e;
  }
};

exports.destroy = (req, res) => {
  const count = Department.countEmployees(req.params.id);
  if (count > 0) {
    return res.redirect('/departments?flash=' + encodeURIComponent(`この部署には${count}名の社員が所属しています。先に社員の部署を変更してください。`) + '&flashType=warning');
  }
  Department.destroy(req.params.id);
  res.redirect('/departments?flash=' + encodeURIComponent('部署を削除しました') + '&flashType=success');
};
