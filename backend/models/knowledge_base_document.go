package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type KnowledgeBaseDocument struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	CompanyID     primitive.ObjectID `bson:"company_id" json:"company_id"`
	UploadedBy    primitive.ObjectID `bson:"uploaded_by" json:"uploaded_by"`
	Filename      string             `bson:"filename" json:"filename"`
	MimeType      string             `bson:"mime_type" json:"mime_type"`
	Action        string             `bson:"action" json:"action"`
	ExtractedText string             `bson:"extracted_text" json:"extracted_text"`
	Status        string             `bson:"status" json:"status"` // synced | pending_sync | failed
	UpstreamError string             `bson:"upstream_error,omitempty" json:"upstream_error,omitempty"`
	DocumentID    string             `bson:"document_id,omitempty" json:"document_id,omitempty"`
	ChunksCreated int                `bson:"chunks_created,omitempty" json:"chunks_created,omitempty"`
	CreatedAt     primitive.DateTime `bson:"created_at" json:"created_at"`
	UpdatedAt     primitive.DateTime `bson:"updated_at" json:"updated_at"`
}
