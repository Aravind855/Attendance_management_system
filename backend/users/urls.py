from django.urls import path
from users import views

urlpatterns = [
    path("api/register/", views.register_user, name="register"),
    path("api/login/", views.login_user, name="login"),
    path("api/forgot-password/", views.forgot_password, name="forgot-password"),
    path("api/verify-otp/", views.verify_otp, name="verify-otp"),
    path("api/send-signup-otp/", views.send_signup_otp, name="send_signup_otp"),
    path("api/verify-signup-otp/", views.verify_signup_otp, name="verify_signup_otp"),
    path("api/send-reset-otp/", views.send_reset_otp, name="send_reset_otp"),
    path("api/verify-reset-otp/", views.verify_reset_otp, name="verify_reset_otp"),
    path("api/send-mobile-otp/", views.send_mobile_otp, name="send_mobile_otp"),
    path("api/verify-mobile-otp/", views.verify_mobile_otp, name="verify_mobile_otp"),
    path("api/update-profile/", views.update_profile, name="update_profile"),
    path("api/student-data/", views.submit_student_data, name="submit_student_data"),
    path(
        "api/get-student-profile/<str:user_id>/",
        views.get_student_profile,
        name="get_student_profile",
    ),
    path(
        "api/get-registered-counts/",
        views.get_registered_counts,
        name="get_registered_counts",
    ),
    path(
        "api/get-registered-members/",
        views.get_registered_members,
        name="get_registered_members",
    ),
    path(
        "api/assign-staff-to-department/",
        views.assign_staff_to_department,
        name="assign_department",
    ),
    path('api/reset-password/', views.reset_password, name='reset_password'),
    path("api/add-student-by-staff/", views.add_student_by_staff, name="add_student_by_staff"),
    path("api/check-student-email/", views.check_student_email, name="check_student_email"),
    path(
        "api/get-department-students/",
        views.get_department_students,
        name="get_department_students",
    ),
    path(
        "api/get-all-students/",
        views.get_all_students,
        name="get_all_students",
    ),
    path(
        "api/mark-attendance/",
        views.mark_attendance,
        name="mark_attendance",
    ),
    path("api/get-attendance-report/", views.get_attendance_report, name="get_attendance_report"),
]