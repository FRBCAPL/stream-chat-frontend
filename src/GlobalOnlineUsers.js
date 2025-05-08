import { useChatContext } from 'stream-chat-react';
import { useEffect, useState } from 'react';

function GlobalOnlineUsers() {
  const { client } = useChatContext();
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    // Get initial online users
    const users = Object.values(client.state.users)
      .filter(u => u.online)
      .map(u => ({ id: u.id, name: u.name }));
    setOnlineUsers(users);

    // Listen for presence changes
    const handlePresence = (event) => {
      setOnlineUsers(prev => {
        if (event.user.online) {
          const others = prev.filter(u => u.id !== event.user.id);
          return [...others, { id: event.user.id, name: event.user.name }];
        } else {
          return prev.filter(u => u.id !== event.user.id);
        }
      });
    };

    client.on('user.presence.changed', handlePresence);

    return () => client.off('user.presence.changed', handlePresence);
  }, [client]);

  // Sort users alphabetically
  const sortedUsers = [...onlineUsers].sort((a, b) =>
    (a.name || a.id).localeCompare(b.name || b.id)
  );

  return (
    <div style={{ padding: '0 16px' }}>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {sortedUsers.length === 0 && (
          <li style={{ color: '#888', fontStyle: 'italic' }}>No users online</li>
        )}
        {sortedUsers.map(user => (
          <li key={user.id} style={{ color: '#fff', padding: '4px 0', fontWeight: 'bold' }}>
            {user.name || user.id}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GlobalOnlineUsers;
