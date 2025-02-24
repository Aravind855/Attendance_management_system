import React from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import {
  Button,
  TextField,
  Container,
  Typography,
  Box,
  MenuItem,
} from "@mui/material";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StudentFormSchema = Yup.object().shape({
  name: Yup.string().required("Required"),
  registration_no: Yup.string().required("Required"),
  department: Yup.string().required("Required"),
  mobile_number: Yup.string()
    .matches(/^[0-9]{10}$/, "Phone number must be 10 digits")
    .required("Required"),
  gender: Yup.string().required("Required"),
  dob: Yup.date().required("Required"),
  academic_year: Yup.string().required("Required"),
});

const StudentForm = () => {
    const navigate = useNavigate();
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const email = userInfo?.email;

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Student Form
        </Typography>

        <Formik
          initialValues={{
            name: "",
            registration_no: "",
            department: "",
            mobile_number: "",
            gender: "",
            dob: "",
            academic_year: "",
          }}
          validationSchema={StudentFormSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
                const response = await axios.post('http://localhost:8000/api/student-data/', { ...values, email: email }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (response.status === 201) {
                    navigate('/user-home');
                } else {
                    console.error("Failed to submit student data");
                }
            } catch (error) {
                console.error("Error submitting student data:", error);
            }
            setSubmitting(false);
          }}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <Field
                as={TextField}
                fullWidth
                margin="normal"
                name="name"
                label="Name"
                error={touched.name && errors.name}
                helperText={touched.name && errors.name}
              />

              <Field
                as={TextField}
                fullWidth
                margin="normal"
                name="registration_no"
                label="Registration No."
                error={touched.registration_no && errors.registration_no}
                helperText={touched.registration_no && errors.registration_no}
              />

              <Field
                as={TextField}
                fullWidth
                margin="normal"
                name="department"
                label="Department"
                select
                error={touched.department && errors.department}
                helperText={touched.department && errors.department}
              >
                <MenuItem value="CSE">CSE</MenuItem>
                <MenuItem value="AD">AD</MenuItem>
                <MenuItem value="IT">IT</MenuItem>
                <MenuItem value="CSD">CSD</MenuItem>
                <MenuItem value="CST">CST</MenuItem>
                <MenuItem value="IOT">IOT</MenuItem>
                <MenuItem value="ECE">ECE</MenuItem>
                <MenuItem value="EEE">EEE</MenuItem>
                <MenuItem value="MECH">MECH</MenuItem>
                
              </Field>

              <Field
                as={TextField}
                fullWidth
                margin="normal"
                name="mobile_number"
                label="Mobile Number"
                error={touched.mobile_number && errors.mobile_number}
                helperText={touched.mobile_number && errors.mobile_number}
              />

              <Field
                as={TextField}
                fullWidth
                margin="normal"
                name="gender"
                label="Gender"
                select
                error={touched.gender && errors.gender}
                helperText={touched.gender && errors.gender}
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Field>

              <Field
                as={TextField}
                fullWidth
                margin="normal"
                name="dob"
                label="DOB"
                type="date"
                InputLabelProps={{ shrink: true }}
                error={touched.dob && errors.dob}
                helperText={touched.dob && errors.dob}
              />

              <Field
                as={TextField}
                fullWidth
                margin="normal"
                name="academic_year"
                label="Academic Year"
                select
                error={touched.academic_year && errors.academic_year}
                helperText={touched.academic_year && errors.academic_year}
              >
                <MenuItem value="1st Year">1st Year</MenuItem>
                <MenuItem value="2nd Year">2nd Year</MenuItem>
                <MenuItem value="3rd Year">3rd Year</MenuItem>
                <MenuItem value="4th Year">4th Year</MenuItem>
              </Field>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isSubmitting}
              >
                Submit
              </Button>
            </Form>
          )}
        </Formik>
      </Box>
    </Container>
  );
};

export default StudentForm;
