const db = require('../config/database');

const Department = {
  findAll() {
    return db.prepare('SELECT * FROM departments ORDER BY name').all();
  },

  findById(id) {
    return db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
  },

  create({ name }) {
    const stmt = db.prepare('INSERT INTO departments (name) VALUES (?)');
    const result = stmt.run(name);
    return result.lastInsertRowid;
  },

  update(id, { name }) {
    db.prepare(
      "UPDATE departments SET name = ?, updated_at = datetime('now','localtime') WHERE id = ?"
    ).run(name, id);
  },

  destroy(id) {
    db.prepare('DELETE FROM departments WHERE id = ?').run(id);
  },

  countEmployees(id) {
    return db.prepare('SELECT COUNT(*) as count FROM employees WHERE department_id = ?').get(id).count;
  },
};

module.exports = Department;
