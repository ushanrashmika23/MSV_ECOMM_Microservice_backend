const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const userRoutes = require('./routes/user.route');
app.use('/api/v1/', userRoutes);

const startServer = async () => {
    try {
        await mongoose.connect(process.env.DB_STRING);
        console.log('Connected to MongoDB');

        app.listen(process.env.PORT, () => {
            console.log(`Auth service running on port ${process.env.PORT}`);
        });
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

startServer();
