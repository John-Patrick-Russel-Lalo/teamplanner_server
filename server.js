const express = require('express');
const http = require('http');
const WebSocket = require('ws');

// Set up Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Optional: send a response to pings or direct visits
app.get('/', (req, res) => {
  res.send('WebSocket server is running!');
});

// Create HTTP server and attach both Express and WebSocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();

wss.on('connection', (socket) => {
  clients.add(socket);
  console.log('Client connected');

  socket.on('message', (message) => {
    const text = message.toString();

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

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
