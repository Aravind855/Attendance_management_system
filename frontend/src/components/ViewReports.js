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

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
}));

const ViewReports = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [error, setError] = useState(null);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const fetchAttendanceReport = async () => {
    if (!selectedDate) return;

    try {
      const response = await axios.get("/api/get-attendance-report/", {
        params: { date: selectedDate.toISOString().split("T")[0] }, // Format date to YYYY-MM-DD
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
        View Attendance Report
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6}>
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={handleDateChange}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button
            variant="contained"
            color="primary"
            onClick={fetchAttendanceReport}
            disabled={!selectedDate}
          >
            Fetch Report
          </Button>
        </Grid>
      </Grid>
      {error && <Typography color="error">{error}</Typography>}
      {attendanceData.length > 0 && (
        <Box mt={3}>
          <Typography variant="h6">
            Attendance Summary for {selectedDate?.toLocaleDateString()}
          </Typography>
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
