import React, { useEffect, useRef } from 'react';

export default function ChatScrollWrapper({ children }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom on mount and whenever children change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [children]);

  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        background: '#000',
      }}
    >
      {children}
    </div>
  );
}
