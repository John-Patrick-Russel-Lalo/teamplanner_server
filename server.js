const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Pool } = require('pg');
require('dotenv').config();

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

// PostgreSQL connection
const pool = new Pool({
  connectionString: "postgres://neondb_owner:npg_ROonCGkQK96e@ep-floral-wildflower-a1hy774a-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
  ssl: {
    rejectUnauthorized: false,
  },
});

function broadcastOnlineCount() {
  const countOnline = JSON.stringify({
    type: 'onlineCount',
    count: counts,
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

  broadcastOnlineCount();

  messageHistory.forEach((msg) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(msg);
    }
  });

  socket.on('message', async (message) => {
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
        message: data.message,
      });

      messageHistory.push(fullMsg);
      if (messageHistory.length > 200) messageHistory.shift();

      for (let client of clients) {
        if (client !== socket && client.readyState === WebSocket.OPEN) {
          client.send(fullMsg);
        }
      }
    }

    // New: Save board updates to DB
    if (data.type === 'updateBoard') {
      const { projectId, boardData } = data;

      if (!projectId || !boardData) return;

      try {
        await pool.query(
          'UPDATE projects SET board = $1 WHERE id = $2',
          [JSON.stringify(boardData), projectId]
        );

        const updateMsg = JSON.stringify({
          type: 'updateBoard',
          projectId,
          boardData,
        });

        for (let client of clients) {
          if (client !== socket && client.readyState === WebSocket.OPEN) {
            client.send(updateMsg);
          }
        }
      } catch (err) {
        console.error('DB update error:', err);
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
