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
        let sessionId = await checkSession(sessionCode);
        console.log('Session exists:', sessionId);

        if (!sessionId) {
            sessionId = await createSession(sessionCode);
            await addAdmin(userId, sessionId);
        }

        await joinSession(userId, sessionId);
        return new Response(JSON.stringify({ message: 'Joined session successfully', sessionId }), { status: 200 });

    } catch (error) {
        console.error('Error handling session:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}
