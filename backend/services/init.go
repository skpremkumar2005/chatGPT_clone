package services

import (
	"chatgpt-clone/backend/config"
	"context"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Package-level variables to hold collection instances.
// They are declared but not initialized here.
var (
	userCollection        *mongo.Collection
	chatCollection        *mongo.Collection
	messageCollection     *mongo.Collection
	companyCollection     *mongo.Collection
	roleCollection        *mongo.Collection
	activityLogCollection *mongo.Collection
)

// Init initializes all the service-level variables, like database collections.
// This function should be called from main.go after the database is connected.
func Init() {
	userCollection = config.GetCollection("users")
	chatCollection = config.GetCollection("chats")
	messageCollection = config.GetCollection("messages")
	companyCollection = config.GetCollection("companies")
	roleCollection = config.GetCollection("roles")
	activityLogCollection = config.GetCollection("activity_logs")

	// Create database indexes for performance and constraints
	createIndexes()

	// Initialize the Gemini client as well
	InitGemini()
}

// createIndexes creates necessary database indexes
func createIndexes() {
	ctx := context.Background()

	// Users collection indexes
	userIndexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "email", Value: 1}, {Key: "company_id", Value: 1}},
			Options: options.Index().SetUnique(true), // Email unique per company
		},
		{
			Keys: bson.D{{Key: "company_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "role_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "is_super_admin", Value: 1}},
		},
	}
	_, err := userCollection.Indexes().CreateMany(ctx, userIndexes)
	if err != nil {
		log.Printf("Warning: Failed to create user indexes: %v", err)
	}

	// Companies collection indexes
	companyIndexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "domain", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "email", Value: 1}},
		},
	}
	_, err = companyCollection.Indexes().CreateMany(ctx, companyIndexes)
	if err != nil {
		log.Printf("Warning: Failed to create company indexes: %v", err)
	}

	// Chats collection indexes
	chatIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "company_id", Value: 1}, {Key: "user_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "company_id", Value: 1}},
		},
	}
	_, err = chatCollection.Indexes().CreateMany(ctx, chatIndexes)
	if err != nil {
		log.Printf("Warning: Failed to create chat indexes: %v", err)
	}

	// Roles collection indexes
	roleIndexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "company_id", Value: 1}, {Key: "name", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	}
	_, err = roleCollection.Indexes().CreateMany(ctx, roleIndexes)
	if err != nil {
		log.Printf("Warning: Failed to create role indexes: %v", err)
	}

	// Activity logs collection indexes
	activityLogIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "company_id", Value: 1}, {Key: "timestamp", Value: -1}},
		},
		{
			Keys: bson.D{{Key: "user_id", Value: 1}, {Key: "timestamp", Value: -1}},
		},
		{
			Keys: bson.D{{Key: "action", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "resource", Value: 1}},
		},
	}
	_, err = activityLogCollection.Indexes().CreateMany(ctx, activityLogIndexes)
	if err != nil {
		log.Printf("Warning: Failed to create activity log indexes: %v", err)
	}

	log.Println("Database indexes created successfully")
}
