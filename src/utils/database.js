const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'comms',
    password: 'root',
    port: 5432
});

// Database schema initializer
const initializer = `-- Users Table: Stores user information
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,           -- Auto-incrementing user ID
  username VARCHAR(255) NOT NULL   -- User's username
);

-- Sessions Table: Represents a chat session (e.g., chat room)
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,           -- Auto-incrementing session ID
  code VARCHAR(255) NOT NULL,      -- Unique session code
  session_settings JSONB NOT NULL DEFAULT '{"max_users": 5, "delete_messages": false, "edit_messages": true, "allow_new_users": true}' -- Stores the settings for a session
);

-- User-Sessions Table: Tracks users in sessions and their admin status
CREATE TABLE IF NOT EXISTS user_sessions (
  user_id INTEGER NOT NULL,        -- ID of the user
  session_id INTEGER NOT NULL,     -- ID of the session
  is_admin BOOLEAN DEFAULT FALSE,  -- Whether the user is an admin in this session
  
  PRIMARY KEY (user_id, session_id), -- Composite primary key
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,  -- Foreign key to users
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE -- Foreign key to sessions
);

-- Messages Table: Stores messages sent in sessions
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,           -- Auto-incrementing message ID
  user_id INTEGER NOT NULL,        -- ID of the user who sent the message
  session_id INTEGER NOT NULL,     -- ID of the session in which the message was sent
  content TEXT,                    -- Message content (text or file URL)
  file_url VARCHAR(255),           -- URL of the file (if applicable)
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Time when the message was sent
  message_type VARCHAR(50) NOT NULL,  -- Type of message (e.g., text, file, image)
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,  -- Foreign key to users
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE  -- Foreign key to sessions
);
`;

let isInitialized = false;

/**
 * Initialize the database schema.
 * Ensures that the tables exist in the database. Runs only once per execution.
 */
async function initialize() {
    if (!isInitialized) {
        await pool.query(initializer);
        isInitialized = true;
    }
}

/**
 * Add a new user or return the ID if the user already exists.
 * @param {string} username - The username of the user.
 * @returns {Promise<number>} - The ID of the user.
 */
async function newUser(username) {
    const userCheck = await pool.query(
        `SELECT id FROM users WHERE username = $1`,
        [username]
    );

    if (userCheck.rowCount > 0) {
        return userCheck.rows[0].id;
    }

    const result = await pool.query(
        `INSERT INTO users (username) VALUES ($1) RETURNING id`,
        [username]
    );
    return result.rows[0].id;
}

/**
 * Create a new session with a unique code.
 * @param {string} code - The unique session code.
 * @returns {Promise<number>} - The ID of the session.
 */
async function createSession(code) {
    const defaultSettings = {
        max_users: 5,
        delete_messages: false,
        edit_messages: true,
        allow_new_users: true
    };

    const result = await pool.query(
        `INSERT INTO sessions (code, session_settings) VALUES ($1, $2) RETURNING id`,
        [code, defaultSettings]
    );
    return result.rows[0].id;
}

/**
 * Add a user to a session.
 * @param {number} userId - The ID of the user.
 * @param {number} sessionId - The ID of the session.
 */
async function joinSession(userId, sessionId) {
    await pool.query(
        `INSERT INTO user_sessions (user_id, session_id) 
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, sessionId]
    );
}

/**
 * Add admin privileges to a user in a session.
 * @param {number} userId - The ID of the user.
 * @param {number} sessionId - The ID of the session.
 */
async function addAdmin(userId, sessionId) {
    await pool.query(
        `UPDATE user_sessions SET is_admin = TRUE 
         WHERE user_id = $1 AND session_id = $2`,
        [userId, sessionId]
    );
}

/**
 * Remove admin privileges from a user in a session.
 * @param {number} userId - The ID of the user.
 * @param {number} sessionId - The ID of the session.
 */
async function removeAdmin(userId, sessionId) {
    await pool.query(
        `UPDATE user_sessions SET is_admin = FALSE 
         WHERE user_id = $1 AND session_id = $2`,
        [userId, sessionId]
    );
}

/**
 * Add or retrieve a session, ensuring the user is joined.
 * If the session is created, the user becomes an admin.
 * @param {string} username - The username of the user.
 * @param {string} code - The session code.
 * @returns {Promise<{sessionId: number, userId: number}>} - The IDs of the session and user.
 */
async function joinOrCreateSession(username, code) {
    const userId = await newUser(username);

    let session = await pool.query(
        `SELECT id FROM sessions WHERE code = $1`,
        [code]
    );

    let sessionId;
    if (session.rowCount === 0) {
        sessionId = await createSession(code);
        addAdmin(userId, sessionId);
    } else {
        sessionId = session.rows[0].id;
    }

    await joinSession(userId, sessionId);
    return { sessionId, userId };
}

/**
 * Send a message in a session.
 * @param {number} userId - The ID of the user sending the message.
 * @param {number} sessionId - The ID of the session.
 * @param {string} content - The message content.
 * @param {string|null} fileUrl - The URL of the file (if applicable).
 * @param {string} messageType - The type of the message (e.g., 'text').
 */
const sendMessage = async (userId, sessionId, content, fileUrl = null, messageType = 'text') => {
    await pool.query(
        `INSERT INTO messages (user_id, session_id, content, file_url, message_type) 
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, sessionId, content, fileUrl, messageType]
    );
};

/**
 * Get messages from a session with user details.
 * @param {number} sessionId - The ID of the session.
 * @param {number} limit - The maximum number of messages to retrieve.
 * @returns {Promise<Array>} - The messages in the session.
 */
const getMessage = async (sessionId, limit = 100) => {
    const result = await pool.query(
        `SELECT messages.id, messages.user_id, messages.session_id, messages.content, 
                messages.file_url, messages.timestamp, messages.message_type, users.username
         FROM messages
         JOIN users ON messages.user_id = users.id
         WHERE messages.session_id = $1
         ORDER BY messages.timestamp DESC
         LIMIT $2`,
        [sessionId, limit]
    );
    return result.rows;
};

/**
 * Update the settings of a session.
 * @param {number} sessionId - The ID of the session.
 * @param {Object} newSettings - The new settings for the session.
 */
async function updateSessionSettings(sessionId, newSettings) {
    await pool.query(
        `UPDATE sessions SET session_settings = $1 WHERE id = $2`,
        [newSettings, sessionId]
    );
}

/**
 * Edit a message in a session.
 * @param {number} messageId - The ID of the message to edit.
 * @param {string} newContent - The new content of the message.
 */
async function editMessage(messageId, newContent) {
    await pool.query(
        `UPDATE messages SET content = $1 WHERE id = $2`,
        [newContent, messageId]
    );
}

/**
 * Delete a message from a session.
 * @param {number} messageId - The ID of the message to delete.
 */
async function deleteMessage(messageId) {
    await pool.query(
        `DELETE FROM messages WHERE id = $1`,
        [messageId]
    );
}

/**
 * Check if a message exists in a session.
 * @param {number} messageId - The ID of the message.
 * @param {number} sessionId - The ID of the session.
 * @returns {Promise<boolean>} - True if the message exists, false otherwise.
 */
async function checkMessage(messageId, sessionId) {
    const result = await pool.query(
        `SELECT 1 FROM messages WHERE id = $1 AND session_id = $2`,
        [messageId, sessionId]
    );
    return result.rowCount > 0;
}

module.exports = {
    initialize,
    newUser,
    createSession,
    joinSession,
    addAdmin,
    removeAdmin,
    joinOrCreateSession,
    sendMessage,
    getMessage,
    updateSessionSettings,
    editMessage,
    deleteMessage,
    checkMessage
};
