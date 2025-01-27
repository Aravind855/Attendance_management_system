import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Container,
    Paper,
    Button,
    Grid,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import ReportIcon from '@mui/icons-material/Report';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminHome = () => {
    const [admin, setAdmin] = useState(null);
    const navigate = useNavigate();
    const [selectedAction, setSelectedAction] = useState(null); // State to track selected action in sidebar
    const [numStudentsToAdd, setNumStudentsToAdd] = useState(1);
    const [studentData, setStudentData] = useState([]);
    const [addStudentStatus, setAddStudentStatus] = useState(null);

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) {
            navigate('/login');
            return;
        }
        
        const user = JSON.parse(userInfo);
        if (user.user_type !== 'admin') {
            navigate('/login');
            return;
        }
        setAdmin(user);
    }, [navigate]);

    useEffect(() => {
        // Initialize studentData when numStudentsToAdd changes
        const initialStudentData = Array.from({ length: numStudentsToAdd }, () => ({
            name: '',
            email: '',
        }));
        setStudentData(initialStudentData);
    }, [numStudentsToAdd]);

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const handleSidebarItemClick = (action) => {
        setSelectedAction(action);
        setAddStudentStatus(null); // Reset status when action changes
    };

    const handleNumStudentsChange = (event) => {
        setNumStudentsToAdd(parseInt(event.target.value, 10) || 1);
    };

    const handleStudentDataChange = (index, field, value) => {
        const updatedStudentData = [...studentData];
        updatedStudentData[index][field] = value;
        setStudentData(updatedStudentData);
    };

    const handleAddStudentsSubmit = async (event) => {
        event.preventDefault();
        setAddStudentStatus({ status: 'loading', message: 'Adding students...' });

        try {
            for (const student of studentData) {
                if (!student.name || !student.email) {
                    setAddStudentStatus({ status: 'error', message: 'Please fill in all student details.' });
                    return;
                }
                const response = await axios.post('/api/add-student-by-staff/', student);
                if (response.status !== 201) {
                    setAddStudentStatus({ status: 'error', message: `Failed to add student: ${student.email}` });
                    return; // Stop if one student fails to add
                }
            }
            setAddStudentStatus({ status: 'success', message: 'Students added successfully!' });
        } catch (error) {
            console.error('Error adding students:', error);
            setAddStudentStatus({ status: 'error', message: 'Failed to add students. Please check console for details.' });
        }
    };

    const renderMainContent = () => {
        switch (selectedAction) {
            case 'addStudent':
                return (
                    <Paper sx={{ p: 3, mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Add Students
                        </Typography>
                        <form onSubmit={handleAddStudentsSubmit}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel id="num-students-label">Number of Students to Add</InputLabel>
                                <Select
                                    labelId="num-students-label"
                                    id="num-students"
                                    value={numStudentsToAdd}
                                    label="Number of Students to Add"
                                    onChange={handleNumStudentsChange}
                                >
                                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                                        <MenuItem key={num} value={num}>{num}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {studentData.map((student, index) => (
                                <Paper key={index} sx={{ p: 2, mt: 2 }}>
                                    <Typography variant="subtitle1">Student {index + 1}</Typography>
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Name"
                                        value={student.name}
                                        onChange={(e) => handleStudentDataChange(index, 'name', e.target.value)}
                                        required
                                    />
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Email"
                                        type="email"
                                        value={student.email}
                                        onChange={(e) => handleStudentDataChange(index, 'email', e.target.value)}
                                        required
                                    />
                                </Paper>
                            ))}
                            <Box sx={{ mt: 2 }}>
                                <Button type="submit" variant="contained" color="primary">
                                    Add Students
                                </Button>
                                {addStudentStatus && (
                                    <Typography
                                        variant="body2"
                                        color={addStudentStatus.status === 'success' ? 'success.main' : 'error.main'}
                                        sx={{ mt: 1 }}
                                    >
                                        {addStudentStatus.message}
                                    </Typography>
                                )}
                            </Box>
                        </form>
                    </Paper>
                );
            case 'manageStudents':
                return (
                    <Paper sx={{ p: 3, mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Manage Students
                        </Typography>
                        <Typography>Functionality to manage students will be here.</Typography>
                    </Paper>
                );
            case 'systemSettings':
                return (
                    <Paper sx={{ p: 3, mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            System Settings
                        </Typography>
                        <Typography>System settings options will be here.</Typography>
                    </Paper>
                );
            case 'viewReports':
                return (
                    <Paper sx={{ p: 3, mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            View Reports
                        </Typography>
                        <Typography>Reports and analytics will be displayed here.</Typography>
                    </Paper>
                );
            default:
                return (
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Welcome to the Staff Dashboard. Select an action from the sidebar.
                        </Typography>
                    </Paper>
                );
        }
    };

    if (!admin) return null;

    return (
        <Container maxWidth="xl" sx={{ display: 'flex', mt: 4 }}>
            {/* Sidebar */}
            <Paper sx={{ width: 240, mr: 3, p: 2, height: 'fit-content' }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Admin Actions
                </Typography>
                <List>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => handleSidebarItemClick('addStudent')}>
                            <ListItemIcon>
                                <AddCircleIcon />
                            </ListItemIcon>
                            <ListItemText primary="Add Student" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => handleSidebarItemClick('manageStudents')}>
                            <ListItemIcon>
                                <PeopleIcon />
                            </ListItemIcon>
                            <ListItemText primary="Manage Students" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => handleSidebarItemClick('systemSettings')}>
                            <ListItemIcon>
                                <SettingsIcon />
                            </ListItemIcon>
                            <ListItemText primary="System Settings" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => handleSidebarItemClick('viewReports')}>
                            <ListItemIcon>
                                <ReportIcon />
                            </ListItemIcon>
                            <ListItemText primary="View Reports" />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Paper>

            {/* Main Content Area */}
            <Box sx={{ flexGrow: 1 }}>
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h4" component="h1">
                            Staff Dashboard
                        </Typography>
                        <Button variant="contained" color="error" onClick={handleLogout}>
                            Logout
                        </Button>
                    </Box>
                    
                    <Typography variant="h6" gutterBottom>
                        Welcome, {admin.name}!
                    </Typography>
                </Paper>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="h6">Total Students</Typography>
                            <Typography variant="h4">0</Typography>
                            <Button variant="text" sx={{ mt: 2 }}>View All Students</Button>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="h6">New Students Today</Typography>
                            <Typography variant="h4">0</Typography>
                            <Button variant="text" sx={{ mt: 2 }}>View Details</Button>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="h6">Active Students</Typography>
                            <Typography variant="h4">0</Typography>
                            <Button variant="text" sx={{ mt: 2 }}>View Active Students</Button>
                        </Paper>
                    </Grid>
                </Grid>

                {renderMainContent()}
            </Box>
        </Container>
    );
};

export default AdminHome; 