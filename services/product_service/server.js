const express = require('express');
const cors = require('cors');
require('dotenv').config();

const productRoutes = require('./routes/product.route');
const categoryRoutes = require('./routes/category.route');
const imageRoutes = require('./routes/image.route');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1', productRoutes);
app.use('/api/v1/category', categoryRoutes);
app.use('/api/v1', imageRoutes);

app.get('/', (req, res) => {
    res.send('Product Service Running 🚀');
});

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});