In a chat application like the one you're describing, both APIs and WebSockets have their roles. Here's a breakdown of where you should use each:

### When to Use APIs

1. **Authentication and Authorization**:
   - **Sign-In/Sign-Up**: Use RESTful APIs for user authentication and authorization. When a user signs in with a username and code, you can use an API to validate the credentials and issue a token (e.g., JWT) for subsequent requests.
   - **Example**: `POST /api/auth/login` to handle user login.

2. **Initial Data Loading**:
   - **Fetching Initial Data**: Use APIs to fetch initial data when the application loads, such as the list of available chatrooms or user profiles.
   - **Example**: `GET /api/chatrooms` to get a list of chatrooms.

3. **CRUD Operations**:
   - **Create, Read, Update, Delete**: Use APIs for operations that involve creating, reading, updating, or deleting resources, such as creating a new chatroom or updating user settings.
   - **Example**: `POST /api/chatrooms` to create a new chatroom.

4. **Static or Infrequently Changing Data**:
   - **Configuration Settings**: Use APIs to fetch configuration settings or other data that doesn't change frequently.
   - **Example**: `GET /api/settings` to get application settings.

### When to Use WebSockets

1. **Real-Time Communication**:
   - **Chat Messages**: Use WebSockets for real-time communication, such as sending and receiving chat messages. WebSockets allow for bidirectional communication, making them ideal for chat applications.
   - **Example**: A WebSocket connection to handle real-time message exchange.

2. **Live Updates**:
   - **Presence Indicators**: Use WebSockets to update presence indicators (e.g., who is online) in real-time.
   - **Example**: A WebSocket connection to notify clients about users joining or leaving a chatroom.

3. **Notifications**:
   - **Real-Time Notifications**: Use WebSockets to send real-time notifications, such as when a new message is received or when a user joins a chatroom.
   - **Example**: A WebSocket connection to push notifications to clients.

4. **Interactive Features**:
   - **Typing Indicators**: Use WebSockets to implement interactive features like typing indicators, which show when a user is typing a message.
   - **Example**: A WebSocket connection to notify clients about typing activity.

### Example Architecture

1. **Authentication Flow**:
   - User signs in using `POST /api/auth/login`.
   - Server validates credentials and returns a JWT token.

2. **Fetching Initial Data**:
   - Client fetches the list of chatrooms using `GET /api/chatrooms`.

3. **Real-Time Chat**:
   - Client establishes a WebSocket connection to the server.
   - Server sends and receives chat messages in real-time over the WebSocket connection.
   - Server sends notifications about users joining or leaving chatrooms over the WebSocket connection.

4. **Creating a Chatroom**:
   - User creates a new chatroom using `POST /api/chatrooms`.
   - Server broadcasts the new chatroom to all connected clients over the WebSocket connection.

### Summary

- **Use APIs** for authentication, initial data loading, CRUD operations, and static or infrequently changing data.
- **Use WebSockets** for real-time communication, live updates, notifications, and interactive features.

By combining APIs and WebSockets, you can create a responsive and real-time chat application that provides a seamless user experience.