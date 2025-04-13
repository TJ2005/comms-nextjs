import { createSession, checkSession, joinSession, addAdmin, newUser} from '../../../server/database.js';
import { serialize } from 'cookie';

export async function POST(req) {
    try {
        const { username, sessionCode } = await req.json();

        if (!username) {
            return new Response(JSON.stringify({ error: 'Username is required' }), { status: 400 });
        }

        if (!sessionCode) {
            return new Response(JSON.stringify({ error: 'Session code is required' }), { status: 400 });
        }

        // Extract userId from cookies
        const cookies = req.headers.get('cookie')?.split('; ') || [];
        const userCookie = cookies.find(cookie => cookie.startsWith('userId='));
        let userId = userCookie?.split('=')[1];
        console.log('User ID:', userId);
        console.log('Session Code:', sessionCode);
        console.log('Username:', username);
        // If userId is missing, Create a new user
        if (!userId) {
            console.log("UserID missing creating new user")
            userId = await newUser(username);
            if (userId === -1) {
                return new Response(JSON.stringify({ error: 'User already exists' }), { status: 500 });
            }
            if(!userId){
                return new Response(JSON.stringify({ error: 'Cannot create user server error' }), { status: 500 });
            }
        }

        // Check if session exists, else create one
        let sessionId = await checkSession(sessionCode);
        console.log('Session exists:', sessionId);

        if (!sessionId) {
            sessionId = await createSession(sessionCode);
            await addAdmin(userId, sessionId);
        }

        await joinSession(userId, sessionId);
        
        // Set cookies for userId and sessionId
        const headers = new Headers();
        console.log(userId,sessionId)
        // Production Settings
        headers.append('Access-Control-Allow-Credentials', 'true');
        // headers.append('Set-Cookie', serialize('userId', userId, { path: '/', httpOnly: true, secure: true, sameSite: 'Strict' }));
        // headers.append('Set-Cookie', serialize('sessionId', sessionId, { path: '/', httpOnly: true, secure: true, sameSite: 'Strict' }));
        
        // Development Settings
        headers.append('Set-Cookie', serialize('userId', userId, { path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }));
        headers.append('Set-Cookie', serialize('sessionId', sessionId, { path: '/', httpOnly: true, secure: false, sameSite: 'Lax' }));
        return new Response(JSON.stringify({ message: 'Joined session successfully', sessionId:sessionId, userId:userId }), { status: 200, headers });

    } catch (error) {
        console.error('Error handling session:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}
