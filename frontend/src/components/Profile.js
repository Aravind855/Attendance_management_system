import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Avatar,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EditIcon from '@mui/icons-material/Edit';
import axios from '../config/axios';
import OTPVerification from './OTPVerification';

const Profile = () => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [editDialog, setEditDialog] = useState({ open: false, field: null });
  const [newValue, setNewValue] = useState('');
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const navigate = useNavigate();

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const userId = userInfo?.id;
  const email = userInfo?.email;

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/get-student-profile/${userId}`);
        setStudentData(response.data);
        setMobileNumber(response.data.mobile_number || '');
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch student data');
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [userId]);

  const handleBack = () => {
    navigate('/user-home');
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const handleEdit = (field) => {
    setEditDialog({ open: true, field });
    setNewValue('');
    setIsPasswordVerified(false);
    if (field === 'password') {
        setPassword('');
    }
  };

  const handleClose = () => {
    setEditDialog({ open: false, field: null });
    setNewValue('');
  };

  const handleUpdateProfile = async (field, value) => {
    try {
      const response = await axios.post('http://localhost:8000/api/update-profile/', {
        user_id: userId,
        field: field,
        value: value,
      });
      if (response.data.success) {
        setUpdateSuccess(`${field} updated successfully`);
        // Update local state
         if (field === 'mobile_number') {
          setStudentData({...studentData, mobile_number: value});
          setMobileNumber(value);
        }
        
      } else {
        setError(response.data.error || `Failed to update ${field}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || `Failed to update ${field}`);
    }
  };

  const handlePasswordUpdate = async (newPassword) => {
    if (!newPassword) {
      setError('Password cannot be empty');
      return;
    }
    if (!isPasswordVerified) {
        setError('Please verify your new password first');
        return;
    }
    try {
      const response = await axios.post('http://localhost:8000/api/update-profile/', {
        user_id: userId,
        field: 'password',
        value: newPassword,
      });
      if (response.data.success) {
        setUpdateSuccess('Password updated successfully');
        setPassword('');
        setIsPasswordVerified(false);
        handleClose();
      } else {
        setError(response.data.error || 'Failed to update password');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password');
    }
  };

  if (loading) {
    return <Container><Typography>Loading profile...</Typography></Container>;
  }

  if (error) {
    return <Container><Alert severity="error">{error}</Alert></Container>;
  }

  const [firstName, lastName] = studentData.name.split(' ');

  const renderEditDialog = () => {
    const isPassword = editDialog.field === 'password';

    return (
      <Dialog open={editDialog.open} onClose={handleClose}>
        <DialogTitle>Update {editDialog.field?.replace('_', ' ')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={`New ${editDialog.field?.replace('_', ' ')}`}
            type={isPassword ? 'password' : 'text'}
            fullWidth
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
          {isPassword && newValue && (
            <OTPVerification
              type="reset"
              identifier={email}
              onVerify={(success) => setIsPasswordVerified(success)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={() => handlePasswordUpdate(newValue)}>Update</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Button onClick={handleBack} variant="outlined" sx={{ mb: 2 }}>
          Back to Home
        </Button>
        
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ width: 100, height: 100, mb: 2 }}>
              <AccountCircleIcon sx={{ fontSize: 100 }} />
            </Avatar>
            <Typography variant="h4" gutterBottom>
              Student Profile
            </Typography>
          </Box>

          {updateSuccess && <Alert severity="success" sx={{ mb: 2 }}>{updateSuccess}</Alert>}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="textSecondary">
                First Name
              </Typography>
              <Typography variant="h6" gutterBottom>
                {firstName}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="textSecondary">
                Last Name
              </Typography>
              <Typography variant="h6" gutterBottom>
                {lastName}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="textSecondary">
                Registration Number
              </Typography>
              <Typography variant="h6" gutterBottom>
                {studentData.registration_no}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="textSecondary">
                Department
              </Typography>
              <Typography variant="h6" gutterBottom>
                {studentData.department}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="textSecondary">
                Gender
              </Typography>
              <Typography variant="h6" gutterBottom>
                {studentData.gender}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="textSecondary">
                Date of Birth
              </Typography>
              <Typography variant="h6" gutterBottom>
                {studentData.dob}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" color="textSecondary">
                Academic Year
              </Typography>
              <Typography variant="h6" gutterBottom>
                {studentData.academic_year}
              </Typography>
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" color="textSecondary">
                  Email
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {email}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" color="textSecondary">
                  Mobile Number
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {mobileNumber}
                </Typography>
              </Box>
              <IconButton onClick={() => handleEdit('mobile_number')}>
                <EditIcon />
              </IconButton>
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" color="textSecondary">
                  Password
                </Typography>
                <Typography variant="h6" gutterBottom>
                  ••••••••
                </Typography>
              </Box>
              <IconButton onClick={() => handleEdit('password')}>
                <EditIcon />
              </IconButton>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleLogout}
              sx={{ minWidth: 200 }}
            >
              Logout
            </Button>
          </Box>
        </Paper>
      </Box>
      {renderEditDialog()}
    </Container>
  );
};

export default Profile; 