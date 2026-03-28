const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { rbac } = require('../middleware/rbac.middleware');

router.post('/', authMiddleware, rbac(['admin']), categoryController.createCategory);
router.get('/all', authMiddleware, categoryController.getCategories);
router.get('/:id', authMiddleware, categoryController.getCategoryById);
router.delete('/:id', authMiddleware, rbac(['admin']), categoryController.deleteCategory);

module.exports = router;