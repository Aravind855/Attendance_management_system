// filepath: /d:/TypeScript/Attendance_management_system/frontend/src/components/AssignDepartmentForm.js
import React, { useState, useEffect } from "react";
import axios from "../config/axios";
import {
  Container,
  TextField,
  Button,
  MenuItem,
  Typography,
  Box,
} from "@mui/material";

const AssignDepartmentForm = () => {
  const [staffEmail, setStaffEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [staffMembers, setStaffMembers] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchStaffMembers = async () => {
      try {
        const response = await axios.get("/api/staff-members");
        setStaffMembers(response.data);
      } catch (error) {
        console.error("Error fetching staff members:", error);
      }
    };

    fetchStaffMembers();
  }, []);

  const handleAssignDepartment = async () => {
    try {
      const response = await axios.post("/api/assign-department", {
        email: staffEmail,
        department,
      });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.error || "Failed to assign department");
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
          Assign Department to Staff
        </Typography>
        <TextField
          select
          fullWidth
          margin="normal"
          label="Staff Email"
          value={staffEmail}
          onChange={(e) => setStaffEmail(e.target.value)}
        >
          {staffMembers.map((staff) => (
            <MenuItem key={staff.email} value={staff.email}>
              {staff.email}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          fullWidth
          margin="normal"
          label="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <MenuItem value="IT">IT</MenuItem>
          <MenuItem value="AD">AD</MenuItem>
          <MenuItem value="CSE">CSE</MenuItem>
          <MenuItem value="ECE">ECE</MenuItem>
          <MenuItem value="EEE">EEE</MenuItem>
        </TextField>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAssignDepartment}
          sx={{ mt: 3, mb: 2 }}
        >
          Assign Department
        </Button>
        {message && <Typography color="error">{message}</Typography>}
      </Box>
    </Container>
  );
};

export default AssignDepartmentForm;
