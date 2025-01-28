import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import axios from "../config/axios";
import {
  Button,
  TextField,
  Container,
  Typography,
  Box,
  Link as MuiLink,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";

const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().required("Required"),
});

const Login = () => {
  const [userType, setUserType] = useState("user");
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState("");
  const [registrationError, setRegistrationError] = useState("");

  const handleTabChange = (event, newValue) => {
    setUserType(newValue);
    setError("");
    setIsRegistering(false);
    setRegistrationEmail("");
    setRegistrationError("");
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setError("");
    if (userType === "user" && !values.email.endsWith("@snsce.ac.in")) {
      setError("Please use a valid SNSCE email address.");
      setSubmitting(false);
      return;
    }
    try {
      const response = await axios.post("/api/login/", {
        email: values.email,
        password: values.password,
        user_type: userType,
      });

      if (response.data.user_type === "Superadmin") {
        localStorage.setItem("userInfo", JSON.stringify(response.data));
        navigate("/superadmin-home");
        return;
      }

      if (userType === "user" && !response.data.is_student) {
        setError("This email is not registered as a student");
        return;
      }

      localStorage.setItem("userInfo", JSON.stringify(response.data));

      if (response.data.user_type === "admin") {
        navigate("/admin-home");
      } else {
        navigate("/user-home");
      }
    } catch (err) {
      if (userType === "user") {
        setError("Invalid student credentials");
      } else {
        setError(err.response?.data?.error || "Login failed");
      }
    }
    setSubmitting(false);
  };

  const handleRegisterClick = () => {
    setIsRegistering(true);
    setRegistrationError("");
  };

  const handleRegistrationEmailChange = (event) => {
    setRegistrationEmail(event.target.value);
    setRegistrationError("");
  };

  const handleRegistrationSubmit = async () => {
    if (!registrationEmail.endsWith("@snsce.ac.in")) {
      setRegistrationError("Please use a valid SNSCE email address.");
      return;
    }

    try {
      const response = await axios.post("/api/check-student-email/", {
        email: registrationEmail,
      });
      if (response.status === 200) {
        localStorage.setItem("userInfo", JSON.stringify({ email: registrationEmail }));
        navigate("/StudentForm", { state: { registrationEmail } });
      } else {
        setRegistrationError("Email not found in student records.");
      }
    } catch (error) {
      setRegistrationError("Email not found in student records.");
      console.error("Error checking student email:", error);
    }
  };

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
          Login
        </Typography>

        <Tabs value={userType} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Student Login" value="user" />
          <Tab label="Staff Login" value="admin" />
          <Tab label="Admin Login" value="Superadmin" />
        </Tabs>

        {error && (
          <Box sx={{ mb: 2, width: "100%" }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        <Formik
          initialValues={{
            email: "",
            password: "",
          }}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <Field
                as={TextField}
                fullWidth
                margin="normal"
                name="email"
                label="Email"
                error={touched.email && errors.email}
                helperText={touched.email && errors.email}
              />

              <Field
                as={TextField}
                fullWidth
                margin="normal"
                name="password"
                label="Password"
                type="password"
                error={touched.password && errors.password}
                helperText={touched.password && errors.password}
              />

              <Box sx={{ mt: 2, textAlign: "right" }}>
                <MuiLink
                  component={RouterLink}
                  to="/forgot-password"
                  variant="body2"
                >
                  Forgot password?
                </MuiLink>
              </Box>

              {isRegistering && (
                <Box sx={{ mt: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="SNSCE Email for Registration"
                    type="email"
                    value={registrationEmail}
                    onChange={handleRegistrationEmailChange}
                    error={!!registrationError}
                    helperText={registrationError}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={handleRegistrationSubmit}
                  >
                    Register
                  </Button>
                  {registrationError && (
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                      {registrationError}
                    </Typography>
                  )}
                </Box>
              )}

              {userType === "user" && !isRegistering && (
                <Box sx={{ mt: 1, textAlign: "center" }}>
                  <MuiLink
                    component="button"
                    variant="body2"
                    onClick={handleRegisterClick}
                    sx={{
                      cursor: "pointer",
                      textDecoration: "underline",
                      border: "none",
                      background: "none",
                      padding: 0,
                      fontFamily: "inherit",
                      fontSize: "inherit",
                      color: "inherit",
                    }}
                  >
                    Register here
                  </MuiLink>
                </Box>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isSubmitting}
              >
                Login
              </Button>

              {userType === "admin" && (
                <Box sx={{ textAlign: "center" }}>
                  <MuiLink component={RouterLink} to="/signup" variant="body2">
                    Don't have an account? Sign Up
                  </MuiLink>
                </Box>
              )}
            </Form>
          )}
        </Formik>
      </Box>
    </Container>
  );
};

export default Login;
