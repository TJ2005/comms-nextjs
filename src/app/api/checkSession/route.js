import { createSession, checkSession, joinSession, addAdmin } from '../../../server/database.js';

export async function POST(req) {
    const { sessionCode, userId } = await req.json();

    if (!sessionCode) {
        return new Response(JSON.stringify({ error: 'Session code is required' }), { status: 400 });
    }

    if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
    }

    try {
        const sessionExists = await checkSession(sessionCode);

        if (sessionExists) {
            // Join the session
            await joinSession(userId, sessionExists.id);
            return new Response(JSON.stringify({ message: 'Joined existing session', session: sessionExists }), { status: 200 });
        } else {
            // Create the session first, then join it
            const newSession = await createSession(sessionCode, userId);
            await joinSession(userId, newSession.id);
            await addAdmin(userId, newSession.id);
            return new Response(JSON.stringify({ message: 'Session created and joined, you are admin!', session: newSession }), { status: 201 });
        }
    } catch (error) {
        console.error('Error handling session:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}