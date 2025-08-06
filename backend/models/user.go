package models
import "go.mongodb.org/mongo-driver/bson/primitive"
type User struct {
ID primitive.ObjectID        `bson:"_id,omitempty" json:"id,omitempty"`
Email string                  `bson:"email" json:"email"`
Password string               `bson:"password" json:"-"`
Name string                   `bson:"name" json:"name"`
CreatedAt primitive.DateTime  `bson:"created_at" json:"created_at"`
UpdatedAt primitive.DateTime  `bson:"updated_at" json:"updated_at"`
}