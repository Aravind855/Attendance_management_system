import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../config/axios";
import { Container, Box, Typography, Alert } from "@mui/material";

const ValidateResetToken = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const validateToken = async () => {
      const token = new URLSearchParams(location.search).get("token");
      if (!token) {
        setError("Invalid or missing token");
        return;
      }

      try {
        const response = await axios.get(
          `/api/validate-reset-token/?token=${token}`
          );
          console.log(response.data);
        setEmail(response.data.email);
        navigate("/reset-password", {
          state: { email: response.data.email, token },
        });
      } catch (err) {
        setError(err.response?.data?.error || "Failed to validate token");
      }
    };

    validateToken();
  }, [location.search, navigate]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Validating Token
        </Typography>
        {error && (
          <Box sx={{ mt: 2, width: "100%" }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default ValidateResetToken;
