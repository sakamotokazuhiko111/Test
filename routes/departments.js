const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/departmentController');

router.get('/', ctrl.index);
router.get('/new', ctrl.newForm);
router.post('/', ctrl.create);
router.get('/:id/edit', ctrl.editForm);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.destroy);

module.exports = router;
