import { newUser } from '../../../server/database.js';
export async function POST(req) {
    const { username } = await req.json();

    if (!username) {
        return new Response(JSON.stringify({ message: 'Username is required' }), { status: 400 });
    }

    try {
        // Create a new user
        const userId = await newUser(username);
        if (userId === -1) {
            return new Response(JSON.stringify({ message: 'Username already exists' }), { status: 409 });
        }
        return new Response(JSON.stringify({ userId }), { status: 201 });
    } catch (error) {
        console.error('Error creating user', error);
        return new Response(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
    }
}