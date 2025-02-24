const WebSocket = require('ws');
const websocketController = require('./controllers/websocketController');

function initializeWebSocketServer() {
    const wss = new WebSocket.Server({ port: 8080 });
    console.log('WebSocket Server running on port 8080');

    wss.on('connection', (ws) => {
        console.log('Client connected');

        ws.on('message', (data) => {
            websocketController.handleMessage(wss, ws, data);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });
}

module.exports = { initializeWebSocketServer };
