import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import axios from 'axios';

const SuperAdminHome = () => {
  const [counts, setCounts] = useState(null);
  const [studentMembers, setStudentMembers] = useState(null);
  const [staffMembers, setStaffMembers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/get-registered-counts/');
        setCounts(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch counts');
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const handleViewMembers = async (userType) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/api/get-registered-members/?user_type=${userType}`);
      if (userType === 'student') {
        setStudentMembers(response.data.members);
        setStudentDialogOpen(true);
      } else if (userType === 'staff') {
        setStaffMembers(response.data.members);
        setStaffDialogOpen(true);
      }
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to fetch ${userType} members`);
      setLoading(false);
    }
  };

  const handleCloseDialog = (userType) => {
    if (userType === 'student') {
      setStudentDialogOpen(false);
    } else if (userType === 'staff') {
      setStaffDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return <Container><Alert severity="error">{error}</Alert></Container>;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, Super Admin!
        </Typography>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          This is the super admin dashboard.
        </Typography>
        {counts && (
          <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">Registered Students</Typography>
              <Typography variant="h4" color="primary">{counts.student_count}</Typography>
            </Paper>
            <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">Registered Staff</Typography>
              <Typography variant="h4" color="secondary">{counts.staff_count}</Typography>
            </Paper>
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={() => handleViewMembers('student')}>
            View Students
          </Button>
          <Button variant="contained" color="primary" onClick={() => handleViewMembers('staff')}>
            View Staff
          </Button>
        </Box>
      </Box>

      <Dialog open={studentDialogOpen} onClose={() => handleCloseDialog('student')} fullWidth maxWidth="md">
        <DialogTitle>Registered Students</DialogTitle>
        <DialogContent>
          {studentMembers && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Mobile Number</TableCell>
                    <TableCell>Academic Year</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Date of Birth</TableCell>
                    <TableCell>Gender</TableCell>
 
                  </TableRow>
                </TableHead>
                <TableBody>
                  {studentMembers.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell>{student._id}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.mobile_number}</TableCell>
                      <TableCell>{student.academic_year}</TableCell>
                      <TableCell>{student.department}</TableCell>
                      <TableCell>{student.date_of_birth}</TableCell>
                      <TableCell>{student.gender}</TableCell>
                      <TableCell>{student.address}</TableCell>
                      <TableCell>{student.parent_name}</TableCell>
                      <TableCell>{student.parent_mobile_number}</TableCell>
                      <TableCell>{student.blood_group}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={staffDialogOpen} onClose={() => handleCloseDialog('staff')} fullWidth maxWidth="md">
        <DialogTitle>Registered Staff</DialogTitle>
        <DialogContent>
          {staffMembers && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Mobile Number</TableCell>
                    <TableCell>User Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staffMembers.map((staff) => (
                    <TableRow key={staff._id}>
                      <TableCell>{staff._id}</TableCell>
                      <TableCell>{staff.name}</TableCell>
                      <TableCell>{staff.email}</TableCell>
                      <TableCell>{staff.mobile_number}</TableCell>
                      <TableCell>{staff.user_type}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default SuperAdminHome; 