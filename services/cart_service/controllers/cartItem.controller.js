const CartItem = require('../models/cartItem.model');

exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity, price } = req.body;
        const createdCartItem = await new CartItem({
            userId: req.user.userId,
            productId,
            quantity,
            price,
            totalPrice: price * quantity,
        }).save();
        res.status(201).json(createdCartItem);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCartItems = async (req, res) => {
    try {
        const { userId } = req.user;
        const cartItems = await CartItem.find({ userId });
        res.json(cartItems);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, price } = req.body;

        const existingCartItem = await CartItem.findOne({ _id: id, userId: req.user.userId });
        if (!existingCartItem) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        existingCartItem.quantity = quantity;
        if (typeof price !== 'undefined') {
            existingCartItem.price = price;
        }
        existingCartItem.totalPrice = existingCartItem.price * existingCartItem.quantity;

        const updatedCartItem = await existingCartItem.save();
        res.json(updatedCartItem);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedCartItem = await CartItem.findOneAndDelete({ _id: id, userId: req.user.userId });
        if (!deletedCartItem) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.clearCart = async (req, res) => {
    try {
        const { userId } = req.user;
        await CartItem.deleteMany({ userId });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

