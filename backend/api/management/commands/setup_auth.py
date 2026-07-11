"""
Management command to set up default authentication user.
Creates or updates the default admin account.
"""
import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import UserProfile
from api.auth_constants import AUTH_DEFAULT_ROLE


class Command(BaseCommand):
    help = 'Initialize default admin user for SIEM authentication'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default=os.getenv('DEFAULT_ADMIN_EMAIL', 'admin@siem.local'),
            help='Admin email address',
        )
        parser.add_argument(
            '--password',
            type=str,
            default=os.getenv('DEFAULT_ADMIN_PASSWORD', 'SIEMAdmin@2024!'),
            help='Admin password',
        )
        parser.add_argument(
            '--name',
            type=str,
            default=os.getenv('DEFAULT_ADMIN_NAME', 'SIEM Admin'),
            help='Admin display name',
        )
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset password if user already exists',
        )

    def handle(self, *args, **options):
        email = options['email'].lower().strip()
        password = options['password']
        name = options['name']
        reset = options['reset']

        if not email or not password:
            self.stdout.write(
                self.style.ERROR('❌ Email and password are required!')
            )
            return

        # Check if user exists
        user = User.objects.filter(email__iexact=email).first()

        if user:
            if reset:
                # Update password
                user.set_password(password)
                user.save(update_fields=['password'])
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Password reset for {email}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'ℹ  User {email} already exists (use --reset to change password)')
                )
        else:
            # Create new user
            first_name, _, last_name = name.partition(' ')
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_staff=True,
                is_superuser=True,
            )
            self.stdout.write(
                self.style.SUCCESS(f'✓ Admin user created: {email}')
            )

        # Ensure profile exists
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'role': AUTH_DEFAULT_ROLE,
                'department': 'Security Operations (SOC)',
                'status': 'active',
            },
        )

        # Display credentials
        self.stdout.write(
            self.style.SUCCESS('\n' + '=' * 60)
        )
        self.stdout.write(
            self.style.SUCCESS('DEFAULT LOGIN CREDENTIALS')
        )
        self.stdout.write(
            self.style.SUCCESS('=' * 60)
        )
        self.stdout.write('')
        self.stdout.write(f'  Email:    {email}')
        self.stdout.write(f'  Password: {password}')
        self.stdout.write('')
        self.stdout.write(
            self.style.WARNING('⚠  IMPORTANT: Change this password after first login!')
        )
        self.stdout.write('   Go to Dashboard → Settings → Security')
        self.stdout.write(
            self.style.SUCCESS('=' * 60 + '\n')
        )
