package services

import (
	"chatgpt-clone/backend/config"

	"go.mongodb.org/mongo-driver/mongo"
)

// Package-level variables to hold collection instances.
// They are declared but not initialized here.
var (
	userCollection    *mongo.Collection
	chatCollection    *mongo.Collection
	messageCollection *mongo.Collection
)

// Init initializes all the service-level variables, like database collections.
// This function should be called from main.go after the database is connected.
func Init() {
	userCollection = config.GetCollection("users")
	chatCollection = config.GetCollection("chats")
	messageCollection = config.GetCollection("messages")

	// Initialize the Gemini client as well
	InitGemini()
}
