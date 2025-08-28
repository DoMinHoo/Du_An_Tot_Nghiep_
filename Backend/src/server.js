require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const app = require('./app');
const connectDB = require('./config/db');
const socketIo = require('socket.io');

const PORT = process.env.PORT || 5000;

connectDB();
app.use(cors());

const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174'], // Cho phép cả hai origin
        methods: ['GET', 'POST'],
    }
});
app.set('io', io);

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join-room', (userId) => {
        console.log(`User ${userId} joined the room`);
        socket.join(userId);
    })

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });

})

server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});