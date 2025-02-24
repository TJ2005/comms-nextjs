/**
 * @constant {Object} db - The database module used for interacting with the database.
 * @requires ../database
 */
const db = require('../database');

exports.sendMessage = async (userId, sessionId, message, fileUrl = null, messageType = 'text') => {
    await db.sendMessage(userId, sessionId, message, fileUrl, messageType);
};

exports.getMessages = async (sessionId, limit) => {
    return db.getMessage(sessionId, limit);
};
