import React, { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageList,
  MessageInput,
  Window,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';


const apiKey = '68htwaw6ap8n'; // Replace with your Stream API key
const userId = 'testuser';             // Replace with dynamic user info as needed
const userName = 'Test User';

function App() {
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);

  useEffect(() => {
    async function initChat() {
      // Fetch token from your deployed backend
      const response = await fetch('https://stream-token-server-t336.onrender.com/get-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, name: userName }),
      });
      const data = await response.json();
      const token = data.token;

      // Initialize Stream Chat client
      const client = StreamChat.getInstance(apiKey);
      await client.connectUser(
        { id: userId, name: userName },
        token
      );

      // Create or get a channel
      const channel = client.channel('messaging', 'general', {
        name: 'General',
      });
      await channel.watch();

      setChatClient(client);
      setChannel(channel);
    }

    initChat();

    return () => {
      if (chatClient) chatClient.disconnectUser();
    };
  }, []);

  if (!chatClient || !channel) return <div>Loading chat...</div>;

  return (
    <Chat client={chatClient} theme="messaging light">
      <Channel channel={channel}>
        <Window>
          <ChannelHeader />
          <MessageList />
          <MessageInput />
        </Window>
      </Channel>
    </Chat>
  );
}

export default App;
