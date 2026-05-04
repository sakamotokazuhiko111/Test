const db = require('../config/database');

function buildWhere(filters) {
  const conditions = ['1=1'];
  const params = {};
  if (filters.name) {
    conditions.push('e.name LIKE :name');
    params.name = `%${filters.name}%`;
  }
  if (filters.departmentId) {
    conditions.push('e.department_id = :departmentId');
    params.departmentId = filters.departmentId;
  }
  if (filters.position) {
    conditions.push('e.position LIKE :position');
    params.position = `%${filters.position}%`;
  }
  if (filters.status) {
    conditions.push('e.status = :status');
    params.status = filters.status;
  }
  return { where: conditions.join(' AND '), params };
}

const baseSelect = `
  SELECT e.*, d.name AS department_name
  FROM employees e
  LEFT JOIN departments d ON e.department_id = d.id
`;

const Employee = {
  findAll(filters = {}) {
    const { where, params } = buildWhere(filters);
    return db.prepare(`${baseSelect} WHERE ${where} ORDER BY e.id DESC`).all(params);
  },

  findById(id) {
    return db.prepare(`${baseSelect} WHERE e.id = ?`).get(id);
  },

  create(data) {
    const stmt = db.prepare(`
      INSERT INTO employees (name, name_kana, department_id, position, email, phone, hire_date, status, notes)
      VALUES (:name, :name_kana, :department_id, :position, :email, :phone, :hire_date, :status, :notes)
    `);
    const result = stmt.run({
      name: data.name,
      name_kana: data.name_kana || null,
      department_id: data.department_id || null,
      position: data.position || null,
      email: data.email || null,
      phone: data.phone || null,
      hire_date: data.hire_date || null,
      status: data.status || 'active',
      notes: data.notes || null,
    });
    return result.lastInsertRowid;
  },

  update(id, data) {
    db.prepare(`
      UPDATE employees
      SET name = :name, name_kana = :name_kana, department_id = :department_id,
          position = :position, email = :email, phone = :phone, hire_date = :hire_date,
          status = :status, notes = :notes, updated_at = datetime('now','localtime')
      WHERE id = :id
    `).run({
      id,
      name: data.name,
      name_kana: data.name_kana || null,
      department_id: data.department_id || null,
      position: data.position || null,
      email: data.email || null,
      phone: data.phone || null,
      hire_date: data.hire_date || null,
      status: data.status || 'active',
      notes: data.notes || null,
    });
  },

  destroy(id) {
    db.prepare('DELETE FROM employees WHERE id = ?').run(id);
  },

  getAllForCsv(filters = {}) {
    const { where, params } = buildWhere(filters);
    return db.prepare(`${baseSelect} WHERE ${where} ORDER BY e.id`).all(params);
  },
};

module.exports = Employee;
