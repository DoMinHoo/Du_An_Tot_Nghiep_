const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const uploadRoute = require("./routes/upload.route");

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

// serve ảnh từ thư mục /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('Serving static files from:', path.join(__dirname, 'uploads'));

console.log('__dirname:', __dirname);
console.log('Serving static from:', path.join(__dirname, 'uploads'));



// API routes
app.use('/api', routes);
app.use("/api/upload", uploadRoute);

module.exports = app;
