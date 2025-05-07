import React, { useState } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelList,
  Window,
  MessageList,
  MessageInput,
  useChatContext,
  useMessageContext,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import { useChannelStateContext } from 'stream-chat-react';
import AutoLogout from './AutoLogout'; // Adjust path if needed

const CustomChannelHeader = () => {
  const { channel } = useChannelStateContext();

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '12px 0',
        color: '#ff0000',
        fontWeight: 'bold',
        fontSize: '1.5rem',
        borderBottom: '1px solid #ff0000',
      }}
    >
      {channel?.data?.name || 'Channel'}
    </div>
  );
};

// --- THEME: force all backgrounds to black ---
const customTheme = {
  '--str-chat-background': '#000000',
  '--str-chat-channel-background': '#000000',
  '--str-chat__main-panel-background-color': '#000000',
  '--str-chat-primary-color': '#ff0000',
  '--str-chat-text-color': '#ffffff',
  '--str-chat-message-text-color': '#ffffff',
  '--str-chat-message-background': '#181818',
  '--str-chat-message-background-hover': '#222',
  '--str-chat-input-background': '#181818',
  '--str-chat-input-text-color': '#ffffff',
  '--str-chat-button-primary-background': '#ff0000',
  '--str-chat-button-primary-color': '#ffffff',
  '--str-chat-scrollbar-thumb': '#ff0000',
  '--str-chat-scrollbar-track': '#333333',
  '--str-chat-user-message-background': '#181818',
  '--str-chat-other-message-background': '#181818',
  '--str-chat-header-background': '#181818',
  '--str-chat-header-title-color': '#ff0000',
};

const apiKey = 'emnbag2b9jt4';

function CustomMessage() {
  const { message } = useMessageContext();
  if (!message || typeof message.text !== 'string') return null;

  let dateString = '';
  if (message.created_at) {
    const date = new Date(message.created_at);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Denver', // Mountain Time zone
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    dateString = formatter.format(date);
  }

  return (
    <div
      style={{
        backgroundColor: '#000',
        color: '#fff',
        padding: '10px 16px',
        borderRadius: 8,
        marginBottom: 8,
        maxWidth: '80%',
        wordBreak: 'break-word',
      }}
    >
      <div style={{ fontWeight: 'bold', color: '#ff0000', marginBottom: 4 }}>
        {message.user?.name || message.user?.id || 'Unknown'}
        {dateString && (
          <span style={{ color: '#aaa', fontWeight: 'normal', fontSize: '0.60em', marginLeft: 10 }}>
            {dateString}
          </span>
        )}
      </div>
      <div>{message.text}</div>
    </div>
  );
}

// --- SIDEBAR USER LIST ---
function ActiveChannelUserList() {
  const { channel } = useChatContext();
  const members = channel?.state?.members || {};
  return (
    <div style={{ padding: '0 16px' }}>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {Object.values(members).map(member => (
          <li key={member.user?.id} style={{
            color: '#fff',
            padding: '4px 0',
            fontWeight: 'bold'
          }}>
            {member.user?.name || member.user?.id || 'Unknown'}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChannelTitle() {
  const { channel } = useChatContext();
  return (
    <div style={{
      color: '#ff0000',
      fontWeight: 'bold',
      fontSize: '1.4rem',
      padding: '16px',
      borderBottom: '2px solid #ff0000',
      background: '#181818',
      minHeight: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center', // This centers horizontally!
      width: '100%',
      textAlign: 'center',
    }}>
      <span style={{ width: '100%' }}>
        {channel?.data?.name || channel?.id || 'Select a Channel'}
      </span>
    </div>
  );
}

function CustomChannelPreview({ channel, setActiveChannel, activeChannel }) {
  return (
    <div
      onClick={() => setActiveChannel(channel)}
      style={{
        padding: '10px 16px',
        cursor: 'pointer',
        color: channel?.id === activeChannel?.id ? '#ff0000' : '#fff',
        background: channel?.id === activeChannel?.id ? '#222' : 'transparent',
        fontWeight: channel?.id === activeChannel?.id ? 'bold' : 'normal',
        borderLeft: channel?.id === activeChannel?.id ? '4px solid #ff0000' : '4px solid transparent',
      }}
    >
      {channel.data.name || channel.id}
    </div>
  );
}

function CustomChannelList({ children }) {
  return <div>{children}</div>;
}

function App() {
  const [chatClient, setChatClient] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // --- PIN VERIFY LOGIC ---
  const verifyPin = async () => {
    setError('');
    setResult(null);
    try {
      const res = await fetch('http://localhost:3001/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

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

        // --- AUTO-CREATE USER CHANNEL ---
        const channel = client.channel('messaging', data.userId, {
          name: data.name,
          members: [data.userId],
        });
        await channel.create();

        setChatClient(client);
      }
    } catch (err) {
      setError('Could not connect to backend.');
    }
  };

  const handleLogout = async () => {
    if (chatClient) {
      await chatClient.disconnectUser(); // Disconnects user from Stream
      setChatClient(null);
    }
    setResult(null);      // Clear user info so PIN screen shows
    setPin(''); // Clear PIN input
  };

  // --- MAIN CHAT UI ---
 // --- MAIN CHAT UI ---
if (chatClient) {
  return (
    <AutoLogout chatClient={chatClient} onLogout={handleLogout}>
      {({ remainingTime }) => (
        <div style={{
          minHeight: '100vh',
          minWidth: '100vw',
          background: '#000',
          color: '#fff',
          position: 'relative',
        }}>
          {/* LOGOUT BUTTON + TIMER */}
          <div style={{
            position: 'absolute',
            top: 20,
            right: 20,
            display: 'flex',
            alignItems: 'center',
            zIndex: 100
          }}>
            <button
              onClick={handleLogout}
              style={{
                background: '#ff0000',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                padding: '10px 18px',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                marginRight: 12,
              }}
            >
              Log Out
            </button>
            <span style={{
              color: '#ff0000',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              fontSize: '1.1rem',
            }}>
              {/* Format as MM:SS */}
              {String(Math.floor(remainingTime / 60)).padStart(2, '0')}:
              {String(remainingTime % 60).padStart(2, '0')}
            </span>
          </div>
          <Chat client={chatClient} theme={customTheme}>

            {/* Sidebar */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 280,
                height: '100vh',
                background: '#181818',
                color: '#fff',
                borderRight: '2px solid #ff0000',
                zIndex: 10,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Channels Title */}
              <div
                style={{
                  padding: '20px 16px 8px',
                  fontWeight: 'bold',
                  fontSize: '1.3rem',
                  color: '#ff0000',
                  borderBottom: '1px solid #ff0000',
                }}
              >
                Channels
              </div>

              {/* Channel List */}
              <div style={{ minHeight: 0 }}>
                <ChannelList
                  filters={{}}
                  sort={{ last_message_at: -1 }}
                  options={{ state: true, watch: true, presence: true }}
                  style={{ width: '100%' }}
                  List={CustomChannelList}
                  Preview={CustomChannelPreview}
                />
              </div>

              {/* Online Users Title */}
              <div
                style={{
                  marginTop: 250,
                  padding: '0 16px 8px',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  color: '#ff0000',
                }}
              >
                Online Users
              </div>

              {/* Online Users List */}
              <ActiveChannelUserList />
            </div>

            {/* Main Chat Area */}
            <div
              style={{
                position: 'absolute',
                left: 280,
                top: 0,
                right: 0,
                bottom: 0,
                background: '#000',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                minHeight: 0,
              }}
            >
              <Channel>
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#000',
                    height: '100%',
                  }}
                >
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '12px 0',
                      color: '#ff0000',
                      fontWeight: 'bold',
                      fontSize: '1.5rem',
                    }}
                  >
                    <ChannelTitle />
                  </div>
                  <Window>
                    <MessageList Message={CustomMessage} />
                    <MessageInput />
                  </Window>
                </div>
              </Channel>
            </div>
          </Chat>
        </div>
      )}
    </AutoLogout>
  );
}


  // --- PIN SCREEN ---
  return (
    <div style={{
      minHeight: '100vh',
      minWidth: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#000',
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
            backgroundColor: '#000',
            color: '#fff',
            width: '100%',
            fontSize: '1rem',
          }}
        />
        <button
          onClick={verifyPin}
          style={{
            backgroundColor: '#ff0000',
            color: '#fff',
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
        {result && <div style={{ marginTop: 20, color: '#fff' }}><b>Welcome, {result.name}!</b></div>}
      </div>
    </div>
  );
}

export default App;
