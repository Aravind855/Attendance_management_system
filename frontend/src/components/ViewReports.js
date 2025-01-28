import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, TextField, Grid } from "@mui/material";
import { styled } from "@mui/system";
import { DatePicker } from "@mui/x-date-pickers/DatePicker"; // Import DatePicker from MUI
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import axios from "axios";
import { useLocation } from "react-router-dom";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
}));

const ViewReports = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const date = queryParams.get("date");
    if (date) {
      fetchAttendanceReport(date);
    }
  }, [location]);

  const fetchAttendanceReport = async (date) => {
    try {
      const response = await axios.get("/api/get-attendance-report/", {
        params: { date },
      });
      setAttendanceData(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching attendance report:", err);
      setError("Failed to fetch attendance report. Please try again.");
    }
  };

  return (
    <StyledPaper>
      <Typography variant="h5" gutterBottom>
        Attendance Report
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      {attendanceData.length > 0 && (
        <Box mt={3}>
          <Typography variant="h6">Attendance Summary</Typography>
          <BarChart width={500} height={300} data={attendanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </Box>
      )}
    </StyledPaper>
  );
};

export default ViewReports;
