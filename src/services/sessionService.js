const db = require('../database');

exports.joinOrCreateSession = async (username, sessionCode) => {
    return db.joinOrCreateSession(username, sessionCode);
};
