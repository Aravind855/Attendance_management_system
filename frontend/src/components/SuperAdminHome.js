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
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';

const SuperAdminHome = () => {
  const [counts, setCounts] = useState(null);
  const [members, setMembers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const handleViewMembers = async () => {
    setDialogOpen(true);
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/get-registered-members/');
      setMembers(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch members');
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
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
        <Button variant="contained" color="primary" onClick={handleViewMembers}>
          View Members
        </Button>
      </Box>
      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle>Registered Members</DialogTitle>
        <DialogContent>
          {members && (
            <Box>
              <Typography variant="h6" gutterBottom>Students</Typography>
              <List>
                {members.students.map((student) => (
                  <ListItem key={student._id}>
                    <ListItemText primary={`${student.name} (${student.email})`} />
                  </ListItem>
                ))}
              </List>
              <Typography variant="h6" gutterBottom>Staffs</Typography>
              <List>
                {members.staffs.map((staff) => (
                  <ListItem key={staff._id}>
                    <ListItemText primary={`${staff.name} (${staff.email})`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default SuperAdminHome; 