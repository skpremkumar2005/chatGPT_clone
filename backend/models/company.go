package models

import "go.mongodb.org/mongo-driver/bson/primitive"

// Company represents a tenant organization in the multi-tenant system
type Company struct {
	ID      primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Name    string             `bson:"name" json:"name"`
	Domain  string             `bson:"domain" json:"domain"` // Unique domain identifier (e.g., "acme-corp")
	Email   string             `bson:"email" json:"email"`   // Company contact email
	Phone   string             `bson:"phone,omitempty" json:"phone,omitempty"`
	Address string             `bson:"address,omitempty" json:"address,omitempty"`

	// Subscription details
	SubscriptionTier   string `bson:"subscription_tier" json:"subscription_tier"`     // "free", "basic", "premium", "enterprise"
	SubscriptionStatus string `bson:"subscription_status" json:"subscription_status"` // "active", "suspended", "cancelled"
	MaxUsers           int    `bson:"max_users" json:"max_users"`

	// Settings
	Settings CompanySettings `bson:"settings" json:"settings"`

	// Metadata
	IsActive  bool               `bson:"is_active" json:"is_active"`
	CreatedAt primitive.DateTime `bson:"created_at" json:"created_at"`
	UpdatedAt primitive.DateTime `bson:"updated_at" json:"updated_at"`
	CreatedBy primitive.ObjectID `bson:"created_by,omitempty" json:"created_by,omitempty"`
}

// CompanySettings stores company-specific configuration
type CompanySettings struct {
	AllowUserRegistration    bool     `bson:"allow_user_registration" json:"allow_user_registration"`
	RequireEmailVerification bool     `bson:"require_email_verification" json:"require_email_verification"`
	SessionTimeout           int      `bson:"session_timeout" json:"session_timeout"` // in minutes
	AllowedDomains           []string `bson:"allowed_domains,omitempty" json:"allowed_domains,omitempty"`
	MaxChatsPerUser          int      `bson:"max_chats_per_user" json:"max_chats_per_user"`
	MaxMessagesPerChat       int      `bson:"max_messages_per_chat" json:"max_messages_per_chat"`
	EnableDocumentUpload     bool     `bson:"enable_document_upload" json:"enable_document_upload"`
	MaxDocumentSize          int64    `bson:"max_document_size" json:"max_document_size"` // in bytes
}
