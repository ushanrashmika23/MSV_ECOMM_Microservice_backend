const pool = require('../configs/db');
const { v4: uuidv4 } = require('uuid');

exports.createCategory = async (req, res) => {
    try {
        const { name, parent_id } = req.body;

        const result = await pool.query(
            `INSERT INTO categories (id, name, parent_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [uuidv4(), name, parent_id || null]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM categories WHERE id = $1',
            [req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM categories WHERE id = $1',
            [req.params.id]
        );
        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};