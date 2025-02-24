// server.js

const express = require('express');
// Importing express
const { body, validationResult } = require('express-validator');
// express-validator for validating common stuff like usernames, emails, etc.
const db = require('./database'); // Import the database module

const app = express();
// create express instance
app.use(express.json()); // Middleware to parse JSON bodies

// Initialize the database schema
db.initialize();

/**
 * @api {post} /session Join or Create a Session
 * @apiName JoinOrCreateSession
 * @apiGroup Session
 *
 * @apiBody {String} username  The username of the user.
 * @apiBody {String} code      The unique session code.
 *
 * @apiSuccess {Number} sessionId  The ID of the session.
 * @apiSuccess {Number} userId     The ID of the user.
 */
app.post(
  '/session',
  [
    body('username').isString().trim().notEmpty().withMessage('Username is required and must be a non-empty string.'),
    body('code').isString().trim().notEmpty().withMessage('Session code is required and must be a non-empty string.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, code } = req.body;

    try {
      const { sessionId, userId } = await db.joinOrCreateSession(username, code);
      res.status(200).json({ sessionId, userId });
    } catch (error) {
      console.error('Error joining or creating session:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @api {post} /message Send a Message
 * @apiName SendMessage
 * @apiGroup Message
 *
 * @apiBody {Number} userId      The ID of the user sending the message.
 * @apiBody {Number} sessionId   The ID of the session.
 * @apiBody {String} content     The message content.
 * @apiBody {String} [fileUrl]   The URL of the file (if applicable).
 * @apiBody {String} [messageType=text]  The type of the message (e.g., 'text', 'image').
 *
 * @apiSuccess {String} message  Confirmation of message sent.
 */
app.post(
  '/message',
  [
    body('userId').isInt().withMessage('User ID must be an integer.'),
    body('sessionId').isInt().withMessage('Session ID must be an integer.'),
    body('content').isString().trim().notEmpty().withMessage('Content is required and must be a non-empty string.'),
    body('fileUrl').optional().isURL().withMessage('File URL must be a valid URL.'),
    body('messageType').optional().isString().withMessage('Message type must be a string.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, sessionId, content, fileUrl, messageType } = req.body;

    try {
      await db.sendMessage(userId, sessionId, content, fileUrl, messageType || 'text');
      res.status(200).json({ message: 'Message sent successfully.' });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * @api {get} /messages Retrieve Messages
 * @apiName GetMessages
 * @apiGroup Message
 *
 * @apiQuery {Number} sessionId  The ID of the session.
 * @apiQuery {Number} [limit=100]  The maximum number of messages to retrieve.
 *
 * @apiSuccess {Object[]} messages  List of messages in the session.
 */
app.get(
  '/messages',
  [
    body('sessionId').isInt().withMessage('Session ID must be an integer.'),
    body('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId } = req.body;
    const limit = req.body.limit || 100;

    try {
      const messages = await db.getMessage(sessionId, limit);
      res.status(200).json(messages);
    } catch (error) {
      console.error('Error retrieving messages:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
