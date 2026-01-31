package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// MongoDB connection string - UPDATE THIS
	mongoURI := "mongodb+srv://premkumars:p2r0e0m5@cluster0.4prn00c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
	dbName := "chatgpt_clone" // Change if different

	// Connect to MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatal("Failed to connect to MongoDB:", err)
	}
	defer client.Disconnect(ctx)

	db := client.Database(dbName)

	// 1. Create Super Admin Company
	fmt.Println("Creating Super Admin Company...")
	companiesCollection := db.Collection("companies")

	company := bson.M{
		"name":                "Platform Admin",
		"domain":              "superadmin",
		"email":               "admin@platform.com",
		"phone":               "+1234567890",
		"address":             "Platform Headquarters",
		"subscription_tier":   "enterprise",
		"subscription_status": "active",
		"max_users":           999999,
		"settings": bson.M{
			"allow_user_registration":    true,
			"require_email_verification": false,
			"session_timeout":            1440,
			"allowed_domains":            []string{},
			"max_chats_per_user":         999999,
			"max_messages_per_chat":      999999,
			"enable_document_upload":     true,
			"max_document_size":          104857600,
		},
		"is_active":  true,
		"created_at": primitive.NewDateTimeFromTime(time.Now()),
		"updated_at": primitive.NewDateTimeFromTime(time.Now()),
	}

	companyResult, err := companiesCollection.InsertOne(ctx, company)
	if err != nil {
		log.Fatal("Failed to create company:", err)
	}
	companyID := companyResult.InsertedID.(primitive.ObjectID)
	fmt.Printf("✓ Company created with ID: %s\n", companyID.Hex())

	// 2. Create Super Admin Role
	fmt.Println("Creating Super Admin Role...")
	rolesCollection := db.Collection("roles")

	permissions := []string{
		"manage:companies",
		"view:all_companies",
		"manage:users",
		"view:users",
		"manage:roles",
		"view:roles",
		"manage:company_settings",
		"view:activity_logs",
		"view:analytics",
		"create:chat",
		"view:own_chats",
		"manage:own_chats",
		"send:messages",
		"upload:documents",
		"view:own_profile",
		"edit:own_profile",
	}

	role := bson.M{
		"company_id":   companyID,
		"name":         "super_admin",
		"display_name": "Super Administrator",
		"description":  "Platform super administrator with all permissions",
		"permissions":  permissions,
		"is_system":    true,
		"created_at":   primitive.NewDateTimeFromTime(time.Now()),
		"updated_at":   primitive.NewDateTimeFromTime(time.Now()),
	}

	roleResult, err := rolesCollection.InsertOne(ctx, role)
	if err != nil {
		log.Fatal("Failed to create role:", err)
	}
	roleID := roleResult.InsertedID.(primitive.ObjectID)
	fmt.Printf("✓ Role created with ID: %s\n", roleID.Hex())

	// 3. Hash password
	fmt.Println("Hashing password...")
	password := "SuperAdmin@123"
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Failed to hash password:", err)
	}
	fmt.Println("✓ Password hashed")

	// 4. Create Super Admin User
	fmt.Println("Creating Super Admin User...")
	usersCollection := db.Collection("users")

	user := bson.M{
		"company_id":     companyID,
		"email":          "superadmin@platform.com",
		"password":       string(hashedPassword),
		"name":           "Super Administrator",
		"username":       "superadmin",
		"role_id":        roleID,
		"role_name":      "super_admin",
		"permissions":    permissions,
		"is_active":      true,
		"is_super_admin": true,
		"email_verified": true,
		"department":     "Platform Administration",
		"position":       "Super Administrator",
		"created_at":     primitive.NewDateTimeFromTime(time.Now()),
		"updated_at":     primitive.NewDateTimeFromTime(time.Now()),
	}

	userResult, err := usersCollection.InsertOne(ctx, user)
	if err != nil {
		log.Fatal("Failed to create user:", err)
	}
	userID := userResult.InsertedID.(primitive.ObjectID)
	fmt.Printf("✓ User created with ID: %s\n", userID.Hex())

	// 5. Verify
	fmt.Println("\n═══════════════════════════════════════")
	fmt.Println("✓ Super Admin Setup Complete!")
	fmt.Println("═══════════════════════════════════════")
	fmt.Println("\nLogin Credentials:")
	fmt.Println("  Company Domain: superadmin")
	fmt.Println("  Email:         superadmin@platform.com")
	fmt.Println("  Password:      SuperAdmin@123")
	fmt.Println("\nDatabase IDs:")
	fmt.Printf("  Company ID: %s\n", companyID.Hex())
	fmt.Printf("  Role ID:    %s\n", roleID.Hex())
	fmt.Printf("  User ID:    %s\n", userID.Hex())
	fmt.Println("═══════════════════════════════════════")
}
