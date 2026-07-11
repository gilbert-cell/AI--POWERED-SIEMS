# SIEM Dashboard - Authentication & Login Guide

## Quick Start

### Default Credentials
The SIEM dashboard uses the following default credentials on first run:

```
Email:    admin@siem.local
Password: SIEMAdmin@2024!
```

⚠️ **IMPORTANT**: Change this password after first login!

---

## Setup Methods

### Method 1: Automatic Setup (Recommended)
Run the setup script to initialize the database and admin user:

```bash
cd backend
bash setup_auth.sh
```

This will:
- Run Django migrations
- Create default admin user
- Display login credentials
- Show next steps

### Method 2: Manual Django Command
```bash
cd backend
source ../venv/bin/activate
python3 manage.py setup_auth
```

### Method 3: Custom Credentials
Set environment variables before starting the server:

```bash
export DEFAULT_ADMIN_EMAIL="your-email@domain.com"
export DEFAULT_ADMIN_PASSWORD="your-secure-password"
export DEFAULT_ADMIN_NAME="Your Name"

python3 manage.py setup_auth
```

Or with custom values:
```bash
python3 manage.py setup_auth \
  --email admin@mycompany.com \
  --password MySecurePassword123! \
  --name "John Doe"
```

### Method 4: Reset Existing Password
If you forgot the password, reset it:

```bash
python3 manage.py setup_auth \
  --email admin@siem.local \
  --password NewPassword123! \
  --reset
```

---

## Starting the Server

### Development
```bash
cd backend
source ../venv/bin/activate
python3 manage.py runserver
```

Then open: http://localhost:8000

### Production
Use a production WSGI server:

```bash
gunicorn siem_project.wsgi:application --bind 0.0.0.0:8000
```

---

## Troubleshooting

### "Invalid email or password" Error
**Cause**: Admin user hasn't been created yet or password is empty

**Fix**: Run the setup command
```bash
python3 manage.py setup_auth
```

### Database Errors
**Cause**: Database migrations haven't been run

**Fix**: Run migrations
```bash
python3 manage.py migrate
```

### User Already Exists
**Cause**: Admin user already created but password is unknown

**Fix**: Reset the password
```bash
python3 manage.py setup_auth --reset
```

---

## Changing Your Password

### In the Dashboard UI
1. Log in to dashboard
2. Click **Settings** (bottom left)
3. Go to **Security** tab
4. Click **Change Password**
5. Enter current password and new password
6. Click **Save**

### Via Django Command
```bash
python3 manage.py changepassword admin@siem.local
```

---

## User Roles

The system supports three roles:

| Role | Permission | Typical User |
|------|-----------|-------------|
| **System Administrator** | Full access, user management, settings | IT/Security Manager |
| **Security Analyst** | Full log access, threat analysis | SOC Analyst |
| **Security Auditor** | Read-only log access, reporting | Compliance Officer |

---

## Creating Additional Users

### Via Dashboard
1. Log in as admin
2. Go to **Settings** → **User Management**
3. Click **Add User**
4. Fill in email, password, role
5. Click **Create**

### Via Django Management
```bash
python3 manage.py createsuperuser
```

---

## Environment Variables

Configure authentication via environment variables:

```bash
# Admin user
DEFAULT_ADMIN_EMAIL=admin@siem.local
DEFAULT_ADMIN_PASSWORD=SIEMAdmin@2024!
DEFAULT_ADMIN_NAME=SIEM Admin

# Additional users (optional)
DEFAULT_SECURITY_ADMINISTRATOR_EMAIL=analyst@siem.local
DEFAULT_SECURITY_ADMINISTRATOR_PASSWORD=AnalystPass123!
DEFAULT_AUDITOR_EMAIL=auditor@siem.local
DEFAULT_AUDITOR_PASSWORD=AuditorPass123!
```

Set these before starting the server or in a `.env` file.

---

## Security Best Practices

1. **Change default password immediately** after first login
2. **Use strong passwords**: Mix uppercase, lowercase, numbers, symbols
3. **Store credentials securely**: Use a password manager
4. **Rotate passwords regularly**: At least every 90 days
5. **Disable inactive accounts**: Via user management
6. **Enable MFA** if available: Go to Security settings

---

## Support

For issues or questions:
1. Check logs: `backend/siem_project/logs/`
2. Run migrations: `python3 manage.py migrate`
3. Check database: `python3 manage.py dbshell`
4. Clear cache: `python3 manage.py clear_cache` (if available)

---

## Next Steps After Login

1. ✓ Login with default credentials
2. ✓ Change your password in Settings
3. ✓ Configure system settings (log retention, alerts, etc.)
4. ✓ Set up additional users if needed
5. ✓ Configure data sources (logs, feeds, integrations)
6. ✓ Create detection rules
7. ✓ Start monitoring

---

*Last Updated: 2026-06-23*
