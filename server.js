const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('WebSocket server is running!');
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();
const messageHistory = [];

wss.on('connection', (socket) => {
  clients.add(socket);
  console.log('Client connected');

  // Send chat history to the new client
  messageHistory.forEach((msg) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(msg);
    }
  });

  socket.on('message', (message) => {
    const text = message.toString();

    // Store message in history
    messageHistory.push(text);
    if (messageHistory.length > 100) messageHistory.shift(); // Optional: keep only last 100

    // Broadcast to all other clients
    for (let client of clients) {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(text);
      }
    }
  });

  socket.on('close', () => {
    clients.delete(socket);
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
