import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Snackbar, Button } from "@mui/material";

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
       10 * 1000
    ); // 13 minutes
    timeoutRef.current = setTimeout(handleLogout, 10 * 60 * 1000); // 15 minutes
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

  return (
    <>
      {children}
      <Snackbar
        open={showWarning}
        autoHideDuration={6000}
        onClose={() => setShowWarning(false)}
        message="Your session will expire soon. Click OK to extend your session."
        action={
          <Button color="secondary" size="small" onClick={extendSession}>
            Extend Session
          </Button>
        }
      >
        <Alert
          onClose={() => setShowWarning(false)}
          severity="warning"
          sx={{ width: "100%" }}
        >
          Your session will expire soon. Click OK to extend your session.
        </Alert>
      </Snackbar>
    </>
  );
};

export default SessionTimeout;
