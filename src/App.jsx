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
import ChatScrollWrapper from './ChatScrollWrapper'; 
import AutoLogout from './AutoLogout';

const apiKey = 'emnbag2b9jt4';

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

  // Only keep unique, online users
  const seen = new Set();
  const uniqueOnlineMembers = [];
  for (const member of Object.values(members)) {
    const user = member.user;
    // Only show if user is online
    if (!user?.online) continue;
    const key = user.id || user.name || 'unknown';
    if (!seen.has(key)) {
      seen.add(key);
      uniqueOnlineMembers.push(member);
    }
  }

  return (
    <div style={{ padding: '0 16px' }}>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {uniqueOnlineMembers.length === 0 && (
          <li style={{ color: '#888', fontStyle: 'italic' }}>No users online</li>
        )}
        {uniqueOnlineMembers.map(member => (
          <li key={member.user?.id || member.user?.name || Math.random()} style={{
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
      justifyContent: 'center',
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
        color: '#fff', // <-- always white
        background: 'transparent', // <-- no highlight
        fontWeight: 'normal',      // <-- always normal
        borderLeft: '4px solid transparent', // <-- no red border
      }}
    >
      {channel.data.name || channel.id}
    </div>
  );
}


function CustomChannelList({ children, channels, setActiveChannel, activeChannel, Preview }) {
  // If channels are provided, sort them so "General" is first
  let sortedChildren = children;

  if (channels && Preview) {
    // Sort channels so "General" is on top
    const sortedChannels = [...channels].sort((a, b) => {
      const isGeneralA = (a.data?.name || '').toLowerCase() === 'general';
      const isGeneralB = (b.data?.name || '').toLowerCase() === 'general';
      if (isGeneralA && !isGeneralB) return -1;
      if (!isGeneralA && isGeneralB) return 1;
      return 0;
    });

    // Render sorted previews
    sortedChildren = sortedChannels.map(channel => (
      <Preview
        key={channel.cid}
        channel={channel}
        setActiveChannel={setActiveChannel}
        activeChannel={activeChannel}
      />
    ));
  }

  return <div>{sortedChildren}</div>;
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
    const client = chatClient;
    setChatClient(null); // Unmounts chat UI immediately
    setResult(null);
    setPin('');
    if (client) {
      // Wait a tick to ensure UI is unmounted before disconnecting
      setTimeout(() => {
        client.disconnectUser();
      }, 0);
    }
  };
  
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
    alignItems: 'stretch',
  }}
>
  {/* Channels Title */}
  <div
    style={{
      flex: 'none',
      padding: '20px 16px 8px',
      fontWeight: 'bold',
      fontSize: '1.3rem',
      color: '#ff0000',
      borderBottom: '1px solid #ff0000',
    }}
  >
    Channels
  </div>
  <div style={{ flex: 'none' }}>
    <ChannelList
  filters={{}}
  sort={{ last_message_at: -1 }}
  options={{ state: true, watch: true, presence: true }}
  List={(listProps) => (
    <CustomChannelList
      {...listProps}
      Preview={CustomChannelPreview}
    />
  )}
  Preview={CustomChannelPreview}
/>

  </div>
  {/* Spacer for consistent gap */}
  <div style={{ flex: 'none', height: '20vh' }} />

  {/* Online Users Title */}
  <div
    style={{
      flex: 'none',
      padding: '0 16px 8px',
      fontWeight: 'bold',
      fontSize: '1.1rem',
      color: '#ff0000',
    }}
  >
    Online Users
  </div>
  {/* Online Users List */}
  <div style={{ flex: 'none' }}>
    <ActiveChannelUserList />
  </div>


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
                  height: '100vh',
                }}
              >
                <Channel>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1,
                      minHeight: 0,
                      minWidth: 0,
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
                    <Window
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        minHeight: 0,
                        minWidth: 0,
                      }}
                    >
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
        <div style={{ color: '#ff0000', marginBottom: 24, textAlign: 'center' }}>
  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Scheduling Chat</div>
  <div style={{ fontSize: '1.1rem', marginTop: 4 }}>Please Enter Your PIN</div>
</div>

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
