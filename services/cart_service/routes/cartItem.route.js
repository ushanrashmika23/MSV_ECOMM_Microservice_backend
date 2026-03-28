const cartItemController = require('../controllers/cartItem.controller');
const authMiddleware = require('../middleware/auth.middleware');
const rabc = require('../middleware/rbac.middleware');
const express = require('express');
const router = express.Router();

router.post('/', authMiddleware, cartItemController.addToCart);
router.get('/', authMiddleware, cartItemController.getCartItems);
router.put('/:id', authMiddleware, cartItemController.updateCartItem);
router.delete('/:id', authMiddleware, cartItemController.removeFromCart);
router.delete('/clear', authMiddleware, cartItemController.clearCart);

module.exports = router;