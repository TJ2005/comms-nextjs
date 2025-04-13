const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const { isUserInSession, sendMessage,editMessage,deleteMessage } = require('./database');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store active WebSocket connections by session
const sessions = new Map();

wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection attempt');

    // Parse cookies from the request
    const cookies = req.headers.cookie;
    if (!cookies) {
        console.log('No cookies found, rejecting connection');
        ws.close();
        return;
    }

    const cookieObj = Object.fromEntries(cookies.split('; ').map(c => c.split('=')));
    const userId = cookieObj.userId;
    const sessionId = cookieObj.sessionId;

    if (!userId || !sessionId) {
        console.log('Missing userId or sessionId in cookies, rejecting connection');
        ws.close();
        return;
    }

    // Add custom properties to WebSocket object for later use
    ws.userId = userId;
    ws.sessionId = sessionId;

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            const { username, content, messageType } = data;

            if (!username || !content || !messageType) {
                console.log('Bad message format');
                return;
            }

            // Confirm that the user is part of the session
            const valid = await isUserInSession(userId, sessionId);
            if (!valid) {
                console.log(`Unauthorized user ${userId} trying to send message in session ${sessionId}`);
                ws.close();
                return;
            }

            // Register the websocket connection only after validation
            if (!sessions.has(sessionId)) {
                sessions.set(sessionId, new Set());
            }
            sessions.get(sessionId).add(ws);

            // Save the message to the database
            messageId = await sendMessage(userId, sessionId, content, null, messageType);

            // Broadcast the message to everyone in the session
            sessions.get(sessionId).forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ username, userId, content, messageType, messageId}));
                }
            });

        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    ws.on('close', () => {
        console.log(`WebSocket connection closed for user ${userId} in session ${sessionId}`);
        sessions.forEach((clients, sessionId) => {
            clients.delete(ws);
            if (clients.size === 0) {
                sessions.delete(sessionId);
            }
        });
    });
});

server.listen(8080, () => {
    console.log('WebSocket server running on port 8080');
});
