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

let counts = 0;

function broadcastOnlineCount() {
  const countOnline = JSON.stringify({
    type: 'onlineCount',
    count: counts
  });

  for (let client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(countOnline);
    }
  }
}

wss.on('connection', (socket) => {
  clients.add(socket);
  counts++;
  console.log('Client connected');

  // Send online count to all clients
  broadcastOnlineCount();

  // Send chat history to the new client
  messageHistory.forEach((msg) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(msg);
    }
  });

  socket.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error('Invalid JSON:', message);
      return;
    }

    if (data.type === 'chat') {
      const fullMsg = JSON.stringify({
        type: 'chat',
        message: data.message
      });

      messageHistory.push(fullMsg);
      if (messageHistory.length > 200) messageHistory.shift();

      for (let client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(fullMsg);
        }
      }
    }
  });

  socket.on('close', () => {
    clients.delete(socket);
    counts--;
    console.log('Client disconnected');
    broadcastOnlineCount();
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
