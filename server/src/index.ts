import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import 'dotenv/config'; // Loads .env file

const app = express();
app.use(cors()); // Allow all origins

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

// Simple HTTP route to check if it's running
app.get('/', (req, res) => {
  res.send(`Tic-Tac-Toe Server is live! ${new Date().toISOString()}`);
});

// Simple Socket.io connection test
io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`);

  // Send a welcome message to the client that just connected
  socket.emit('welcome', 'Welcome to the server!');

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});