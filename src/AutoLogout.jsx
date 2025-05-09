import { useEffect, useRef, useState } from "react";

const AUTO_LOGOUT_TIME = 5 * 60; // 5 minutes in seconds

function AutoLogout({ chatClient, onLogout, children }) {
  const timerId = useRef(null);
  const [remainingTime, setRemainingTime] = useState(AUTO_LOGOUT_TIME);

  // Reset timer and countdown on activity
  const resetTimer = () => {
    setRemainingTime(AUTO_LOGOUT_TIME);
    if (timerId.current) clearTimeout(timerId.current);
    startTimer();
  };

  // Start countdown
  const startTimer = () => {
    timerId.current = setTimeout(() => {
      if (chatClient) chatClient.disconnectUser();
      onLogout();
    }, remainingTime * 1000);
  };

  // Countdown effect
  useEffect(() => {
    if (remainingTime <= 0) return;
    const interval = setInterval(() => {
      setRemainingTime((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingTime]);

  useEffect(() => {
    const events = ["mousemove", "mousedown", "click", "scroll", "keypress"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();
    return () => {
      if (timerId.current) clearTimeout(timerId.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
    // eslint-disable-next-line
  }, [chatClient]);

  // Pass timer as prop
  return children({ remainingTime });
}

export default AutoLogout;
