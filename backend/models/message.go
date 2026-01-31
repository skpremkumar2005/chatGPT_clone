package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Message struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	ChatID       primitive.ObjectID `bson:"chat_id" json:"chat_id"`
	Role         string             `bson:"role" json:"role"` // "user" or "assistant"
	Content      string             `bson:"content" json:"content"`
	Timestamp    primitive.DateTime `bson:"timestamp" json:"timestamp"`
	TokenCount   int                `bson:"token_count,omitempty" json:"token_count,omitempty"`
	ModelUsed    string             `bson:"model_used,omitempty" json:"model_used,omitempty"`
	ResponseTime float64            `bson:"response_time,omitempty" json:"response_time,omitempty"` // in seconds
	Attachments  []Attachment       `bson:"attachments,omitempty" json:"attachments,omitempty"`
}

type Attachment struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	Filename      string             `bson:"filename" json:"filename"`
	MimeType      string             `bson:"mime_type" json:"mime_type"`
	Size          int64              `bson:"size" json:"size"`
	URL           string             `bson:"url,omitempty" json:"url,omitempty"`
	UploadedAt    primitive.DateTime `bson:"uploaded_at" json:"uploaded_at"`
	ProcessedData string             `bson:"processed_data,omitempty" json:"processed_data,omitempty"` // Summary or extracted text
}
