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
    const [selectedAction, setSelectedAction] = useState('mark_attendance'); // Default action is 'mark_attendance'
    const [numStudentsToAdd, setNumStudentsToAdd] = useState(1);
    const [studentData, setStudentData] = useState([]);
    const [addStudentStatus, setAddStudentStatus] = useState(null);
    const [departmentStudents, setDepartmentStudents] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [attendanceData, setAttendanceData] = useState({});
    const [attendanceSubmitStatus, setAttendanceSubmitStatus] = useState(null);
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [academicYearFilter, setAcademicYearFilter] = useState('');
    const [attendanceAction, setAttendanceAction] = useState('Present'); // Default attendance action

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
        console.log("Admin Department:", user.department);
        fetchDepartmentStudents(user.department);
        fetchAllStudents(); // Fetch all students on load
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

    const handleActionClick = (action) => {
        setSelectedAction(action);
        setAttendanceSubmitStatus(null); // Reset status when action changes
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
            console.log("Fetching students for department:", department);
            const response = await axios.get('/api/get-department-students/', { params: { department } });
            console.log("API Response (get-department-students):", response.data);
            setDepartmentStudents(response.data.students);
            console.log("Department Students State:", response.data.students);
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

    const handleAttendanceChange = (studentId, status) => {
        setAttendanceData(prevData => ({
            ...prevData,
            [studentId]: status,
        }));
    };

    const handleSubmitAttendance = async () => {
        setAttendanceSubmitStatus({ status: 'loading', message: 'Submitting attendance...' });
        try {
            const attendanceRecords = Object.keys(attendanceData).map(studentId => ({
                studentId: studentId,
                status: attendanceData[studentId],
                date: new Date().toISOString().split('T')[0]
            }));

            const response = await axios.post('/api/mark-attendance/', { attendanceRecords: attendanceRecords });
            if (response.status === 200) {
                setAttendanceSubmitStatus({ status: 'success', message: 'Attendance submitted successfully!' });
                setAttendanceData({}); // Clear attendance data after submit
            } else {
                setAttendanceSubmitStatus({ status: 'error', message: 'Failed to submit attendance.' });
            }
        } catch (error) {
            console.error("Error submitting attendance:", error);
            setAttendanceSubmitStatus({ status: 'error', message: 'Error submitting attendance. Please check console.' });
        }
    };

    const renderSidebar = () => (
        <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Admin Actions
            </Typography>
            <List>
                <ListItem disablePadding>
                    <ListItemButton selected={selectedAction === 'mark_attendance'} onClick={() => handleActionClick('mark_attendance')}>
                        <ListItemIcon><EventAvailableIcon /></ListItemIcon>
                        <ListItemText primary="Mark Attendance" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton selected={selectedAction === 'students'} onClick={() => handleActionClick('students')}>
                        <ListItemIcon><PeopleIcon /></ListItemIcon>
                        <ListItemText primary="Department Students" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton selected={selectedAction === 'all_students'} onClick={() => handleActionClick('all_students')}>
                        <ListItemIcon><ListIcon /></ListItemIcon>
                        <ListItemText primary="All Students" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton selected={selectedAction === 'add_students'} onClick={() => handleActionClick('add_students')}>
                        <ListItemIcon><AddCircleIcon /></ListItemIcon>
                        <ListItemText primary="Add Students" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton selected={selectedAction === 'settings'} onClick={() => handleActionClick('settings')}>
                        <ListItemIcon><SettingsIcon /></ListItemIcon>
                        <ListItemText primary="System Settings" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton selected={selectedAction === 'reports'} onClick={() => handleActionClick('reports')}>
                        <ListItemIcon><ReportIcon /></ListItemIcon>
                        <ListItemText primary="View Reports" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Paper>
    );

    const renderMainContent = () => {
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString();
        const formattedTime = currentDate.toLocaleTimeString();

        switch (selectedAction) {
            case 'students':
                return (
                    <Paper sx={{ p: 2, mt: 2 }}>
                        <Typography variant="h6" gutterBottom>Department Students ({admin.department})</Typography>
                        <FormControl fullWidth margin="normal">
                            <InputLabel id="department-filter-label">Filter by Department</InputLabel>
                            <Select
                                labelId="department-filter-label"
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                            >
                                <MenuItem value="">All Departments</MenuItem>
                                {/* Add other department options here */}
                            </Select>
                        </FormControl>
                        <TableContainer component={Paper}>
                            <Table aria-label="department students table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><b>Name</b></TableCell>
                                        <TableCell align="right"><b>Email</b></TableCell>
                                        <TableCell align="right"><b>Registration No.</b></TableCell>
                                        <TableCell align="right"><b>Department</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {departmentStudents.filter(student => 
                                        !departmentFilter || student.department === departmentFilter
                                    ).map((student) => (
                                        <TableRow key={student._id}>
                                            <TableCell component="th" scope="row">{student.name}</TableCell>
                                            <TableCell align="right">{student.email}</TableCell>
                                            <TableCell align="right">{student.registration_no}</TableCell>
                                            <TableCell align="right">{student.department}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                );
            case 'all_students':
                return (
                    <Paper sx={{ p: 2, mt: 2 }}>
                        <Typography variant="h6" gutterBottom>All Students</Typography>
                        <FormControl fullWidth margin="normal">
                            <InputLabel id="academic-year-filter-label">Filter by Academic Year</InputLabel>
                            <Select
                                labelId="academic-year-filter-label"
                                value={academicYearFilter}
                                onChange={(e) => setAcademicYearFilter(e.target.value)}
                            >
                                <MenuItem value="">All Academic Years</MenuItem>
                                {/* Add other academic year options here */}
                            </Select>
                        </FormControl>
                        <TableContainer component={Paper}>
                            <Table aria-label="all students table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><b>Name</b></TableCell>
                                        <TableCell align="right"><b>Email</b></TableCell>
                                        <TableCell align="right"><b>Registration No.</b></TableCell>
                                        <TableCell align="right"><b>Department</b></TableCell>
                                        <TableCell align="right"><b>Mobile Number</b></TableCell>
                                        <TableCell align="right"><b>Date of Birth</b></TableCell>
                                        <TableCell align="right"><b>Gender</b></TableCell>
                                        <TableCell align="right"><b>Academic Year</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {allStudents.filter(student => 
                                        !academicYearFilter || student.academic_year === academicYearFilter
                                    ).map((student) => {
                                        // Check if all required fields are present
                                        if (!student.name || !student.email || !student.registration_no || !student.department) {
                                            return null; // Skip rendering this student if any required field is missing
                                        }
                                        return (
                                            <TableRow key={student._id}>
                                                <TableCell component="th" scope="row">{student.name}</TableCell>
                                                <TableCell align="right">{student.email}</TableCell>
                                                <TableCell align="right">{student.registration_no}</TableCell>
                                                <TableCell align="right">{student.department}</TableCell>
                                                <TableCell align="right">{student.mobile_number || '-'}</TableCell>
                                                <TableCell align="right">{student.dob || '-'}</TableCell>
                                                <TableCell align="right">{student.gender || '-'}</TableCell>
                                                <TableCell align="right">{student.academic_year || '-'}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
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
            default: // Default case is now 'mark_attendance'
                return (
                    <Paper sx={{ p: 2, mt: 2 }}>
                        <Typography variant="h6" gutterBottom>Mark Attendance - {admin.department} Department</Typography>
                        <Typography variant="subtitle1" gutterBottom>Date: {formattedDate}, Time: {formattedTime}</Typography>
                        <FormControl fullWidth margin="normal">
                            <InputLabel id="attendance-action-label">Attendance Action</InputLabel>
                            <Select
                                labelId="attendance-action-label"
                                value={attendanceAction} // Add state for attendance action
                                onChange={(e) => setAttendanceAction(e.target.value)} // Update state on change
                            >
                                <MenuItem value="Present">Present</MenuItem>
                                <MenuItem value="Absent">Absent</MenuItem>
                                <MenuItem value="Late">Late</MenuItem>
                            </Select>
                        </FormControl>
                        <TableContainer component={Paper}>
                            <Table aria-label="attendance table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><b>Student Name</b></TableCell>
                                        <TableCell align="right"><b>Registration No.</b></TableCell>
                                        <TableCell align="center"><b>Attendance Status</b></TableCell>
                                        <TableCell align="center"><b>Actions</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {departmentStudents.map((student) => (
                                        <TableRow key={student._id}>
                                            <TableCell component="th" scope="row">
                                                {student.name}
                                            </TableCell>
                                            <TableCell align="right">{student.registration_no}</TableCell>
                                            <TableCell align="center">
                                                {attendanceData[student._id] || '-'}
                                            </TableCell>
                                            <TableCell align="center">
                                                <FormControl component="fieldset">
                                                    <RadioGroup
                                                        row
                                                        aria-label="attendance"
                                                        name={`attendance-${student._id}`}
                                                        value={attendanceData[student._id] || ''}
                                                        onChange={(e) => handleAttendanceChange(student._id, e.target.value)}
                                                    >
                                                        <FormControlLabel value="Present" control={<Radio />} label="Present" />
                                                        <FormControlLabel value="Absent" control={<Radio />} label="Absent" />
                                                        <FormControlLabel value="Late" control={<Radio />} label="Late" />
                                                    </RadioGroup>
                                                </FormControl>
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
        }
    };

    if (!admin) return null;

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            <Box sx={{ width: 240, height: '100%', p: 2 }}>
                {renderSidebar()}
                <Button variant="contained" color="error" onClick={handleLogout} sx={{ mt: 2 }}>Logout</Button>
            </Box>
            <Box sx={{ flexGrow: 1, p: 3, bgcolor: '#f4f6f8' }}>
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h4" component="h1">
                            Staff Dashboard
                        </Typography>
                        <Typography variant="h6">
                            Welcome, {admin ? admin.name : 'Admin'}!
                        </Typography>
                    </Box>
                    <Typography variant="subtitle1">
                        Department: {admin ? admin.department : 'Not Assigned'}
                    </Typography>
                </Paper>
                {renderMainContent()}
            </Box>
        </Box>
    );
};

export default AdminHome; 