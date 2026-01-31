# Super Admin Setup Script

This script automatically creates a super admin user in your MongoDB database.

## Prerequisites

- MongoDB running (local or Atlas)
- Go installed
- Database connection configured

## Usage

### Option 1: Run the Script (Recommended)

```bash
# 1. Navigate to backend directory
cd /home/premkumar/Desktop/chatGPT_clone/backend

# 2. Update MongoDB URI in create_superadmin.go (line 18-19)
# Edit: mongoURI and dbName if needed

# 3. Run the script
go run scripts/create_superadmin.go
```

### Option 2: Build and Run

```bash
# Build
go build -o scripts/superadmin scripts/create_superadmin.go

# Run
./scripts/superadmin
```

## What It Creates

### 1. Company

- **Name:** Platform Admin
- **Domain:** superadmin
- **Email:** admin@platform.com
- **Tier:** Enterprise (unlimited users)

### 2. Role

- **Name:** super_admin
- **All 16 permissions enabled**
- **System role** (cannot be deleted)

### 3. User

- **Email:** superadmin@platform.com
- **Password:** SuperAdmin@123
- **Name:** Super Administrator
- **is_super_admin:** true
- **All permissions granted**

## Login Credentials

After running the script, login with:

```
Company Domain: superadmin
Email:          superadmin@platform.com
Password:       SuperAdmin@123
```

## Configuration

Edit `create_superadmin.go` to customize:

```go
// Line 18-19: MongoDB connection
mongoURI := "mongodb://localhost:27017"  // Change to your MongoDB URI
dbName := "chatgpt_clone"                // Change database name

// Line 117: Password
password := "SuperAdmin@123"             // Change default password

// Line 37-60: Company details
company := bson.M{
    "name":   "Platform Admin",          // Change company name
    "domain": "superadmin",              // Change domain
    "email":  "admin@platform.com",      // Change email
    // ... other fields
}

// Line 127-149: User details
user := bson.M{
    "email":    "superadmin@platform.com",  // Change user email
    "name":     "Super Administrator",       // Change user name
    // ... other fields
}
```

## Output

Successful execution will display:

```
Creating Super Admin Company...
✓ Company created with ID: 67a1234567890abcdef12345
Creating Super Admin Role...
✓ Role created with ID: 67a1234567890abcdef12346
Hashing password...
✓ Password hashed
Creating Super Admin User...
✓ User created with ID: 67a1234567890abcdef12347

═══════════════════════════════════════
✓ Super Admin Setup Complete!
═══════════════════════════════════════

Login Credentials:
  Company Domain: superadmin
  Email:         superadmin@platform.com
  Password:      SuperAdmin@123

Database IDs:
  Company ID: 67a1234567890abcdef12345
  Role ID:    67a1234567890abcdef12346
  User ID:    67a1234567890abcdef12347
═══════════════════════════════════════
```

## Troubleshooting

### Connection Error

```
Failed to connect to MongoDB: ...
```

**Solution:** Check MongoDB URI and ensure MongoDB is running

### Duplicate Error

```
Failed to create user: E11000 duplicate key error
```

**Solution:** Super admin already exists. Delete existing records or use different email/domain

### Missing Dependencies

```
cannot find package "go.mongodb.org/mongo-driver/mongo"
```

**Solution:** Run `go mod download` in backend directory

## Security Notes

⚠️ **IMPORTANT:** Change the default password immediately after first login!

⚠️ **PRODUCTION:** Use environment variables for sensitive data:

```go
password := os.Getenv("SUPER_ADMIN_PASSWORD")
mongoURI := os.Getenv("MONGODB_URI")
```
