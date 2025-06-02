const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path'); // ✅ THIẾU DÒNG NÀY
const routes = require('./routes');

const app = express();

// Middleware
app.use(cors()); // ✅ Nếu frontend gọi từ domain khác
app.use(morgan('dev'));
app.use(express.json());

// Static folder for image access
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api', routes);

module.exports = app;
