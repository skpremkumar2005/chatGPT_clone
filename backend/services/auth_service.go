package services

import (
	"chatgpt-clone/backend/models"
	"context"
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

// This variable will be initialized by the services.Init() function in init.go
// No changes needed here.

// --- THIS IS THE FIX ---
// Read the secret from the environment here and export it.
// Note the capitalized 'J' to make it exportable.
var JwtSecret = []byte(os.Getenv("JWT_SECRET"))
// --- END OF FIX ---


// RegisterUserInput defines the input structure for user registration.
type RegisterUserInput struct {
	Name     string `json:"name" validate:"required,min=2"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

// LoginUserInput defines the input structure for user login.
type LoginUserInput struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// RegisterNewUser creates a new user, hashes their password, and saves them to the database.
func RegisterNewUser(input RegisterUserInput) (*models.User, error) {
	// Check if user already exists
	count, err := userCollection.CountDocuments(context.Background(), bson.M{"email": input.Email})
	if err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, errors.New("user with this email already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	newUser := models.User{
		ID:        primitive.NewObjectID(),
		Name:      input.Name,
		Email:     input.Email,
		Password:  string(hashedPassword),
		CreatedAt: primitive.NewDateTimeFromTime(time.Now()),
		UpdatedAt: primitive.NewDateTimeFromTime(time.Now()),
	}

	_, err = userCollection.InsertOne(context.Background(), newUser)
	if err != nil {
		return nil, err
	}

	return &newUser, nil
}

// LoginUser verifies user credentials and returns a JWT token if successful.
func LoginUser(input LoginUserInput) (string, error) {
	var user models.User
	err := userCollection.FindOne(context.Background(), bson.M{"email": input.Email}).Decode(&user)
	if err != nil {
		return "", errors.New("invalid email or password")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password))
	if err != nil {
		return "", errors.New("invalid email or password")
	}

	// Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID.Hex(),
		"email":   user.Email,
		"exp":     time.Now().Add(time.Hour * 72).Unix(),
	})

    // Use the exported variable to sign the token
	tokenString, err := token.SignedString(JwtSecret)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// GetUserByID retrieves a user by their ObjectID.
func GetUserByID(userID primitive.ObjectID) (*models.User, error) {
	var user models.User
	err := userCollection.FindOne(context.Background(), bson.M{"_id": userID}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}