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
    path("api/add-staff/", views.add_staff, name="add_staff"),
    path(
        "api/remove-staff-from-department/",
        views.remove_staff_from_department,
        name="remove_staff",
    ),
    path("api/check-unassigned-grades/", views.check_unassigned_grades, name="check_unassigned_grades"),
]
