package services

import (
	"chatgpt-clone/backend/models"
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// GetKnowledgeBaseDocuments returns all KB documents for a company, sorted newest first.
func GetKnowledgeBaseDocuments(companyID primitive.ObjectID) ([]models.KnowledgeBaseDocument, error) {
	var docs []models.KnowledgeBaseDocument
	filter := bson.M{"company_id": companyID}
	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := knowledgeBaseCollection.Find(context.Background(), filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	if err = cursor.All(context.Background(), &docs); err != nil {
		return nil, err
	}
	if docs == nil {
		return []models.KnowledgeBaseDocument{}, nil
	}
	return docs, nil
}

// GetKnowledgeBaseDocumentByID fetches a single KB document with company ownership check.
func GetKnowledgeBaseDocumentByID(docID, companyID primitive.ObjectID) (*models.KnowledgeBaseDocument, error) {
	var doc models.KnowledgeBaseDocument
	err := knowledgeBaseCollection.FindOne(context.Background(), bson.M{
		"_id":        docID,
		"company_id": companyID,
	}).Decode(&doc)
	if err != nil {
		return nil, err
	}
	return &doc, nil
}

// DeleteKnowledgeBaseDocument removes a KB document (company-scoped).
func DeleteKnowledgeBaseDocument(docID, companyID primitive.ObjectID) error {
	_, err := knowledgeBaseCollection.DeleteOne(context.Background(), bson.M{
		"_id":        docID,
		"company_id": companyID,
	})
	return err
}

func SaveKnowledgeBaseDocument(
	companyID primitive.ObjectID,
	uploadedBy primitive.ObjectID,
	filename string,
	mimeType string,
	action string,
	extractedText string,
	status string,
	upstreamError string,
	documentID string,
	chunksCreated int,
) (*models.KnowledgeBaseDocument, error) {
	now := primitive.NewDateTimeFromTime(time.Now())
	doc := models.KnowledgeBaseDocument{
		ID:            primitive.NewObjectID(),
		CompanyID:     companyID,
		UploadedBy:    uploadedBy,
		Filename:      filename,
		MimeType:      mimeType,
		Action:        action,
		ExtractedText: extractedText,
		Status:        status,
		UpstreamError: upstreamError,
		DocumentID:    documentID,
		ChunksCreated: chunksCreated,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	_, err := knowledgeBaseCollection.InsertOne(context.Background(), doc)
	if err != nil {
		return nil, err
	}

	return &doc, nil
}
