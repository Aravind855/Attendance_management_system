import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const SessionTimeout = ({ children }) => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("userInfo")
  );
  const [showWarning, setShowWarning] = useState(false);

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

    warningTimeoutRef.current = setTimeout(
      () => setShowWarning(true),
       30 * 1000
    ); // 13 minutes
    timeoutRef.current = setTimeout(handleLogout, 1 * 60 * 1000); // 15 minutes
  };

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    setIsLoggedIn(false);
    navigate("/login");
  };

  const extendSession = () => {
    setShowWarning(false);
    resetTimeout();
  };

  useEffect(() => {
    if (isLoggedIn) {
      resetTimeout();
      window.addEventListener("mousemove", resetTimeout);
      window.addEventListener("keypress", resetTimeout);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      window.removeEventListener("mousemove", resetTimeout);
      window.removeEventListener("keypress", resetTimeout);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("userInfo"));
  }, [navigate]);

  useEffect(() => {
    if (showWarning) {
      alert("Your session will expire soon. Click OK to extend your session.");
      extendSession();
    }
  }, [showWarning]);

  return <>{children}</>;
};

export default SessionTimeout;
