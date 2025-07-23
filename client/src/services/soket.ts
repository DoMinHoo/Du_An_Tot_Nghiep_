import { io } from 'socket.io-client';

const socket = io('http://localhost:5000'); // Thay đổi URL nếu cần

export default socket