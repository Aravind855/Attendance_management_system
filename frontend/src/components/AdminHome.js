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
    FormControlLabel,
    RadioGroup,
    Radio,
    FormLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import ReportIcon from '@mui/icons-material/Report';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ListIcon from '@mui/icons-material/List';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminHome = () => {
    const [admin, setAdmin] = useState(null);
    const navigate = useNavigate();
    const [selectedAction, setSelectedAction] = useState(null); // State to track selected action in sidebar
    const [numStudentsToAdd, setNumStudentsToAdd] = useState(1);
    const [studentData, setStudentData] = useState([]);
    const [addStudentStatus, setAddStudentStatus] = useState(null);
    const [departmentStudents, setDepartmentStudents] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [attendanceData, setAttendanceData] = useState({}); // State to hold attendance status for each student
    const [attendanceSubmitStatus, setAttendanceSubmitStatus] = useState(null);

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
        fetchDepartmentStudents(user.department);
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

    const fetchDepartmentStudents = async (department) => {
        try {
            const response = await axios.get('/api/get-department-students/', { params: { department } });
            setDepartmentStudents(response.data.students);
        } catch (error) {
            console.error("Error fetching department students:", error);
        }
    };

    const fetchAllStudents = async () => {
        try {
            const response = await axios.get('/api/get-all-students/');
            setAllStudents(response.data.students);
        } catch (error) {
            console.error("Error fetching all students:", error);
        }
    };

    const handleActionClick = (action) => {
        setSelectedAction(action);
    };

    const handleAttendanceChange = (studentId) => {
        setAttendanceData(prevData => {
            const currentStatus = prevData[studentId];
            const newStatus = currentStatus === 'Present' ? 'Absent' : 'Present'; // Toggle between Present and Absent
            return {
                ...prevData,
                [studentId]: newStatus,
            };
        });
    };

    const handleSubmitAttendance = async () => {
        setAttendanceSubmitStatus({ status: 'loading', message: 'Submitting attendance...' });
        try {
            // Prepare attendance data for backend
            const attendanceRecords = Object.keys(attendanceData).map(studentId => ({
                studentId: studentId,
                status: attendanceData[studentId],
                date: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
            }));

            const response = await axios.post('/api/mark-attendance/', { attendanceRecords: attendanceRecords });
            if (response.status === 200) {
                setAttendanceSubmitStatus({ status: 'success', message: 'Attendance submitted successfully!' });
                // Reset attendanceData after successful submission if needed
                setAttendanceData({});
            } else {
                setAttendanceSubmitStatus({ status: 'error', message: 'Failed to submit attendance.' });
            }
        } catch (error) {
            console.error("Error submitting attendance:", error);
            setAttendanceSubmitStatus({ status: 'error', message: 'Error submitting attendance. Please check console.' });
        }
    };

    const renderMainContent = () => {
        switch (selectedAction) {
            case 'students':
                return (
                    <Paper sx={{ p: 2, mt: 2 }}>
                        <Typography variant="h6" gutterBottom>Department Students ({admin.department})</Typography>
                        <List>
                            {departmentStudents.map((student) => (
                                <ListItem key={student._id}>
                                    <ListItemText primary={student.name} secondary={student.email} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                );
            case 'all_students':
                return (
                    <Paper sx={{ p: 2, mt: 2 }}>
                        <Typography variant="h6" gutterBottom>All Students</Typography>
                        <List>
                            {allStudents.map((student) => (
                                <ListItem key={student._id}>
                                    <ListItemText primary={student.name} secondary={student.email} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                );
            case 'add_students':
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
            case 'settings':
                return <Paper sx={{ p: 2, mt: 2 }}> <Typography>Settings Content</Typography> </Paper>;
            case 'reports':
                return <Paper sx={{ p: 2, mt: 2 }}> <Typography>Reports Content</Typography> </Paper>;
            case 'mark_attendance':
                return (
                    <Paper sx={{ p: 2, mt: 2 }}>
                        <Typography variant="h6" gutterBottom>Mark Attendance - {admin.department} Department</Typography>
                        <TableContainer component={Paper}>
                            <Table aria-label="attendance table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><b>Student Name</b></TableCell>
                                        <TableCell align="right"><b>Registration No.</b></TableCell>
                                        <TableCell align="center"><b>Attendance Status</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {departmentStudents.map((student) => (
                                        <TableRow key={student._id}>
                                            <TableCell component="th" scope="row">
                                                <Button
                                                    onClick={() => handleAttendanceChange(student._id)}
                                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                                >
                                                    {student.name}
                                                </Button>
                                            </TableCell>
                                            <TableCell align="right">{student.registration_no}</TableCell>
                                            <TableCell align="center">
                                                {attendanceData[student._id] === 'Present' ? (
                                                    <Typography color="success">Present</Typography>
                                                ) : attendanceData[student._id] === 'Absent' ? (
                                                    <Typography color="error">Absent</Typography>
                                                ) : (
                                                    <Typography>-</Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Button variant="contained" color="primary" onClick={handleSubmitAttendance} sx={{ mt: 2 }}>
                            Submit Attendance
                        </Button>
                        {attendanceSubmitStatus && (
                            <Typography
                                variant="body2"
                                color={attendanceSubmitStatus.status === 'success' ? 'success.main' : 'error.main'}
                                sx={{ mt: 1 }}
                            >
                                {attendanceSubmitStatus.message}
                            </Typography>
                        )}
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
                        <ListItemButton selected={selectedAction === 'students'} onClick={() => handleActionClick('students')}>
                            <ListItemIcon>
                                <PeopleIcon />
                            </ListItemIcon>
                            <ListItemText primary="Department Students" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton selected={selectedAction === 'all_students'} onClick={() => { handleActionClick('all_students'); fetchAllStudents(); }}>
                            <ListItemIcon>
                                <ListIcon />
                            </ListItemIcon>
                            <ListItemText primary="All Students" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton selected={selectedAction === 'add_students'} onClick={() => handleActionClick('add_students')}>
                            <ListItemIcon>
                                <AddCircleIcon />
                            </ListItemIcon>
                            <ListItemText primary="Add Students" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton selected={selectedAction === 'mark_attendance'} onClick={() => handleActionClick('mark_attendance')}>
                            <ListItemIcon>
                                <EventAvailableIcon />
                            </ListItemIcon>
                            <ListItemText primary="Mark Attendance" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton selected={selectedAction === 'settings'} onClick={() => handleActionClick('settings')}>
                            <ListItemIcon>
                                <SettingsIcon />
                            </ListItemIcon>
                            <ListItemText primary="System Settings" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton selected={selectedAction === 'reports'} onClick={() => handleActionClick('reports')}>
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