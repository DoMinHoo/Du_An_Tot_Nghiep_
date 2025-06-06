const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');

const app = express();

// ✅ Load các model trước khi sử dụng routes
require('./models/user.model');
require('./models/products.model');
require('./models/product_variations.model'); // ✅ sửa đúng tên file
require('./models/order.model');

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Static folder for image access
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api', routes);

module.exports = app;
