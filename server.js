// server.js
const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 3000 });

const clients = new Set();

server.on('connection', (socket) => {
  clients.add(socket);
  console.log('Client connected');

  socket.on('message', (message) => {
    // Ensure message is a string
    const text = message.toString();

    // Broadcast to all clients (including sender if you want)
    for (let client of clients) {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
            client.send(text)
      }
    }
  });

  socket.on('close', () => {
    clients.delete(socket);
    console.log('Client disconnected');
  });
});
