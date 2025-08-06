package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Chat struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID     primitive.ObjectID `bson:"user_id" json:"user_id"`
	Title      string             `bson:"title" json:"title"`
	CreatedAt  primitive.DateTime `bson:"created_at" json:"created_at"`
	UpdatedAt  primitive.DateTime `bson:"updated_at" json:"updated_at"`
	IsArchived bool               `bson:"is_archived" json:"is_archived"`
}