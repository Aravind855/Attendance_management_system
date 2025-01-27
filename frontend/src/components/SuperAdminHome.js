import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  TextField,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemText,
  AppBar,
  Toolbar,
  IconButton,
  CssBaseline,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import axios from "axios";

const drawerWidth = 240;

const SuperAdminHome = () => {
  const [counts, setCounts] = useState(null);
  const [studentMembers, setStudentMembers] = useState(null);
  const [staffMembers, setStaffMembers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [department, setDepartment] = useState("");
  const [open, setOpen] = useState(false);
  const [addStaffDialogOpen, setAddStaffDialogOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [unassignedGrades, setUnassignedGrades] = useState([]);
  let navigate = useNavigate();

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/get-registered-counts/"
        );
        setCounts(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch counts");
        setLoading(false);
      }
    };

    const checkUnassignedGrades = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/check-unassigned-grades/"
        );
        if (response.data.error) {
          setUnassignedGrades(response.data.error.split(", "));
        }
      } catch (err) {
        setError(
          err.response?.data?.error || "Failed to check unassigned grades"
        );
      }
    };

    fetchCounts();
    checkUnassignedGrades();
  }, []);

  const handleViewMembers = async (userType) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:8000/api/get-registered-members/?user_type=${userType}`
      );
      if (userType === "student") {
        setStudentMembers(response.data.members);
        setStudentDialogOpen(true);
      } else if (userType === "staff") {
        setStaffMembers(response.data.members);
        setStaffDialogOpen(true);
      }
      setLoading(false);
    } catch (err) {
      setError(
        err.response?.data?.error || `Failed to fetch ${userType} members`
      );
      setLoading(false);
    }
  };

  const handleCloseDialog = (userType) => {
    if (userType === "student") {
      setStudentDialogOpen(false);
    } else if (userType === "staff") {
      setStaffDialogOpen(false);
    } else if (userType === "assign") {
      setAssignDialogOpen(false);
      setSelectedStaff(null);
      setDepartment("");
    } else if (userType === "addStaff") {
      setAddStaffDialogOpen(false);
      setNewStaff({
        name: "",
        email: "",
        password: "",
      });
      setFormErrors({});
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  const handleAssignStaff = (staff) => {
    setSelectedStaff(staff);
    setAssignDialogOpen(true);
  };

  const handleDepartmentChange = (event) => {
    setDepartment(event.target.value);
  };

  const handleAssign = async () => {
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:8000/api/assign-staff-to-department/",
        {
          staff_id: selectedStaff._id,
          department,
        }
      );
      setAssignDialogOpen(false);
      setSelectedStaff(null);
      setDepartment("");
      handleViewMembers("staff"); // Refresh the staff list
      setLoading(false);
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to assign staff to department"
      );
      setLoading(false);
    }
  };

  const handleRemoveStaff = async (staffId) => {
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:8000/api/remove-staff-from-department/",
        {
          staff_id: staffId,
        }
      );
      handleViewMembers("staff"); // Refresh the staff list
      setLoading(false);
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to remove staff from department"
      );
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    setLoading(true);
    try {
      await axios.post("http://localhost:8000/api/add-staff/", newStaff);
      setAddStaffDialogOpen(false);
      setNewStaff({
        name: "",
        email: "",
        password: "",
      });
      setFormErrors({});
      handleViewMembers("staff"); // Refresh the staff list
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add staff");
      setLoading(false);
    }
  };

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const validateForm = () => {
    let errors = {};
    let isValid = true;

    if (!newStaff.name) {
      errors.name = "Name is required";
      isValid = false;
    }

    if (!newStaff.email) {
      errors.email = "Email is required";
      isValid = false;
    }

    if (!newStaff.password) {
      errors.password = "Password is required";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (validateForm()) {
      handleAddStaff();
    }
  };

  if (loading) {
    return (
      <Container
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Container>
    );
  }

 

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: "none" }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Super Admin Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <Toolbar>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        <List>
          <ListItem button onClick={() => handleViewMembers("student")}>
            <ListItemText primary="View Students" />
          </ListItem>
          <ListItem button onClick={() => handleViewMembers("staff")}>
            <ListItemText primary="View Staff" />
          </ListItem>
          <ListItem button onClick={() => setAddStaffDialogOpen(true)}>
            <ListItemText primary="Add Staff" />
          </ListItem>
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Container maxWidth="md">
          <Box
            sx={{
              mt: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography variant="h4" component="h1" gutterBottom>
              Welcome, Super Admin!
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              This is the super admin dashboard.
            </Typography>
            {unassignedGrades.length > 0 && (
              <Box
                sx={{
                  my: 2,
                  p: 2,
                  backgroundColor: "#fff7e6",
                  border: "1px solid #ffcc80",
                  borderRadius: "8px",
                }}
              >
                <Typography variant="body1" color="textSecondary">
                  The following grades are unassigned:
                </Typography>
                <ul>
                  {unassignedGrades.map((grade, index) => (
                    <li key={index}>
                      <Typography variant="body2">{grade}</Typography>
                    </li>
                  ))}
                </ul>
              </Box>
            )}

            {counts && (
              <Box sx={{ display: "flex", gap: 4, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h6">Registered Students</Typography>
                  <Typography variant="h4" color="primary">
                    {counts.student_count}
                  </Typography>
                </Paper>
                <Paper elevation={3} sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="h6">Registered Staff</Typography>
                  <Typography variant="h4" color="secondary">
                    {counts.staff_count}
                  </Typography>
                </Paper>
                <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleLogout}
                    sx={{ minWidth: 200 }}
                  >
                    Logout
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Container>
      </Box>

      <Dialog
        open={studentDialogOpen}
        onClose={() => handleCloseDialog("student")}
        fullWidth
        maxWidth="md"
      >
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

      <Dialog
        open={staffDialogOpen}
        onClose={() => handleCloseDialog("staff")}
        fullWidth
        maxWidth="md"
      >
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
                    <TableCell>User Type</TableCell>
                    <TableCell>Assigned Department</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staffMembers.map((staff) => (
                    <TableRow key={staff._id}>
                      <TableCell>{staff._id}</TableCell>
                      <TableCell>{staff.name}</TableCell>
                      <TableCell>{staff.email}</TableCell>
                      <TableCell>{staff.user_type}</TableCell>
                      <TableCell>
                        {staff.department || "Not Assigned"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleAssignStaff(staff)}
                        >
                          Assign
                        </Button>
                        {staff.department && (
                          <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => handleRemoveStaff(staff._id)}
                          >
                            Remove
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={assignDialogOpen}
        onClose={() => handleCloseDialog("assign")}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Assign Staff to Department</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Department"
            value={department}
            onChange={handleDepartmentChange}
            fullWidth
            variant="outlined"
            margin="normal"
          >
            <MenuItem value="IT">IT</MenuItem>
            <MenuItem value="AD">AD</MenuItem>
            <MenuItem value="CSE">CSE</MenuItem>
            <MenuItem value="IOT">IOT</MenuItem>
          </TextField>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAssign}
            disabled={!department}
          >
            Assign
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={addStaffDialogOpen}
        onClose={() => handleCloseDialog("addStaff")}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add Staff</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Name"
              value={newStaff.name}
              onChange={(e) =>
                setNewStaff({ ...newStaff, name: e.target.value })
              }
              fullWidth
              variant="outlined"
              margin="normal"
              error={!!formErrors.name}
              helperText={formErrors.name}
            />
            <TextField
              label="Email"
              value={newStaff.email}
              onChange={(e) =>
                setNewStaff({ ...newStaff, email: e.target.value })
              }
              fullWidth
              variant="outlined"
              margin="normal"
              error={!!formErrors.email}
              helperText={formErrors.email}
            />
            <TextField
              label="Password"
              type="password"
              value={newStaff.password}
              onChange={(e) =>
                setNewStaff({ ...newStaff, password: e.target.value })
              }
              fullWidth
              variant="outlined"
              margin="normal"
              error={!!formErrors.password}
              helperText={formErrors.password}
            />
            <Button variant="contained" color="primary" type="submit">
              Add Staff
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SuperAdminHome;
