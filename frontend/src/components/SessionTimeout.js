import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const SessionTimeout = ({ children }) => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('userInfo'));

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(handleLogout, 15 * 60 * 1000); 
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    setIsLoggedIn(false);
    navigate('/login');
  };

  useEffect(() => {
    if (isLoggedIn) {
      resetTimeout();
      window.addEventListener('mousemove', resetTimeout);
      window.addEventListener('keypress', resetTimeout);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keypress', resetTimeout);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('userInfo'));
  }, [navigate]);

  return <>{children}</>;
};

export default SessionTimeout; 