const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, category_id, stock } = req.body;

        const result = await pool.query(
            `INSERT INTO products (id, name, description, price, category_id, stock)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [uuidv4(), name, description, price, category_id, stock]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getProducts = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM products WHERE id = $1',
            [req.params.id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { name, description, price, stock } = req.body;

        const result = await pool.query(
            `UPDATE products
       SET name=$1, description=$2, price=$3, stock=$4, updated_at=NOW()
       WHERE id=$5 RETURNING *`,
            [name, description, price, stock, req.params.id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM products WHERE id = $1',
            [req.params.id]
        );

        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};