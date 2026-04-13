from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.forms import AuthenticationForm
from jobs.models import Job
from .models import User
# from .forms import CustomUserCreationForm # Handling manual POST data for custom layout

def login_user(request):
    if request.method == 'POST':
        post_data = request.POST.copy()
        identifier = post_data.get('username', '').strip().lower()

        # Try to resolve email to the actual username for authentication
        # This allows users to type their Email in the app even if Admin uses Username
        try:
            user_obj = User.objects.get(email=identifier)
            post_data['username'] = user_obj.username
        except User.DoesNotExist:
            post_data['username'] = identifier

        form = AuthenticationForm(request, data=post_data) 
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            
            # Role-based redirection
            if user.role == 'student':
                return redirect('dashboard-user')
            elif user.role == 'company':
                return redirect('dashboard-company')
            elif user.role == 'admin':
                return redirect('dashboard-admin')
            return redirect('home')
        else:
            return render(request, 'auth.html', {'form': form, 'error': 'Invalid email or password.'})
    else:
        form = AuthenticationForm()
    return render(request, 'auth.html', {'form': form})

def logout_user(request):
    logout(request)
    return redirect('home')

def register_user(request):
    if request.method == 'POST':
        full_name = request.POST.get('name', '').strip()
        email = request.POST.get('email', '').strip().lower()
        password = request.POST.get('password')
        role = request.POST.get('role', 'student')
        location = request.POST.get('location', '').strip()

        # Map frontend "user" tab to backend "student" role
        if role == 'user':
            role = 'student'

        if User.objects.filter(email=email).exists():
            return render(request, 'signup.html', {'error': 'Email already registered.'})

        # Create user using name as username (slugified) for Admin login
        # This allows using Email in the app but a clean Username in Django Admin
        username = full_name.replace(' ', '_').lower() if full_name else email.split('@')[0]
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=role,
            location=location
        )

        # Optional: Split name into First/Last name fields
        if full_name:
            name_parts = full_name.split(' ', 1)
            user.first_name = name_parts[0]
            if len(name_parts) > 1:
                user.last_name = name_parts[1]
            user.save()

        login(request, user)
        
        if user.role == 'student': return redirect('dashboard-user')
        if user.role == 'company': return redirect('dashboard-company')
        return redirect('home')

    return render(request, 'signup.html')

def is_admin(user):
    return user.is_authenticated and user.role == 'admin'

@login_required
@user_passes_test(is_admin, login_url='auth')
def admin_dashboard(request):
    context = {
        'user_count': User.objects.count(),
        'job_count': Job.objects.count(),
    }
    return render(request, 'dashboard-admin.html', context)
