from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
from django.contrib.auth.hashers import check_password
from django.core.mail import send_mail, get_connection
from datetime import datetime, timedelta
from django.conf import settings
from .models import CustomUser
from pymongo.errors import ConnectionFailure, OperationFailure
from .mongodb import users_collection, admins_collection, db
import logging
import random
from django.core.cache import cache
import json
from bson import ObjectId
from django.contrib.auth.hashers import make_password

import re

logger = logging.getLogger(__name__)

def send_email_otp(email, otp):
    try:
        send_mail('Verification OTP', f'Your OTP is: {otp}',settings.EMAIL_HOST_USER,[email],fail_silently=False,)
        return True
    except Exception as e:
        logger.error(f"Error sending email OTP: {str(e)}")
        return False

def send_sms_otp(phone, otp):
    try:
        logger.info(f"SMS OTP {otp} would be sent to {phone}")
        return True
    except Exception as e:
        logger.error(f"Error sending SMS OTP: {str(e)}")
        return False

def generate_otp():
    return str(random.randint(100000, 999999))

def send_otp_email(subject, message, to_email):
    try:
        connection = get_connection(
            backend='django.core.mail.backends.smtp.EmailBackend',
            host=settings.EMAIL_HOST,
            port=settings.EMAIL_PORT,
            username=settings.EMAIL_HOST_USER,
            password=settings.EMAIL_HOST_PASSWORD,
            use_tls=settings.EMAIL_USE_TLS
        )

        sent = send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [to_email],
            fail_silently=False,
            connection=connection
        )

        if sent == 1:
            logger.info(f"Email sent successfully to {to_email}")
            return True
        else:
            logger.error(f"Failed to send email to {to_email}")
            return False

    except Exception as e:
        logger.error(f"Error sending email to {to_email}: {str(e)}")
        if settings.DEBUG:
            print(f"Would send email:\nTo: {to_email}\nSubject: {subject}\nMessage: {message}")
        return False

@api_view(['POST'])
def send_otp(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            identifier = data.get('email') or data.get('phone')
            type = data.get('type')
            
            if not identifier:
                return JsonResponse({'error': f'Missing {type}'}, status=400)
            
            otp = generate_otp()
            cache.set(f'otp_{type}_{identifier}', otp, timeout=60)
            
            if type == 'email':
                if not send_email_otp(identifier, otp):
                    return JsonResponse({'error': 'Failed to send email OTP'}, status=500)
            else:
                if not send_sms_otp(identifier, otp):
                    return JsonResponse({'error': 'Failed to send SMS OTP'}, status=500)
                
            return JsonResponse({'message': 'OTP sent successfully'})
        except Exception as e:
            logger.error(f"Error in send_otp: {str(e)}")
            return JsonResponse({'error': 'Internal server error'}, status=500)

@api_view(['POST'])
def verify_otp(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            identifier = data.get('email') or data.get('phone')
            type = data.get('type')
            user_otp = data.get('otp')
            
            if not all([identifier, type, user_otp]):
                return JsonResponse({'error': 'Missing required fields'}, status=400)
            
            stored_otp = cache.get(f'otp_{type}_{identifier}')
            
            if not stored_otp:
                return JsonResponse({'error': 'OTP expired'}, status=400)
                
            if stored_otp != user_otp:
                return JsonResponse({'error': 'Invalid OTP'}, status=400)
                
            cache.delete(f'otp_{type}_{identifier}')
            
            return JsonResponse({'message': 'OTP verified successfully'})
        except Exception as e:
            logger.error(f"Error in verify_otp: {str(e)}")
            return JsonResponse({'error': 'Internal server error'}, status=500)
        
def send_reset_email(email):
    reset_link = f"http://localhost:3000/reset-password"
    subject = 'Password Reset Request'
    message = f'Click the following link to reset your password: {reset_link}'
    try:
        send_mail(subject, message, settings.EMAIL_HOST_USER, [email], fail_silently=False,)
        return True
    except Exception as e:
        logger.error(f"Error sending reset email: {str(e)}")
        return False

@api_view(['POST'])
def register_user(request):
    try:
        logger.info("Registration request data: %s", request.data)
        name = request.data.get('name')
        email = request.data.get('email')
        mobile_number = request.data.get('mobile_number')
        password = request.data.get('password')
        user_type = request.data.get('user_type', 'user')
        
        if not all([name, email, mobile_number, password]):
            missing = [field for field in ['name', 'email', 'mobile_number', 'password'] 
                      if not request.data.get(field)]
            return Response(
                {'error': f'Missing required fields: {", ".join(missing)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if user_type == "user" and not email.endswith("@snsce.ac.in"):
            return Response(
                {"error": "Please use a valid SNSCE email address"},
                status=status.HTTP_400_BAD_REQUEST,
            )


        user_data = {
            "name": name,
            "email": email,
            "mobile_number": mobile_number,
            "password": make_password(password),
            "user_type": user_type,
        }

        if user_type == "user":
            result = db.students.insert_one(user_data)
        else:
            result = db.staff.insert_one(user_data)

        if result.inserted_id:
            logger.info("User registered successfully: %s", email)
            return Response(
                {'message': 'User registered successfully', 'id': str(result.inserted_id)},
                status=status.HTTP_201_CREATED
            )
        else:
            logger.error("User registration failed: %s", email)
            return Response(
                {'error': 'User registration failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    except Exception as e:
        logger.error(f"Error in register_user: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
def add_staff(request):
    try:
        logger.info("Add staff request data: %s", request.data)
        name = request.data.get("name")
        email = request.data.get("email")
        password = request.data.get("password")

        if not all([name, email, password]):
            missing = [
                field
                for field in ["name", "email", "password"]
                if not request.data.get(field)
            ]
            return Response(
                {"error": f'Missing required fields: {", ".join(missing)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

       

        staff_data = {
            "name": name,
            "email": email,
            "password": make_password(password),
            "user_type": "staff",
        }

        result = db.staff.insert_one(staff_data)

        if result.inserted_id:
            logger.info("Staff added successfully: %s", email)
            return Response(
                {"message": "Staff added successfully", "id": str(result.inserted_id)},
                status=status.HTTP_201_CREATED,
            )
        else:
            logger.error("Failed to add staff: %s", email)
            return Response(
                {"error": "Failed to add staff"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    except Exception as e:
        logger.error(f"Error in add_staff: {str(e)}", exc_info=True)
        return Response(
            {"error": "Internal server error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
def add_staff(request):
    try:
        logger.info("Add staff request data: %s", request.data)
        name = request.data.get("name")
        email = request.data.get("email")
        password = request.data.get("password")

        if not all([name, email, password]):
            missing = [
                field
                for field in ["name", "email", "password"]
                if not request.data.get(field)
            ]
            return Response(
                {"error": f'Missing required fields: {", ".join(missing)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        staff_data = {
            "name": name,
            "email": email,
            "password": make_password(password),
            "user_type": "staff",
        }

        result = db.staff.insert_one(staff_data)

        if result.inserted_id:
            logger.info("Staff added successfully: %s", email)
            return Response(
                {"message": "Staff added successfully", "id": str(result.inserted_id)},
                status=status.HTTP_201_CREATED,
            )
        else:
            logger.error("Failed to add staff: %s", email)
            return Response(
                {"error": "Failed to add staff"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    except Exception as e:
        logger.error(f"Error in add_staff: {str(e)}", exc_info=True)
        return Response(
            {"error": "Internal server error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
def login_user(request):
    email = request.data.get("email")
    password = request.data.get("password")
    user_type = request.data.get("user_type")

    if not all([email, password, user_type]):
        return Response(
            {"error": "Email, password, and user type are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if user_type == "Superadmin":
        admin = db.admin.find_one({"email": email})
        if admin and (password == admin["password"]):
            logger.info("Super admin login successful")
            return Response(
                {
                    "message": "Login successful",
                    "id": str(admin["_id"]),
                    "email": admin["email"],
                    "user_type": "Superadmin",
                    "is_student": False,
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"error": "Invalid Superadmin credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
    elif user_type == "admin":
        admin = db.staff.find_one({"email": email})

        if admin and check_password(password, admin["password"]):
            logger.info("Admin login successful for user: %s", email)
            return Response(
                {
                    "message": "Login successful",
                    "id": str(admin["_id"]),
                    "name": admin["name"],
                    "user_type": "admin",
                    "email": admin["email"],
                    "is_student": False,
                    "mobile_number": admin.get("mobile_number", ""),
                    "department": admin.get("department", None),
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"error": "Invalid Staff credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

    elif user_type == "user":
        if not email.endswith("@snsce.ac.in"):
            return Response(
                {"error": "Please use a valid SNSCE email address"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        student = db.students.find_one({"email": email})
        if not student:
            student_data = {"email": email, "password": make_password(password)}
            student = db.students.find_one({"email": email})
        if not check_password(password, student["password"]):
            return Response(
                {"error": "Invalid student credentials"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        student_data = db.students_data.find_one({"email": email})
        has_student_data = bool(student_data)

        response_data = {
            "id": str(student["_id"]),
            "email": student["email"],
            "user_type": "user",
            "is_student": True,
            "name": student.get("name", ""),
            "mobile_number": student.get("mobile_number", ""),
            "has_student_data": has_student_data,
            "department": student.get("department", None),
        }
        logger.info("Student login successful for: %s", email)
        return Response(response_data)

    else:
        return Response(
            {"error": "Invalid user type"},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(['POST'])
def forgot_password(request):
    try:
        email = request.data.get('email')
        if not email:
            return Response(
                {'error': 'Email is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = CustomUser.get_user_by_email(email, 'user')
        admin = CustomUser.get_user_by_email(email, 'admin')

        if not user and not admin:
            return Response(
                {'error': 'Email not registered'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        email_sent=send_reset_email(email)
        otp = CustomUser.generate_otp(email, 'user' if user else 'admin')
        if not email_sent:
            return Response(
                {'error': 'Failed to send OTP'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'message': 'OTP sent successfully'
        })
    except Exception as e:
        logger.error(f"Error in forgot_password: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to send OTP'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def send_signup_otp(request):
    try:
        email = request.data.get('email')
        if not email:
            return Response(
                {'error': 'Email is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = CustomUser.get_user_by_email(email, 'user')
        admin = CustomUser.get_user_by_email(email, 'admin')

        if user or admin:
            return Response(
                {'error': 'Email already registered'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        otp = CustomUser.generate_otp(email, 'user')
        if not send_email_otp(email, otp):
            return Response(
                {'error': 'Failed to send OTP'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'message': 'OTP sent successfully'
        })
    except Exception as e:
        logger.error(f"Error in send_signup_otp: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to send OTP'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def verify_signup_otp(request):
    try:
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not all([email, otp]):
            return Response(
                {'error': 'Email and OTP are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        stored_user = CustomUser.get_user_by_email(email, 'user')
        stored_admin = CustomUser.get_user_by_email(email, 'admin')
        
        if stored_user and stored_user.get('otp') == otp:
            CustomUser.update_password(email, None, 'user')
            return Response({
                'message': 'OTP verified successfully'
            })
        elif stored_admin and stored_admin.get('otp') == otp:
            CustomUser.update_password(email, None, 'admin')
            return Response({
                'message': 'OTP verified successfully'
            })
        else:
            return Response(
                {'error': 'Invalid OTP'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        logger.error(f"Error in verify_signup_otp: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to verify OTP'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def send_reset_otp(request):
    try:
        email = request.data.get('email')
        if not email:
            return Response(
                {'error': 'Email is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = CustomUser.get_user_by_email(email, 'user')
        admin = CustomUser.get_user_by_email(email, 'admin')
        
        if not user and not admin:
            return Response(
                {'error': 'Email not registered'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        otp = CustomUser.generate_otp(email, 'user' if user else 'admin')
        if not send_email_otp(email, otp):
            return Response(
                {'error': 'Failed to send OTP'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'message': 'OTP sent successfully'
        })
    except Exception as e:
        logger.error(f"Error in send_reset_otp: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to send OTP'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def verify_reset_otp(request):
    try:
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not all([email, otp]):
            return Response(
                {'error': 'Email and OTP are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        stored_user = CustomUser.get_user_by_email(email, 'user')
        stored_admin = CustomUser.get_user_by_email(email, 'admin')
        
        if stored_user and stored_user.get('otp') == otp:
            CustomUser.update_password(email, None, 'user')
            return Response({
                'message': 'OTP verified successfully'
            })
        elif stored_admin and stored_admin.get('otp') == otp:
            CustomUser.update_password(email, None, 'admin')
            return Response({
                'message': 'OTP verified successfully'
            })
        else:
            return Response(
                {'error': 'Invalid OTP'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        logger.error(f"Error in verify_reset_otp: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to verify OTP'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def send_mobile_otp(request):
    try:
        mobile_number = request.data.get('mobile_number')
        if not mobile_number:
            return Response(
                {'error': 'Mobile number is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        otp = generate_otp()
        cache.set(f'otp_mobile_{mobile_number}', otp, timeout=60)
        if not send_sms_otp(mobile_number, otp):
            return Response(
                {'error': 'Failed to send OTP'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'message': 'OTP sent successfully'
        })
    except Exception as e:
        logger.error(f"Error in send_mobile_otp: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to send OTP'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def verify_mobile_otp(request):
    try:
        mobile_number = request.data.get('mobile_number')
        otp = request.data.get('otp')
        verification_type = request.data.get('type')
        
        if not all([mobile_number, otp, verification_type]):
            return Response(
                {'error': 'Mobile number, OTP and type are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        stored_otp = cache.get(f'otp_mobile_{mobile_number}')
        
        if not stored_otp:
            return Response(
                {'error': 'OTP expired'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if stored_otp != otp:
            return Response(
                {'error': 'Invalid OTP'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cache.delete(f'otp_mobile_{mobile_number}')
        
        temp_otps_collection = db["temp_otps"]
        temp_otps_collection.delete_one({
            "mobile_number": mobile_number,
            "type": verification_type
        })

        return Response({
            'message': 'Mobile number verified successfully'
        })

    except Exception as e:
        logger.error(f"Error verifying mobile OTP: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to verify OTP'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        


@api_view(['POST'])
def update_profile(request):
    try:
        user_id = request.data.get('user_id')
        field = request.data.get('field')
        value = request.data.get('value')

        if not all([user_id, field, value]):
            return Response(
                {'error': 'Missing required fields'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        user = users_collection.find_one({'_id': ObjectId(user_id)})
        collection = users_collection if user else admins_collection

        if field == 'password':
            value = make_password(value)

        result = collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {field: value}}
        )

        if result.modified_count == 1:
            return Response({'success': True, 'message': f'{field} updated successfully'})
        else:
            return Response(
                {'error': 'Failed to update profile'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to update profile'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def submit_student_data(request):
    try:
        data = request.data
        email = data.get('email')
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        existing_data = db.students.find_one({"email": email})
        if existing_data:
            return Response(
                {'error': 'Student data already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        db.students.update_one(data)
        return Response(
            {'message': 'Student data submitted successfully'},
            status=status.HTTP_201_CREATED
        )
    except Exception as e:
        logger.error(f"Error submitting student data: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to submit student data'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_student_profile(request, user_id):
    try:
        student = db.students.find_one({'_id': ObjectId(user_id)})
        if not student:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        student_data = db.students.find_one({'email': student['email']})
        
        combined_data = {**student, **(student_data if student_data else {})}
        
        combined_data['_id'] = str(combined_data['_id'])
        
        return Response(combined_data)
    except Exception as e:
        logger.error(f"Error fetching student profile: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to fetch student profile'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_registered_counts(request):
    try:
        student_count = db.students.count_documents({})
        staff_count = users_collection.count_documents({}) + admins_collection.count_documents({})
        return Response({
            'student_count': student_count,
            'staff_count': staff_count
        })
    except Exception as e:
        logger.error(f"Error fetching registered counts: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to fetch registered counts'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
def get_registered_members(request):
    try:
        user_type = request.query_params.get("user_type", None)

        if user_type == "student":
            students = list(db.students.find({}, {}))
            for student in students:
                student["_id"] = str(student["_id"])
            
            return Response({"members": students, "user_type": "student"})
        elif user_type == "staff":
            staffs = list(db.staff.find({}, {}))
            for staff in staffs:
                staff["_id"] = str(staff["_id"])
            return Response({"members": staffs, "user_type": "staff"})
        else:
            return Response(
                {"error": "Invalid user type"}, status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        logger.error(f"Error fetching registered members: {str(e)}", exc_info=True)
        return Response(
            {"error": "Failed to fetch registered members"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
def assign_staff_to_department(request):
    try:
        staff_id = request.data.get("staff_id")
        department = request.data.get("department")

        if not all([staff_id, department]):
            return Response(
                {"error": "Staff ID and department are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        
        existing_staff = db.staff.find_one({"department": department})
        if existing_staff:
            return Response(
                {
                    "error": f"A staff member is already assigned to the {department} department"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        staff = db.staff.find_one({"_id": ObjectId(staff_id)})
        if not staff:
            return Response(
                {"error": "Staff not found"}, status=status.HTTP_404_NOT_FOUND
            )

        result = db.staff.update_one(
            {"_id": ObjectId(staff_id)}, {"$set": {"department": department}}
        )

        if result.modified_count == 1:
            return Response({"message": "Staff assigned to department successfully"})
        else:
            return Response(
                {"error": "Failed to assign staff to department"},
                status=status.HTTP_400_BAD_REQUEST,
            )
    except Exception as e:
        logger.error(f"Error assigning staff to department: {str(e)}", exc_info=True)
        return Response(
            {"error": "Failed to assign staff to department"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
def remove_staff_from_department(request):
    try:
        staff_id = request.data.get("staff_id")

        if not staff_id:
            return Response(
                {"error": "Staff ID is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        staff = db.staff.find_one({"_id": ObjectId(staff_id)})
        if not staff:
            return Response(
                {"error": "Staff not found"}, status=status.HTTP_404_NOT_FOUND
            )

        result = db.staff.update_one(
            {"_id": ObjectId(staff_id)}, {"$unset": {"department": ""}}
        )

        if result.modified_count == 1:
            return Response({"message": "Staff removed from department successfully"})
        else:
            return Response(
                {"error": "Failed to remove staff from department"},
                status=status.HTTP_400_BAD_REQUEST,
            )
    except Exception as e:
        logger.error(f"Error removing staff from department: {str(e)}", exc_info=True)
        return Response(
            {"error": "Failed to remove staff from department"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def check_unassigned_grades(request):
    try:
        departments = ["IT", "AD", "CSE", "IOT"]
        unassigned_departments = []

        for department in departments:
            staff = db.staff.find_one({"department": department})
            if not staff:
                unassigned_departments.append(department)

        if unassigned_departments:
            return Response(
                {
                    "error": f'Unassigned departments: {", ".join(unassigned_departments)}'
                },
                
                status=status.HTTP_200_OK,
            )
        else:
            return Response({"message": "All departments are assigned"})
    except Exception as e:
        logger.error(f"Error checking unassigned grades: {str(e)}", exc_info=True)
        return Response(
            {"error": "Failed to check unassigned grades"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
def reset_password(request):
    try:
        email = request.data.get("email")
        new_password = request.data.get("new_password")
        if not all([email, new_password]):
            return Response(
                {"error": "Email and new password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = db.staff.find_one({"email": email})
        student = db.students.find_one({"email": email})

        if user:
            db.staff.update_one(
                {"email": email}, {"$set": {"password": make_password(new_password)}}
            )
            return Response({"message": "Password reset successfully"})
        elif student:
            db.students.update_one(
                {"email": email}, {"$set": {"password": make_password(new_password)}}
            )
            return Response({"message": "Password reset successfully"})
        else:
            return Response(
                {"error": "Email not registered"}, status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        logger.error(f"Error in reset_password: {str(e)}", exc_info=True)
        return Response(
            {"error": "Failed to reset password"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
def add_student_by_staff(request):
    if request.method == "POST":
        try:
            name = request.data.get("name")
            email = request.data.get("email")
            logger.info(f"Received data - name: {name}, email: {email}")

            if not all([name, email]):
                return Response(
                    {"error": "Name and email are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not email.endswith("@snsce.ac.in"):
                return Response(
                    {"error": "Please use a valid SNSCE email address for students"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            existing_student = db.students.find_one({"email": email})
            if existing_student:
                return Response(
                    {"error": "Student with this email already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            student_data = {
                "name": name,
                "email": email,
            }

            logger.info(f"Attempting to insert student data: {student_data}")
            result = db.students.insert_one(student_data)
            logger.info(f"Insert result: {result}")

            if result.inserted_id:
                logger.info(f"Student added by staff: {email}")
                return Response(
                    {
                        "message": "Student added successfully",
                        "id": str(result.inserted_id),
                    },
                    status=status.HTTP_201_CREATED,
                )
            else:
                logger.error(f"Failed to add student: {email}")
                return Response(
                    {"error": "Failed to add student"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        except Exception as e:
            logger.error(f"Error in add_student_by_staff: {str(e)}", exc_info=True)
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@api_view(["POST"])
def check_student_email(request):
    try:
        email = request.data.get("email")
        if not email:
            return Response(
                {"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        if not email.endswith("@snsce.ac.in"):
            return Response(
                {"error": "Please use a valid SNSCE email address"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        student = db.students.find_one({"email": email})
        if student:
            return Response({"message": "Email found"}, status=status.HTTP_200_OK)
        else:
            return Response(
                {"error": "Email not found"}, status=status.HTTP_404_NOT_FOUND
            )
    except Exception as e:
        logger.error(f"Error in check_student_email: {str(e)}", exc_info=True)
        return Response(
            {"error": "Internal server error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_department_students(request):
    department_name = request.query_params.get("department")

    if not department_name:
        return Response(
            {"error": "Department is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        students = list(db.students.find({"department": department_name}))
        for student in students:
            student["_id"] = str(student["_id"])
            
        return Response({"students": students}, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error fetching department students: {str(e)}", exc_info=True)
        return Response(
            {"error": "Failed to fetch department students"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_all_students(request):
    try:
        students = list(db.students.find())
        for student in students:
            student["_id"] = str(student["_id"])

        return Response({"students": students}, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error fetching all students: {str(e)}", exc_info=True)
        return Response(
            {"error": "Failed to fetch all students"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
def mark_attendance(request):
    attendance_records = request.data.get(
        "attendanceRecords"
    )  
    admin_user_info = (
        request.user
    ) 

    if not attendance_records:
        return Response(
            {"error": "Attendance records are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        attendance_collection = db.attendance 

        for record in attendance_records:
            student_id = record.get("studentId")
            status_ = record.get(
                "status"
            )  
            date_str = record.get("date")

            if not all([student_id, status_, date_str]):
                logger.warning(f"Incomplete attendance record: {record}")
                continue  

            try:
                
                attendance_date = datetime.strptime(
                    date_str, "%Y-%m-%d"
                ).date()  
                
                attendance_datetime = datetime.combine(
                    attendance_date, datetime.min.time()
                )
            except ValueError:
                logger.error(
                    f"Invalid date format: {date_str} for student ID: {student_id}"
                )
                continue  

            
            existing_record = attendance_collection.find_one(
                {"student_id": student_id, "date": attendance_datetime}
            )

            if existing_record:
                logger.warning(
                    f"Attendance record already exists for student ID: {student_id} on date: {attendance_datetime}"
                )
                continue  

            
            admin_id = (
                admin_user_info.id if admin_user_info else "unknown_admin_id"
            )  

            attendance_document = {
                "student_id": student_id,
                "date": attendance_datetime,  
                "status": status_,
                "marked_by_admin_id": admin_id, 
                "timestamp": datetime.now(),  
            }
            attendance_collection.insert_one(
                attendance_document
            ) 
        return Response(
            {"message": "Attendance marked successfully"}, status=status.HTTP_200_OK
        )

    except Exception as e:
        logger.error(f"Error marking attendance: {str(e)}", exc_info=True)
        return Response(
            {"error": "Failed to mark attendance"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def get_attendance_report(request):
     date_str = request.query_params.get("date")
     if not date_str:
         return Response({"error": "Date is required"}, status=status.HTTP_400_BAD_REQUEST)

     try:
         # Convert the date string to a datetime object at the start of the day
         date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
         start_of_day = datetime.combine(date_obj, datetime.min.time())

         end_of_day = datetime.combine(date_obj, datetime.max.time())


         # Use the datetime object for querying
         attendance_records = list(db.attendance.find(
            {"date": {"$gte": start_of_day, "$lte": end_of_day }}
         ))


         # Count attendance status
         present_count = sum(1 for record in attendance_records if record['status'] == 'Present')
         absent_count = sum(1 for record in attendance_records if record['status'] == 'Absent')
         late_count = sum(1 for record in attendance_records if record['status'] == 'Late')

         attendance_summary = [
             {"status": "Present", "count": present_count},
             {"status": "Absent", "count": absent_count},
             {"status": "Late", "count": late_count},
         ]

         return Response(attendance_summary, status=status.HTTP_200_OK)

     except Exception as e:
         logger.error(f"Error fetching attendance report: {str(e)}", exc_info=True)
         return Response({"error": "Failed to fetch attendance report"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
     
@api_view(["GET"])
def get_attendance_dates(request):
    try:
        attendance_dates = db.attendance.distinct("date")
        attendance_dates = [date.strftime("%Y-%m-%d") for date in attendance_dates]
        return Response({"dates": attendance_dates}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error fetching attendance dates: {str(e)}", exc_info=True)
        return Response({"error": "Failed to fetch attendance dates"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)