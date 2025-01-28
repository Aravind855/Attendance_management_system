import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, Avatar, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Paper, Grid, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PersonIcon from '@mui/icons-material/Person';
import DashboardIcon from '@mui/icons-material/Dashboard';
import axios from 'axios';
import { Button } from '@mui/material';

// Styled components
const PageContainer = styled(Box)({
  minHeight: '100vh',
  backgroundColor: '#ffffff',
  padding: '2rem 0',
});

const Header = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 2rem',
  marginBottom: '3rem',
});

const GridContainer = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '2rem',
  padding: '0 2rem',
});

const Card = styled(Box)({
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  transition: 'transform 0.3s, box-shadow 0.3s',
  cursor: 'pointer',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 6px 25px rgba(0, 0, 0, 0.12)',
  },
});

const CardImage = styled('img')({
  width: '100%',
  height: '200px',
  objectFit: 'cover',
});

const CardContent = styled(Box)({
  padding: '1.5rem',
});

const CardTitle = styled(Typography)({
  fontSize: '1.25rem',
  fontWeight: '600',
  color: '#2c3e50',
  marginBottom: '0.5rem',
});

const CardDescription = styled(Typography)({
  color: '#666666',
  fontSize: '0.9rem',
});

const UserHome = () => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const userId = userInfo?.id;

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/get-student-profile/${userId}`);
        setStudentData(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch student data');
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [userId]);

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (path) => {
    handleClose();
    navigate(path);
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
    <PageContainer>
      <Header>
        <Box>
          <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: '600' }}>
            Attendance Dashboard
          </Typography>
          <Typography variant="h6" sx={{ color: '#666666', mt: 1 }}>
            Welcome, {studentData?.name}!
          </Typography>
        </Box>
        <IconButton onClick={handleProfileClick} size="large">
          <AccountCircleIcon sx={{ fontSize: 40, color: '#2c3e50' }} />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => handleMenuItemClick('/profile')}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Profile Info</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleMenuItemClick('/dashboard')}>
            <ListItemIcon>
              <DashboardIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Dashboard</ListItemText>
          </MenuItem>
        </Menu>
      </Header>

      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome, {studentData?.name}!
          </Typography>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>
                  Attendance Progress
                </Typography>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress variant="determinate" value={75} size={100} />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h5" component="div" color="textSecondary">
                      75%
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>
                  Attendance Percentage
                </Typography>
                <Typography variant="h4" color="primary">
                  85%
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>
                  Number of Leaves Taken
                </Typography>
                <Typography variant="h4" color="secondary">
                  3
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>
                  Total Working Days
                </Typography>
                <Typography variant="h4" color="textSecondary">
                  100
                </Typography>
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button variant="contained" color="primary" onClick={() => handleMenuItemClick('/profile')}>
                  View Profile
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Container>
    </PageContainer>
  );
};

export default UserHome;