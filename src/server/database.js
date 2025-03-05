const mongoose = require('mongoose');

// Replace 'your_database_name' with your actual database name
const mongoURI = 'mongodb://127.0.0.1:27017/COMMS';

// Connect to MongoDB using Mongoose
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(async () => {
    console.log('Connected to MongoDB successfully');
})
.catch((error) => {
    console.error('Error connecting to MongoDB:', error);
});



// Define the user schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    profile_picture_url: { type: String, default: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/1200px-Default_pfp.svg.png" }
});

// Define the session schema
const sessionSchema = new mongoose.Schema({
    code: { type: String, required: true },
    session_settings: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {
            max_users: 5,
            delete_messages: false,
            edit_messages: true,
            allow_new_users: true
        }
    }
});

// Define the user-session schema (many-to-many relationship between users and sessions)
const userSessionSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    is_admin: { type: Boolean, default: false }
});

// Define the message schema for a session
const messageSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    content: { type: String },
    file_url: { type: String },
    timestamp: { type: Date, default: Date.now },
    message_type: { type: String, required: true }
});

// Create the Mongoose models from the schemas
const User = mongoose.model('User', userSchema);
const Session = mongoose.model('Session', sessionSchema);
const UserSession = mongoose.model('UserSession', userSessionSchema);
const Message = mongoose.model('Message', messageSchema);

/**
 * Initialize the database schema.
 * Ensures that the necessary collections are present and populated.
 * Runs only once per execution.
 */
async function initialize() {
    const usersCount = await User.countDocuments();
    if (usersCount === 0) {
        console.log("Initializing database...");
        // Example of inserting default data if no users exist
        const defaultUser = new User({ username: 'default' });
        await defaultUser.save();
    }
}

/**
 * Add a new user or return the ID if the user already exists.
 * @param {string} username - The username of the user.
 * @param {string} [pfpUrl] - The profile picture URL of the user (optional).
 * @returns {Promise<string>} - The ID of the user or -1 if the user already exists.
 * @throws {error} - If the user already exists, returns -1.
 */
async function newUser(username, pfpUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Default_pfp.svg/1200px-Default_pfp.svg.png") {
    const existingUser = await User.findOne({ username });
    if (existingUser) return -1;

    const newUser = new User({ username, profile_picture_url: pfpUrl });
    await newUser.save();
    return newUser._id;
}



/**
 * Create a new session with a unique code.
 * @param {string} code - The unique session code.
 * @returns {Promise<string>} - The ID of the session.
 */
async function createSession(code) {
    const newSession = new Session({ code });
    await newSession.save();
    return newSession._id;
}

/**
 * Add a user to a session.
 * @param {string} userId - The ID of the user.
 * @param {string} sessionId - The ID of the session.
 */
async function joinSession(userId, sessionId) {
    const existingUserSession = await UserSession.findOne({ user_id: userId, session_id: sessionId });
    if (!existingUserSession) {
        const userSession = new UserSession({ user_id: userId, session_id: sessionId });
        await userSession.save();
    }
}

/**
 * Add admin privileges to a user in a session.
 * @param {string} userId - The ID of the user.
 * @param {string} sessionId - The ID of the session.
 */
async function addAdmin(userId, sessionId) {
    await UserSession.updateOne(
        { user_id: userId, session_id: sessionId },
        { $set: { is_admin: true } }
    );
}

/**
 * Remove admin privileges from a user in a session.
 * @param {string} userId - The ID of the user.
 * @param {string} sessionId - The ID of the session.
 */
async function removeAdmin(userId, sessionId) {
    await UserSession.updateOne(
        { user_id: userId, session_id: sessionId },
        { $set: { is_admin: false } }
    );
}

/**
 * Join or create a session, ensuring the user is joined and an admin if created.
 * If the session is created, the user will be made an admin.
 * @param {string} username - The username of the user.
 * @param {string} code - The session code.
 * @returns {Promise<{sessionId: string, userId: string}>} - The IDs of the session and user.
 */
async function joinOrCreateSession(username, code) {
    const userId = await newUser(username);
    let session = await Session.findOne({ code });
    let sessionId;

    if (!session) {
        sessionId = await createSession(code);
        await addAdmin(userId, sessionId);
    } else {
        sessionId = session._id;
    }

    await joinSession(userId, sessionId);
    return { sessionId, userId };
}

/**
 * Send a message in a session.
 * @param {string} userId - The ID of the user sending the message.
 * @param {string} sessionId - The ID of the session.
 * @param {string} content - The message content.
 * @param {string|null} fileUrl - The URL of the file (if applicable).
 * @param {string} messageType - The type of the message (e.g., 'text').
 */
async function sendMessage(userId, sessionId, content, fileUrl = null, messageType = 'text') {
    const message = new Message({ 
        user_id: userId, 
        session_id: sessionId, 
        content, 
        file_url: fileUrl, 
        message_type: messageType 
    });
    await message.save();
}

/**
 * Get messages from a session with user details.
 * @param {string} sessionId - The ID of the session.
 * @param {number} limit - The maximum number of messages to retrieve.
 * @returns {Promise<Array>} - The messages in the session.
 */
async function getMessage(sessionId, limit = 100) {
    const messages = await Message.find({ session_id: sessionId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('user_id', 'username');

    return messages;
}

/**
 * Update the settings of a session.
 * @param {string} sessionId - The ID of the session.
 * @param {Object} newSettings - The new settings for the session.
 */
async function updateSessionSettings(sessionId, newSettings) {
    await Session.updateOne(
        { _id: sessionId },
        { $set: { session_settings: newSettings } }
    );
}

/**
 * Edit a message in a session.
 * @param {string} messageId - The ID of the message to edit.
 * @param {string} newContent - The new content of the message.
 */
async function editMessage(messageId, newContent) {
    await Message.updateOne(
        { _id: messageId },
        { $set: { content: newContent } }
    );
}

/**
 * Delete a message from a session.
 * @param {string} messageId - The ID of the message to delete.
 */
async function deleteMessage(messageId) {
    await Message.deleteOne({ _id: messageId });
}

/**
 * Check if a message exists in a session.
 * @param {string} messageId - The ID of the message.
 * @param {string} sessionId - The ID of the session.
 * @returns {Promise<boolean>} - True if the message exists, false otherwise.
 */
async function checkMessage(messageId, sessionId) {
    const message = await Message.findOne({ _id: messageId, session_id: sessionId });
    return message ? true : false;
}

/**
 * Check if a session exists using session code.
 * @param {string} sessionCode - The code of the session.
 * @returns {Promise<boolean>} - True if the session exists, false otherwise.
 */
async function checkSession(sessionCode) {
    const session = await Session.findOne({ code: sessionCode });
    return session ? true : false;
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
    checkMessage,
    checkSession
};      
