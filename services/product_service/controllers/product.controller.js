const pool = require('../configs/db');
const { v4: uuidv4 } = require('uuid');

const normalizeImages = (images) => {
    if (!Array.isArray(images)) return [];

    return images
        .filter((image) => image && image.image_url)
        .map((image) => ({
            image_url: image.image_url,
            is_primary: Boolean(image.is_primary),
        }));
};

const attachImagesToProduct = async (client, product) => {
    const imagesResult = await client.query(
        'SELECT * FROM product_images WHERE product_id = $1 ORDER BY id ASC',
        [product.id]
    );

    return {
        ...product,
        images: imagesResult.rows,
    };
};

exports.createProduct = async (req, res) => {
    const client = await pool.connect();

    try {
        const { name, description, price, category_id, stock, images } = req.body;
        const normalizedImages = normalizeImages(images);

        await client.query('BEGIN');

        const result = await client.query(
            `INSERT INTO products (id, name, description, price, category_id, stock)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [uuidv4(), name, description, price, category_id, stock]
        );

        const product = result.rows[0];

        for (const image of normalizedImages) {
            await client.query(
                `INSERT INTO product_images (id, product_id, image_url, is_primary)
                 VALUES ($1, $2, $3, $4)`,
                [uuidv4(), product.id, image.image_url, image.is_primary]
            );
        }

        const response = await attachImagesToProduct(client, product);

        await client.query('COMMIT');

        res.status(201).json(response);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

exports.getProducts = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products');
        const products = result.rows;

        const productsWithImages = await Promise.all(
            products.map(async (product) => {
                const imagesResult = await pool.query(
                    'SELECT * FROM product_images WHERE product_id = $1 ORDER BY id ASC',
                    [product.id]
                );

                return {
                    ...product,
                    images: imagesResult.rows,
                };
            })
        );

        res.json(productsWithImages);
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

        const product = result.rows[0];

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const imagesResult = await pool.query(
            'SELECT * FROM product_images WHERE product_id = $1 ORDER BY id ASC',
            [product.id]
        );

        return res.json({
            ...product,
            images: imagesResult.rows,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProduct = async (req, res) => {
    const client = await pool.connect();

    try {
        const { name, description, price, stock, images } = req.body;
        const shouldSyncImages = Array.isArray(images);
        const normalizedImages = normalizeImages(images);

        await client.query('BEGIN');

        const result = await client.query(
            `UPDATE products
       SET name=$1, description=$2, price=$3, stock=$4, updated_at=NOW()
       WHERE id=$5 RETURNING *`,
            [name, description, price, stock, req.params.id]
        );

        const product = result.rows[0];

        if (!product) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found' });
        }

        if (shouldSyncImages) {
            await client.query(
                'DELETE FROM product_images WHERE product_id = $1',
                [product.id]
            );

            for (const image of normalizedImages) {
                await client.query(
                    `INSERT INTO product_images (id, product_id, image_url, is_primary)
                     VALUES ($1, $2, $3, $4)`,
                    [uuidv4(), product.id, image.image_url, image.is_primary]
                );
            }
        }

        const response = await attachImagesToProduct(client, product);

        await client.query('COMMIT');

        return res.json(response);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

exports.deleteProduct = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query(
            'DELETE FROM product_images WHERE product_id = $1',
            [req.params.id]
        );

        const result = await client.query(
            'DELETE FROM products WHERE id = $1',
            [req.params.id]
        );

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found' });
        }

        await client.query('COMMIT');

        return res.json({ message: 'Product and associated images deleted' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};