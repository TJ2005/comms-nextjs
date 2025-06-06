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
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);
const UserSession = mongoose.models.UserSession || mongoose.model('UserSession', userSessionSchema);
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

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
 * @param {string} sessionCode - The code of the session.
 */
async function joinSession(userId, session_id) {
    console.log("Join Session Triggered with ", userId, session_id);

    if (!mongoose.Types.ObjectId.isValid(session_id)) {
        throw new Error(`Invalid session_id: ${session_id}`);
    }

    const existingUserSession = await UserSession.findOne({ user_id: userId, session_id });

    if (!existingUserSession) {
        const userSession = new UserSession({ user_id: userId, session_id });
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
 * @returns {Promise<string>} - The ID of the sent message.
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
    return message._id;
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
 * @param {string} authorId - The ID of the author attempting to edit the message.
 * @param {string} newContent - The new content of the message.
 * @returns {Promise<{success: boolean, error?: string}>} - The result of the operation.
 */
async function editMessage(messageId, authorId, newContent) {
    const message = await Message.findOne({ _id: messageId });

    if (!message) {
        return { success: false, error: 'Message not found' };
    }

    const sessionId = message.session_id;
    const session = await Session.findOne({ _id: sessionId });
    if (!session || !session.session_settings.get('edit_messages')) {
        return { success: false, error: 'Editing messages is not allowed in this session' };
    }

    if (message.user_id.toString() !== authorId) {
        return { success: false, error: 'You are not authorized to edit this message' };
    }

    await Message.updateOne(
        { _id: messageId },
        { $set: { content: newContent } }
    );

    return { success: true };
}

/**
 * Delete a message from a session.
 * @param {string} messageId - The ID of the message to delete.
 * @param {string} authorId - The ID of the author attempting to delete the message.
 * @returns {Promise<{success: boolean, error?: string}>} - The result of the operation.
 */
async function deleteMessage(messageId, authorId) {
    const message = await Message.findOne({ _id: messageId });

    if (!message) {
        return { success: false, error: 'Message not found' };
    }

    const sessionId = message.session_id;
    const session = await Session.findOne({ _id: sessionId });
    if (!session || !session.session_settings.get('delete_messages')) {
        return { success: false, error: 'Deleting messages is not allowed in this session' };
    }

    if (message.user_id.toString() !== authorId) {
        return { success: false, error: 'You are not authorized to delete this message' };
    }

    await Message.deleteOne({ _id: messageId });

    return { success: true };
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
 * @returns {Promise<sessionId/Boolean>} - Session ID if the session exists, false otherwise.
 */
async function checkSession(sessionCode) {
    const session = await Session.findOne({ code: sessionCode });
    return session ? session._id : false;
}


/**
 * Get messages from a session with user details.
 * @param {string} sessionId - The ID of the session.
 * @param {number} [limit=100] - The maximum number of messages to retrieve.
 * @returns {Promise<Array>} - The messages in the session.
 */
async function getMessages(sessionId, limit = 100) {
    const messages = await Message.find({ session_id: sessionId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('user_id', 'username profile_picture_url')
        .exec();
    return messages;
}

/**
 * Check if a user exists in a session.
 * @param {string} userId - The ID of the user.
 * @param {string} sessionId - The ID of the session.
 * @returns {Promise<boolean>} - True if the user exists in the session, false otherwise.
 */
async function isUserInSession(userId, sessionId) {
    const userSession = await UserSession.findOne({ user_id: userId, session_id: sessionId });
    return userSession ? true : false;
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
    checkSession,
    getMessages,
    isUserInSession
};
