const sessionService = require('../services/sessionService');
const messageService = require('../services/messageService.js');

exports.handleMessage = async (wss, ws, data) => {
    try {
        const { action, ...params } = JSON.parse(data);
        let response;

        switch (action) {
            case 'logOn': {
                const ids = await sessionService.joinOrCreateSession(params.username, params.sessionCode);
                response = { action: 'logOnResponse', status: 'success', data: ids };
                break;
            }
            case 'sendMessage': {
                await messageService.sendMessage(params.userId, params.sessionId, params.message);
                response = { action: 'sendMessageResponse', status: 'success' };

                // Broadcast new messages to all clients
                /**
                 * Creates a JSON string representing a broadcast message.
                 *
                 * The message contains the following properties:
                 * - action: A string indicating the type of action ('broadcastMessage').
                 * - username: The username of the sender.
                 * - content: The message content.
                 * - timestamp: The time when the message was created.
                 *
                 * @param {Object} params - The parameters for the broadcast message.
                 * @param {string} params.username - The username of the sender.
                 * @param {string} params.message - The content of the message.
                 * @returns {string} A JSON string representing the broadcast message.
                 */
                const broadcastMessage = JSON.stringify({
                    action: 'broadcastMessage',
                    username: params.username,
                    content: params.message,
                    timestamp: new Date(),
                });
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(broadcastMessage);
                    }
                });
                break;
            }
            case 'getMessages': {
                const messages = await messageService.getMessages(params.sessionId, params.limit || 100);
                response = { action: 'getMessagesResponse', status: 'success', data: messages };
                break;
            }
            case 'editMessage': {
                // Add logic here to take the message id and edit it
                // validate if invoker owns the message
                const hasPermission = await messageService.checkMessage(params.messageId, params.userId, params.sessionId);
                if (!hasPermission) {
                    response = { action: 'editMessageResponse', status: 'error', error: 'Permission denied' };
                    break;
                }
                await messageService.editMessage(params.messageId, params.newContent);
                response = { action: 'editMessageResponse', status: 'success' };
            }
            case 'deleteMessage':{
                // Add Logic here to take the message id and delete it
                // validate if invoker owns the message
            }
            case 'changeSetting':{
                // Check if invoker is admin
                // Take an json of settings

            }
            case 'kickUser':{
                // Check if user is admin
                // Kick user with name
            }
            
            default:
                response = { action, status: 'error', error: 'Unknown action type' };
        }

        if (response) ws.send(JSON.stringify(response));
    } catch (err) {
        console.error('Error handling WebSocket message:', err);
        ws.send(JSON.stringify({ action: 'error', status: 'error', error: err.message }));
    }
};
