const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

exports.addImage = async (req, res) => {
    try {
        const { product_id, image_url, is_primary } = req.body;

        const result = await pool.query(
            `INSERT INTO product_images (id, product_id, image_url, is_primary)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [uuidv4(), product_id, image_url, is_primary || false]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getImagesByProduct = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM product_images WHERE product_id = $1',
            [req.params.productId]
        );

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteImage = async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM product_images WHERE id = $1',
            [req.params.id]
        );

        res.json({ message: 'Image deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};