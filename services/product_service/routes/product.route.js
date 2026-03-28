const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { rbac } = require('../middleware/rbac.middleware');

router.post('/', authMiddleware, rbac(['admin']), productController.createProduct);
router.get('/', authMiddleware, productController.getProducts);
router.get('/:id', authMiddleware, productController.getProductById);
router.put('/:id', authMiddleware, rbac(['admin']), productController.updateProduct);
router.delete('/:id', authMiddleware, rbac(['admin']), productController.deleteProduct);

module.exports = router;