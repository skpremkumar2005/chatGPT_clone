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
	Email         string `json:"email" validate:"required,email"`
	Password      string `json:"password" validate:"required"`
	CompanyDomain string `json:"company_domain" validate:"required"` // Company identifier
}

// MultiTenantLoginUser verifies user credentials for multi-tenant and returns a JWT token
func MultiTenantLoginUser(input LoginUserInput, ipAddress string) (string, *models.User, error) {
	ctx := context.Background()

	// Get company by domain
	company, err := GetCompanyByDomain(input.CompanyDomain)
	if err != nil {
		return "", nil, errors.New("invalid company or credentials")
	}

	if !company.IsActive {
		return "", nil, errors.New("company account is suspended")
	}

	// Find user by email and company
	var user models.User
	err = userCollection.FindOne(ctx, bson.M{
		"email":      input.Email,
		"company_id": company.ID,
	}).Decode(&user)
	if err != nil {
		// Log failed login attempt
		LogActivity(
			company.ID,
			primitive.NilObjectID,
			models.ActionFailedLogin,
			models.ResourceUser,
			"",
			"Failed login attempt for email: "+input.Email,
			false,
			map[string]interface{}{"email": input.Email},
			ipAddress,
			"",
			"POST",
			"/auth/login",
			401,
			"Invalid credentials",
		)
		return "", nil, errors.New("invalid email or password")
	}

	// Check if user is active
	if !user.IsActive {
		return "", nil, errors.New("user account is deactivated")
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password))
	if err != nil {
		// Log failed login attempt
		LogActivity(
			company.ID,
			user.ID,
			models.ActionFailedLogin,
			models.ResourceUser,
			user.ID.Hex(),
			"Failed login attempt - invalid password",
			false,
			map[string]interface{}{"email": input.Email},
			ipAddress,
			"",
			"POST",
			"/auth/login",
			401,
			"Invalid password",
		)
		return "", nil, errors.New("invalid email or password")
	}

	// Update last login
	userCollection.UpdateOne(ctx, bson.M{"_id": user.ID}, bson.M{
		"$set": bson.M{
			"last_login_at": primitive.NewDateTimeFromTime(time.Now()),
			"last_login_ip": ipAddress,
		},
	})

	// Generate JWT with company and role information
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":        user.ID.Hex(),
		"company_id":     user.CompanyID.Hex(),
		"email":          user.Email,
		"role_id":        user.RoleID.Hex(),
		"role_name":      user.RoleName,
		"permissions":    user.Permissions,
		"is_super_admin": user.IsSuperAdmin,
		"exp":            time.Now().Add(time.Hour * 72).Unix(),
	})

	tokenString, err := token.SignedString(JwtSecret)
	if err != nil {
		return "", nil, err
	}

	// Log successful login
	LogActivity(
		company.ID,
		user.ID,
		models.ActionLogin,
		models.ResourceUser,
		user.ID.Hex(),
		"User logged in successfully",
		true,
		map[string]interface{}{"email": input.Email},
		ipAddress,
		"",
		"POST",
		"/auth/login",
		200,
		"",
	)

	return tokenString, &user, nil
}

// Legacy LoginUser for backward compatibility - will be deprecated
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
