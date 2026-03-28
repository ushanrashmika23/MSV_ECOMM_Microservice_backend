const express = require('express');
const router = express.Router();
const controller = require('../controllers/image.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { rbac } = require('../middleware/rbac.middleware');

router.post('/', authMiddleware, rbac(['admin']), controller.addImage);
router.get('/product/:productId', authMiddleware, controller.getImagesByProduct);
router.delete('/:id', authMiddleware, rbac(['admin']), controller.deleteImage);

module.exports = router;