const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');

const app = express();

// Middleware
app.use(cors()); // ✅ Nếu frontend gọi từ domain khác
app.use(morgan('dev'));
app.use(express.json());

// serve ảnh từ thư mục /uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

console.log('__dirname:', __dirname);
console.log('Serving static from:', path.join(__dirname, 'uploads'));



// API routes
app.use('/api', routes);


module.exports = app;
