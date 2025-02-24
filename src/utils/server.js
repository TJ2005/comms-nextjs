const express = require('express');
const db = require('./database');
const { initializeWebSocketServer } = require('./websocketServer');

const app = express();
app.use(express.json());

// Initialize the database schema
db.initialize();

// Start WebSocket server
initializeWebSocketServer();

// Start HTTP server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`HTTP Server running on port ${PORT}`);
});
    