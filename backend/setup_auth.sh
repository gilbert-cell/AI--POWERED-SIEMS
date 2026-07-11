#!/bin/bash
# SIEM Authentication Setup
# Initializes database and displays default credentials

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         SIEM Dashboard - Authentication Setup              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BACKEND_DIR"

# Activate virtual environment if it exists
if [ -f "../venv/bin/activate" ]; then
    echo "Activating Python virtual environment..."
    source ../venv/bin/activate
fi

echo ""
echo "→ Running database migrations..."
python3 manage.py migrate --noinput
echo "✓ Database migrations complete"

echo ""
echo "→ Creating default admin user..."
python3 << EOF
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'siem_project.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import UserProfile

# Get credentials from environment or use defaults
admin_email = os.getenv('DEFAULT_ADMIN_EMAIL', 'admin@siem.local')
admin_password = os.getenv('DEFAULT_ADMIN_PASSWORD', 'SIEMAdmin@2024!')
admin_name = os.getenv('DEFAULT_ADMIN_NAME', 'SIEM Admin')

# Check if admin already exists
user = User.objects.filter(email__iexact=admin_email).first()

if user:
    print(f"ℹ  Admin user '{admin_email}' already exists")
else:
    # Create the admin user
    first_name, _, last_name = admin_name.partition(' ')
    user = User.objects.create_user(
        username=admin_email,
        email=admin_email,
        password=admin_password,
        first_name=first_name,
        last_name=last_name,
        is_staff=True,
        is_superuser=True,
    )
    
    # Create user profile
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'role': 'system-administrator',
            'department': 'Security Operations (SOC)',
            'status': 'active',
        },
    )
    
    print(f"✓ Admin user '{admin_email}' created successfully")

# Display credentials
print("")
print("╔════════════════════════════════════════════════════════════╗")
print("║                DEFAULT LOGIN CREDENTIALS                   ║")
print("╚════════════════════════════════════════════════════════════╝")
print("")
print(f"  Email:    {admin_email}")
print(f"  Password: {admin_password}")
print("")
print("⚠  IMPORTANT: Change this password after first login!")
print("   Go to Dashboard → Settings → User Settings")
print("")
EOF

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    SETUP COMPLETE ✓                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Start Django server: python3 manage.py runserver"
echo "  2. Go to http://localhost:8000 and login with above credentials"
echo "  3. Change your password immediately"
echo ""
echo "To run in production:"
echo "  • Set environment variables:"
echo "    - DEFAULT_ADMIN_EMAIL=your-email@domain.com"
echo "    - DEFAULT_ADMIN_PASSWORD=your-secure-password"
echo "  • Use gunicorn or similar WSGI server"
echo ""
