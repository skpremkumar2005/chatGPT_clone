package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Message struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	ChatID     primitive.ObjectID `bson:"chat_id" json:"chat_id"`
	Role       string             `bson:"role" json:"role"` // "user" or "assistant"
	Content    string             `bson:"content" json:"content"`
	Timestamp  primitive.DateTime `bson:"timestamp" json:"timestamp"`
	TokenCount int                `bson:"token_count,omitempty" json:"token_count,omitempty"`
	ModelUsed  string             `bson:"model_used,omitempty" json:"model_used,omitempty"`
}