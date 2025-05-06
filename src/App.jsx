import React, { useState } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageInput,
  Window,
  LoadingIndicator,
  useChannelStateContext,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';

const apiKey = 'emnbag2b9jt4'; // Your Stream Chat API key

// Custom theme for black background, red accents, white text
const customTheme = {
  '--str-chat-background': '#000000',
  '--str-chat-primary-color': '#ff0000',
  '--str-chat-text-color': '#ffffff',
  '--str-chat-message-text-color': '#ffffff',
  '--str-chat-message-background': '#000000',
  '--str-chat-message-background-hover': '#1a1a1a',
  '--str-chat-input-background': '#000000',
  '--str-chat-input-text-color': '#ffffff',
  '--str-chat-button-primary-background': '#ff0000',
  '--str-chat-button-primary-color': '#ffffff',
  '--str-chat-scrollbar-thumb': '#ff0000',
  '--str-chat-scrollbar-track': '#333333',
  '--str-chat-user-message-background': '#000000',
  '--str-chat-other-message-background': '#000000',
  '--str-chat-header-background': '#000000',
  '--str-chat-header-title-color': '#ff0000',
};

// Custom ChannelHeader with red title
function CustomChannelHeader({ channel }) {
  return (
    <div style={{
      background: '#000',
      padding: '16px',
      borderBottom: '1px solid #ff0000',
      textAlign: 'center',
    }}>
      <span style={{
        color: '#ff0000',
        fontWeight: 'bold',
        fontSize: '1.5rem',
        letterSpacing: '1px',
      }}>
        {channel.data.name || 'Chat'}
      </span>
    </div>
  );
}

// Custom MessageList with black background, red names, white text
function MessageListCustom() {
  const { messages } = useChannelStateContext();
  return (
    <div
      style={{
        padding: 16,
        overflowY: 'auto',
        height: 'calc(100% - 40px)',
        backgroundColor: '#000000', // ensure entire message list background is black
      }}
    >
      {messages.map(msg => (
        <div
          key={msg.id}
          style={{
            margin: '12px 0',
            backgroundColor: '#000000',
            padding: '10px 16px',
            borderRadius: '8px',
            color: '#ffffff',
            maxWidth: '80%',
            wordBreak: 'break-word',
            border: '1px solid #222',
          }}
        >
          <strong style={{ color: '#ff0000', fontWeight: 'bold' }}>
            {msg.user?.name || msg.user?.id}
          </strong>
          : <span>{msg.text}</span>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [pin, setPin] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);

  const verifyPin = async () => {
    setError('');
    setResult(null);
    try {
      const res = await fetch('http://localhost:3001/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      setPin('');
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);

        const client = StreamChat.getInstance(apiKey);
        await client.connectUser(
          {
            id: data.userId,
            name: data.name,
          },
          data.token
        );

        const channel = client.channel('messaging', 'general', {
          name: 'General',
        });
        await channel.watch();

        setChatClient(client);
        setChannel(channel);
      }
    } catch (err) {
      setError('Could not connect to backend.');
    }
  };

  if (result && (!chatClient || !channel)) {
    return <LoadingIndicator />;
  }

  if (chatClient && channel) {
    return (
      <div
        style={{
          width: '900px',
          height: '700px',
          margin: 'auto',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          border: '1px solid #ff0000',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 12px rgba(255, 0, 0, 0.3)',
          backgroundColor: '#000000',
        }}
      >
        <Chat client={chatClient} theme={customTheme} style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000' }}>
          <Channel channel={channel} style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#000000' }}>
            <Window style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#000000' }}>
              <CustomChannelHeader channel={channel} />
              <MessageListCustom />
              {/* Default MessageInput for send button and Enter-to-send */}
              <MessageInput />
            </Window>
          </Channel>
        </Chat>
      </div>
    );
  }

  // Center the PIN screen both vertically and horizontally
  return (
    <div style={{
      minHeight: '100vh',
      minWidth: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000000',
    }}>
      <div style={{
        background: '#000',
        border: '1px solid #ff0000',
        borderRadius: 8,
        padding: 40,
        boxShadow: '0 4px 12px rgba(255,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: 350,
      }}>
        <h2 style={{ color: '#ff0000', marginBottom: 24 }}>Enter PIN</h2>
        <input
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          placeholder="Enter your PIN"
          style={{
            marginBottom: 16,
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ff0000',
            backgroundColor: '#000000',
            color: '#ffffff',
            width: '100%',
            fontSize: '1rem',
          }}
        />
        <button
          onClick={verifyPin}
          style={{
            backgroundColor: '#ff0000',
            color: '#ffffff',
            border: 'none',
            padding: '10px 0',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}
        >
          Verify
        </button>
        {error && <div style={{ color: '#ff0000', marginTop: 20 }}>{error}</div>}
        {result && (
          <div style={{ marginTop: 20, color: '#ffffff' }}>
            <b>Welcome, {result.name}!</b>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
