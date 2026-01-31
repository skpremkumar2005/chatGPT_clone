package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	CompanyID primitive.ObjectID `bson:"company_id" json:"company_id"` // Tenant isolation
	Email     string             `bson:"email" json:"email"`
	Password  string             `bson:"password" json:"-"`
	Name      string             `bson:"name" json:"name"`
	Username  string             `bson:"username,omitempty" json:"username,omitempty"` // Optional username

	// Role and permissions
	RoleID      primitive.ObjectID `bson:"role_id" json:"role_id"`
	RoleName    string             `bson:"role_name" json:"role_name"`                         // Denormalized for quick access
	Permissions []string           `bson:"permissions,omitempty" json:"permissions,omitempty"` // Cached permissions

	// User status
	IsActive      bool `bson:"is_active" json:"is_active"`
	IsSuperAdmin  bool `bson:"is_super_admin" json:"is_super_admin"` // Platform super admin
	EmailVerified bool `bson:"email_verified" json:"email_verified"`

	// Profile information
	Phone      string `bson:"phone,omitempty" json:"phone,omitempty"`
	Avatar     string `bson:"avatar,omitempty" json:"avatar,omitempty"`
	Department string `bson:"department,omitempty" json:"department,omitempty"`
	Position   string `bson:"position,omitempty" json:"position,omitempty"`

	// Session tracking
	LastLoginAt primitive.DateTime `bson:"last_login_at,omitempty" json:"last_login_at,omitempty"`
	LastLoginIP string             `bson:"last_login_ip,omitempty" json:"last_login_ip,omitempty"`

	CreatedAt primitive.DateTime `bson:"created_at" json:"created_at"`
	UpdatedAt primitive.DateTime `bson:"updated_at" json:"updated_at"`
	CreatedBy primitive.ObjectID `bson:"created_by,omitempty" json:"created_by,omitempty"` // Who created this user
}
