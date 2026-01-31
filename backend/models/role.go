package models

import "go.mongodb.org/mongo-driver/bson/primitive"

// Role defines user roles within a company
type Role struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	CompanyID   primitive.ObjectID `bson:"company_id" json:"company_id"`
	Name        string             `bson:"name" json:"name"` // "super_admin", "company_admin", "manager", "employee"
	DisplayName string             `bson:"display_name" json:"display_name"`
	Description string             `bson:"description,omitempty" json:"description,omitempty"`
	Permissions []string           `bson:"permissions" json:"permissions"`
	IsSystem    bool               `bson:"is_system" json:"is_system"` // System roles cannot be deleted
	CreatedAt   primitive.DateTime `bson:"created_at" json:"created_at"`
	UpdatedAt   primitive.DateTime `bson:"updated_at" json:"updated_at"`
}

// Permission constants
const (
	// Super Admin permissions (platform level)
	PermissionManageCompanies  = "manage:companies"
	PermissionViewAllCompanies = "view:all_companies"

	// Company Admin permissions
	PermissionManageUsers           = "manage:users"
	PermissionViewUsers             = "view:users"
	PermissionManageRoles           = "manage:roles"
	PermissionViewRoles             = "view:roles"
	PermissionManageCompanySettings = "manage:company_settings"
	PermissionViewActivityLogs      = "view:activity_logs"
	PermissionViewAnalytics         = "view:analytics"

	// Manager permissions
	PermissionViewTeamUsers    = "view:team_users"
	PermissionViewTeamActivity = "view:team_activity"
	PermissionManageTeamChats  = "manage:team_chats"

	// Employee permissions (all users)
	PermissionCreateChat      = "create:chat"
	PermissionViewOwnChats    = "view:own_chats"
	PermissionManageOwnChats  = "manage:own_chats"
	PermissionSendMessages    = "send:messages"
	PermissionUploadDocuments = "upload:documents"
	PermissionViewOwnProfile  = "view:own_profile"
	PermissionEditOwnProfile  = "edit:own_profile"
)

// Default role names
const (
	RoleSuperAdmin   = "super_admin"
	RoleCompanyAdmin = "company_admin"
	RoleManager      = "manager"
	RoleEmployee     = "employee"
)

// GetDefaultPermissions returns default permissions for each role
func GetDefaultPermissions(roleName string) []string {
	switch roleName {
	case RoleSuperAdmin:
		return []string{
			PermissionManageCompanies,
			PermissionViewAllCompanies,
			PermissionManageUsers,
			PermissionViewUsers,
			PermissionManageRoles,
			PermissionViewRoles,
			PermissionManageCompanySettings,
			PermissionViewActivityLogs,
			PermissionViewAnalytics,
			PermissionCreateChat,
			PermissionViewOwnChats,
			PermissionManageOwnChats,
			PermissionSendMessages,
			PermissionUploadDocuments,
			PermissionViewOwnProfile,
			PermissionEditOwnProfile,
		}
	case RoleCompanyAdmin:
		return []string{
			PermissionManageUsers,
			PermissionViewUsers,
			PermissionManageRoles,
			PermissionViewRoles,
			PermissionManageCompanySettings,
			PermissionViewActivityLogs,
			PermissionViewAnalytics,
			PermissionCreateChat,
			PermissionViewOwnChats,
			PermissionManageOwnChats,
			PermissionSendMessages,
			PermissionUploadDocuments,
			PermissionViewOwnProfile,
			PermissionEditOwnProfile,
		}
	case RoleManager:
		return []string{
			PermissionViewTeamUsers,
			PermissionViewTeamActivity,
			PermissionManageTeamChats,
			PermissionCreateChat,
			PermissionViewOwnChats,
			PermissionManageOwnChats,
			PermissionSendMessages,
			PermissionUploadDocuments,
			PermissionViewOwnProfile,
			PermissionEditOwnProfile,
		}
	case RoleEmployee:
		return []string{
			PermissionCreateChat,
			PermissionViewOwnChats,
			PermissionManageOwnChats,
			PermissionSendMessages,
			PermissionUploadDocuments,
			PermissionViewOwnProfile,
			PermissionEditOwnProfile,
		}
	default:
		return []string{}
	}
}
