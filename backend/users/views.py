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
        
        if user_type == 'user' and not email.endswith('@snsce.ac.in'):
            return Response(
                {'error': 'Please use a valid SNSCE email address'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = CustomUser.create_user(name, email, mobile_number, password, user_type)
        
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

@api_view(['POST'])
def login_user(request):
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        user_type = request.data.get('user_type', 'user')
        
        if not email or not password:
            return Response(
                {'error': 'Email and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Super admin 
        if email == 'aravindsiva190@gmail.com' and password == 'admin@1234':
            response_data = {
                'id': 'superadmin',
                'email': 'aravindsiva190@gmail.com',
                'user_type': 'Superadmin',
                'is_student': False,
                'name': 'Super Admin',
                'mobile_number': ''
            }
            logger.info("Super admin login successful")
            return Response(response_data)

        if user_type == 'user':
            if not email.endswith('@snsce.ac.in'):
                return Response(
                    {'error': 'Please use a valid SNSCE email address'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            student = db.students.find_one({"email": email})
            if not student:

                student_data = {
                    "email": email,
                    "password": make_password(password)
                }
                db.students.insert_one(student_data)
                student = db.students.find_one({"email": email})
            
            if not check_password(password, student['password']):
                return Response(
                    {'error': 'Invalid student credentials'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            student_data = db.students_data.find_one({"email": email})
            has_student_data = bool(student_data)

            response_data = {
                'id': str(student['_id']),
                'email': student['email'],
                'user_type': 'user',
                'is_student': True,
                'name': student.get('name', ''),  # Add default value if name doesn't exist
                'mobile_number': student.get('mobile_number', ''),
                'has_student_data': has_student_data
            }
            logger.info("Student login successful for: %s", email)
            return Response(response_data)
        
        user = CustomUser.get_user_by_email(email, user_type)
        
        if not user:
            return Response(
                {'error': 'Invalid credentials'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if check_password(password, user['password']):
            response_data = {
                'id': str(user['_id']),
                'name': user['name'],
                'email': user['email'],
                'user_type': user_type,
                'is_student': False,
                'mobile_number': user.get('mobile_number', '')
            }
            logger.info("Staff login successful for user: %s", email)
            return Response(response_data)
        
        logger.warning("Invalid password for user: %s", email)
        return Response(
            {'error': 'Invalid credentials'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error("Login error: %s", str(e), exc_info=True)
        return Response(
            {'error': 'Login failed'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
        
        stored_user = CustomUser.get_user_by_email(email, 'user')
        stored_admin = CustomUser.get_user_by_email(email, 'admin')
        
        if not stored_user and not stored_admin:
            return Response(
                {'error': 'Email not registered'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        otp = CustomUser.generate_otp(email, 'user' if stored_user else 'admin')
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
        
        existing_data = db.students_data.find_one({"email": email})
        if existing_data:
            return Response(
                {'error': 'Student data already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        db.students_data.insert_one(data)
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
        
        student_data = db.students_data.find_one({'email': student['email']})
        
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

@api_view(['GET'])
def get_registered_members(request):
    try:
        user_type = request.query_params.get('user_type', None)
        
        if user_type == 'student':
            students = list(db.students.aggregate([
                {
                    '$lookup': {
                        'from': 'students_data',
                        'localField': 'email',
                        'foreignField': 'email',
                        'as': 'student_data'
                    }
                },
                {
                    '$unwind': {
                        'path': '$student_data',
                        'preserveNullAndEmptyArrays': True
                    }
                },
                {
                    '$addFields': {
                        '_id': {'$toString': '$_id'},
                        'name': { '$ifNull': [ '$student_data.name', ''] },
                        'mobile_number': { '$ifNull': [ '$student_data.mobile_number', ''] },
                        'academic_year': { '$ifNull': [ '$student_data.academic_year', ''] },
                        'department': { '$ifNull': [ '$student_data.department', ''] },
                        'date_of_birth': { '$ifNull': [ '$student_data.date_of_birth', ''] },
                        'gender': { '$ifNull': [ '$student_data.gender', ''] },
                        'address': { '$ifNull': [ '$student_data.address', ''] },
                        'parent_name': { '$ifNull': [ '$student_data.parent_name', ''] },
                        'parent_mobile_number': { '$ifNull': [ '$student_data.parent_mobile_number', ''] },
                        'blood_group': { '$ifNull': [ '$student_data.blood_group', ''] },
                        'email': '$email'
                    }
                },
                {
                    '$project': {
                        'student_data': 0
                    }
                }
            ]))
            return Response({'members': students, 'user_type': 'student'})
        elif user_type == 'staff':
            staffs = list(admins_collection.find({}, {}))
            for staff in staffs:
                staff['_id'] = str(staff['_id'])
            return Response({'members': staffs, 'user_type': 'staff'})
        else:
            return Response({'error': 'Invalid user type'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error fetching registered members: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to fetch registered members'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )