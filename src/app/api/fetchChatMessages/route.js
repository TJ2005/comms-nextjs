import { getMessages, isUserInSession } from '../../../server/database.js';

export async function GET(req) {
    try {
        // Extract sessionId from cookies
        const cookies = req.headers.get('cookie')?.split('; ') || [];
        const sessionCookie = cookies.find(cookie => cookie.startsWith('sessionId='));
        const sessionId = sessionCookie?.split('=')[1];

        if (!sessionId) {
            return new Response(JSON.stringify({ error: 'Session ID is required' }), { status: 400 });
        }

        // Fetch chat messages from the database

        ValidationFlag = isUserInSession(sessionId);
        if(ValidationFlag == false){
            return new Response(JSON.stringify({ error: 'User is not in session' }), { status: 400 });
        }
        else{
            chatMessages = getMessages(sessionId);
            console.log(chatMessages);
            return new Response(JSON.stringify(chatMessages), { status: 200 });
        }

        

    } catch (error) {
        console.error('Error fetching chat messages:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}