# Multi-Tenant Enterprise Platform - API Documentation

## 🔐 Authentication

### Register Company

**POST** `/api/companies/register`

Creates a new company and its first admin user.

**Request:**

```json
{
  "company_name": "Acme Corporation",
  "domain": "acme-corp",
  "email": "contact@acme.com",
  "phone": "+1234567890",
  "address": "123 Business St",
  "admin_name": "John Doe",
  "admin_email": "admin@acme.com",
  "admin_password": "SecurePass123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Company registered successfully",
  "data": {
    "company": { "id": "...", "name": "Acme Corporation", ... },
    "admin": { "id": "...", "name": "John Doe", ... }
  }
}
```

### Login

**POST** `/api/auth/login`

**Request:**

```json
{
  "email": "admin@acme.com",
  "password": "SecurePass123",
  "company_domain": "acme-corp"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "name": "John Doe", "email": "admin@acme.com" },
    "company": "company_id_hex",
    "role": "company_admin"
  }
}
```

Sets HttpOnly cookie with JWT token.

### Get Current User

**GET** `/api/auth/me`

**Headers:** Cookie with JWT token

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "...",
    "company_id": "...",
    "name": "John Doe",
    "email": "admin@acme.com",
    "role_name": "company_admin",
    "permissions": ["manage:users", "view:users", ...],
    "is_active": true
  }
}
```

### Logout

**POST** `/api/auth/logout`

Clears authentication cookie.

---

## 👥 User Management (Admin Only)

### Create User

**POST** `/api/admin/users`

**Permission:** `manage:users`

**Request:**

```json
{
  "name": "Jane Smith",
  "email": "jane@acme.com",
  "password": "TempPass123",
  "username": "jsmith",
  "role_id": "role_id_hex",
  "phone": "+1234567890",
  "department": "Engineering",
  "position": "Software Engineer",
  "is_active": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "...",
    "name": "Jane Smith",
    "email": "jane@acme.com",
    "role_name": "employee",
    ...
  }
}
```

### List Users

**GET** `/api/admin/users?page=1&limit=20&search=john`

**Permission:** `view:users`

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `search` (optional): Search in name, email, username, department

**Response:**

```json
{
  "success": true,
  "data": {
    "users": [...],
    "total": 45,
    "page": 1,
    "limit": 20,
    "total_pages": 3
  }
}
```

### Update User

**PUT** `/api/admin/users/:user_id`

**Permission:** `manage:users`

**Request:**

```json
{
  "name": "Jane Doe",
  "department": "Product",
  "position": "Senior Engineer",
  "is_active": true,
  "role_id": "new_role_id"
}
```

### Deactivate User

**DELETE** `/api/admin/users/:user_id`

**Permission:** `manage:users`

Soft deletes user by setting `is_active=false`.

### Get User Statistics

**GET** `/api/admin/users/stats`

**Permission:** `view:analytics`

**Response:**

```json
{
  "success": true,
  "data": {
    "total_users": 45,
    "active_users": 42,
    "inactive_users": 3,
    "role_distribution": {
      "company_admin": 2,
      "manager": 8,
      "employee": 35
    }
  }
}
```

---

## 🎭 Role Management

### List Roles

**GET** `/api/admin/roles`

**Permission:** `view:roles`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "company_admin",
      "display_name": "Company Administrator",
      "description": "Full access to company management",
      "permissions": ["manage:users", "view:users", ...],
      "is_system": true
    },
    ...
  ]
}
```

### Update Role Permissions

**PUT** `/api/admin/roles/:role_id/permissions`

**Permission:** `manage:roles`

**Request:**

```json
{
  "permissions": [
    "create:chat",
    "view:own_chats",
    "send:messages",
    "upload:documents"
  ]
}
```

**Note:** System roles (company_admin, manager, employee) cannot have their names changed, but permissions can be updated.

---

## 📊 Activity Logs & Monitoring

### Get Activity Logs

**GET** `/api/admin/activity-logs?page=1&limit=50&user_id=xxx&action=login&resource=user`

**Permission:** `view:activity_logs`

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 50, max: 100)
- `user_id` (optional): Filter by user
- `action` (optional): Filter by action (login, create_user, etc.)
- `resource` (optional): Filter by resource (user, chat, message, etc.)

**Response:**

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "...",
        "user_id": "...",
        "action": "login",
        "resource": "user",
        "description": "User logged in successfully",
        "ip_address": "192.168.1.1",
        "timestamp": "2026-01-31T10:30:00Z",
        "success": true
      },
      ...
    ],
    "total": 1234,
    "page": 1,
    "limit": 50,
    "total_pages": 25
  }
}
```

### Get Analytics

**GET** `/api/admin/analytics?days=30`

**Permission:** `view:analytics`

**Query Parameters:**

- `days` (default: 30): Number of days to analyze

**Response:**

```json
{
  "success": true,
  "data": {
    "total_activities": 5432,
    "daily_activities": [
      { "date": "2026-01-30", "count": 156 },
      { "date": "2026-01-31", "count": 189 }
    ],
    "most_active_users": [
      {
        "user_id": "...",
        "name": "John Doe",
        "email": "john@acme.com",
        "count": 245
      }
    ],
    "user_stats": {
      "total_users": 45,
      "active_users": 42,
      ...
    }
  }
}
```

---

## ⚙️ Company Settings

### Get Company Settings

**GET** `/api/admin/settings`

**Permission:** `manage:company_settings`

**Response:**

```json
{
  "success": true,
  "data": {
    "company": {
      "id": "...",
      "name": "Acme Corporation",
      "domain": "acme-corp",
      "subscription_tier": "premium",
      "max_users": 100
    },
    "settings": {
      "allow_user_registration": false,
      "require_email_verification": true,
      "session_timeout": 60,
      "max_chats_per_user": 100,
      "max_messages_per_chat": 1000,
      "enable_document_upload": true,
      "max_document_size": 10485760
    }
  }
}
```

### Update Company Settings

**PUT** `/api/admin/settings`

**Permission:** `manage:company_settings`

**Request:**

```json
{
  "allow_user_registration": true,
  "session_timeout": 120,
  "max_chats_per_user": 200,
  "enable_document_upload": true,
  "max_document_size": 20971520
}
```

---

## 💬 Chat Endpoints (Existing - Updated for Multi-Tenancy)

All chat endpoints automatically filter by user's company_id from JWT.

### Create Chat

**POST** `/api/chats`

**Permission:** `create:chat`

### Get Chats

**GET** `/api/chats`

**Permission:** `view:own_chats`

Returns only chats belonging to the authenticated user in their company.

### Send Message

**POST** `/api/chats/:chat_id/messages`

**Permission:** `send:messages`

### Upload Document

**POST** `/api/chats/:chat_id/documents`

**Permission:** `upload:documents`

---

## 🔑 Permission Constants

### Platform Admin

- `manage:companies` - Create/manage companies
- `view:all_companies` - View all companies

### Company Admin

- `manage:users` - Create, update, delete users
- `view:users` - View user list
- `manage:roles` - Modify roles and permissions
- `view:roles` - View roles
- `manage:company_settings` - Update company settings
- `view:activity_logs` - View audit logs
- `view:analytics` - View analytics dashboard

### Manager

- `view:team_users` - View team members
- `view:team_activity` - View team activity
- `manage:team_chats` - Manage team chats

### Employee (All Users)

- `create:chat` - Create new chats
- `view:own_chats` - View own chats
- `manage:own_chats` - Manage own chats
- `send:messages` - Send messages
- `upload:documents` - Upload documents
- `view:own_profile` - View profile
- `edit:own_profile` - Edit profile

---

## 🔒 Security Headers

All authenticated requests must include:

- **Cookie**: HttpOnly cookie with JWT token (automatically sent by browser)

JWT token contains:

```json
{
  "user_id": "user_id_hex",
  "company_id": "company_id_hex",
  "role_id": "role_id_hex",
  "role_name": "company_admin",
  "permissions": ["manage:users", ...],
  "is_super_admin": false,
  "exp": 1738334400
}
```

---

## 📝 Activity Log Actions

- `login` - User login
- `logout` - User logout
- `failed_login` - Failed login attempt
- `create_user` - User created
- `update_user` - User updated
- `delete_user` - User deleted
- `deactivate_user` - User deactivated
- `activate_user` - User activated
- `assign_role` - Role assigned to user
- `create_chat` - Chat created
- `delete_chat` - Chat deleted
- `send_message` - Message sent
- `upload_document` - Document uploaded
- `update_settings` - Settings updated

---

## 🚀 Getting Started

1. **Register your company:**

   ```bash
   curl -X POST http://localhost:8080/api/companies/register \
     -H "Content-Type: application/json" \
     -d '{
       "company_name": "Your Company",
       "domain": "your-company",
       "email": "contact@yourcompany.com",
       "admin_name": "Admin Name",
       "admin_email": "admin@yourcompany.com",
       "admin_password": "SecurePassword123"
     }'
   ```

2. **Login:**

   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -c cookies.txt \
     -d '{
       "email": "admin@yourcompany.com",
       "password": "SecurePassword123",
       "company_domain": "your-company"
     }'
   ```

3. **Access admin panel:**
   Use the stored cookie for subsequent requests to `/api/admin/*` endpoints.

---

## ⚠️ Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:

- `200` - Success
- `400` - Bad request (validation error)
- `401` - Unauthorized (not logged in or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `409` - Conflict (duplicate data)
- `500` - Internal server error
