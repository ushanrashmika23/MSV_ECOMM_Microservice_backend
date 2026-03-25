const express = require('express');
const cors = require('cors');
require('dotenv').config();

const productRoutes = require('./routes/productRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1', productRoutes);

app.get('/', (req, res) => {
    res.send('Product Service Running 🚀');
});

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});