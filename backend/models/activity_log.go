package models

import "go.mongodb.org/mongo-driver/bson/primitive"

// ActivityLog records all user actions for auditing and monitoring
type ActivityLog struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	CompanyID primitive.ObjectID `bson:"company_id" json:"company_id"`
	UserID    primitive.ObjectID `bson:"user_id" json:"user_id"`

	// Activity details
	Action      string `bson:"action" json:"action"`     // "login", "logout", "create_chat", "send_message", etc.
	Resource    string `bson:"resource" json:"resource"` // "user", "chat", "message", "document", etc.
	ResourceID  string `bson:"resource_id,omitempty" json:"resource_id,omitempty"`
	Description string `bson:"description" json:"description"`

	// Request metadata
	IPAddress  string `bson:"ip_address,omitempty" json:"ip_address,omitempty"`
	UserAgent  string `bson:"user_agent,omitempty" json:"user_agent,omitempty"`
	Method     string `bson:"method,omitempty" json:"method,omitempty"` // HTTP method
	Endpoint   string `bson:"endpoint,omitempty" json:"endpoint,omitempty"`
	StatusCode int    `bson:"status_code,omitempty" json:"status_code,omitempty"`

	// Additional data
	Metadata map[string]interface{} `bson:"metadata,omitempty" json:"metadata,omitempty"`

	// Outcome
	Success  bool   `bson:"success" json:"success"`
	ErrorMsg string `bson:"error_msg,omitempty" json:"error_msg,omitempty"`

	Timestamp primitive.DateTime `bson:"timestamp" json:"timestamp"`
}

// Activity action constants
const (
	ActionLogin            = "login"
	ActionLogout           = "logout"
	ActionFailedLogin      = "failed_login"
	ActionCreateUser       = "create_user"
	ActionUpdateUser       = "update_user"
	ActionDeleteUser       = "delete_user"
	ActionDeactivateUser   = "deactivate_user"
	ActionActivateUser     = "activate_user"
	ActionAssignRole       = "assign_role"
	ActionCreateChat       = "create_chat"
	ActionDeleteChat       = "delete_chat"
	ActionSendMessage      = "send_message"
	ActionUploadDocument   = "upload_document"
	ActionUpdateSettings   = "update_settings"
	ActionViewActivityLogs = "view_activity_logs"
	ActionViewAnalytics    = "view_analytics"
	ActionCreateCompany    = "create_company"
	ActionUpdateCompany    = "update_company"
)

// Resource type constants
const (
	ResourceUser     = "user"
	ResourceCompany  = "company"
	ResourceRole     = "role"
	ResourceChat     = "chat"
	ResourceMessage  = "message"
	ResourceDocument = "document"
	ResourceSettings = "settings"
)
