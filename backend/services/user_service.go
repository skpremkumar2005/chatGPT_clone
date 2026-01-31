package services

import (
	"chatgpt-clone/backend/models"
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"
)

// CreateUserInput defines input for creating a new user
type CreateUserInput struct {
	CompanyID  string `json:"company_id,omitempty"` // Set by controller from JWT context
	Name       string `json:"name" validate:"required,min=2"`
	Email      string `json:"email" validate:"required,email"`
	Password   string `json:"password" validate:"required,min=6"`
	Username   string `json:"username,omitempty"`
	RoleID     string `json:"role_id" validate:"required"`
	Phone      string `json:"phone,omitempty"`
	Department string `json:"department,omitempty"`
	Position   string `json:"position,omitempty"`
	IsActive   bool   `json:"is_active"`
}

// UpdateUserInput defines input for updating a user
type UpdateUserInput struct {
	Name       string `json:"name,omitempty"`
	Username   string `json:"username,omitempty"`
	Phone      string `json:"phone,omitempty"`
	Department string `json:"department,omitempty"`
	Position   string `json:"position,omitempty"`
	IsActive   *bool  `json:"is_active,omitempty"`
	RoleID     string `json:"role_id,omitempty"`
}

// CreateUserWithRole creates a new user with specified role
func CreateUserWithRole(input CreateUserInput, createdBy primitive.ObjectID) (*models.User, error) {
	ctx := context.Background()

	companyID, err := primitive.ObjectIDFromHex(input.CompanyID)
	if err != nil {
		return nil, errors.New("invalid company ID")
	}

	roleID, err := primitive.ObjectIDFromHex(input.RoleID)
	if err != nil {
		return nil, errors.New("invalid role ID")
	}

	// Check if email already exists in this company
	count, err := userCollection.CountDocuments(ctx, bson.M{
		"email":      input.Email,
		"company_id": companyID,
	})
	if err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, errors.New("user with this email already exists in company")
	}

	// Get role to cache permissions
	role, err := GetRoleByID(roleID)
	if err != nil {
		return nil, errors.New("invalid role")
	}

	// Verify role belongs to the company
	if role.CompanyID != companyID {
		return nil, errors.New("role does not belong to this company")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	newUser := models.User{
		ID:            primitive.NewObjectID(),
		CompanyID:     companyID,
		Email:         input.Email,
		Password:      string(hashedPassword),
		Name:          input.Name,
		Username:      input.Username,
		RoleID:        roleID,
		RoleName:      role.Name,
		Permissions:   role.Permissions,
		IsActive:      input.IsActive,
		IsSuperAdmin:  false,
		EmailVerified: false,
		Phone:         input.Phone,
		Department:    input.Department,
		Position:      input.Position,
		CreatedAt:     primitive.NewDateTimeFromTime(time.Now()),
		UpdatedAt:     primitive.NewDateTimeFromTime(time.Now()),
		CreatedBy:     createdBy,
	}

	_, err = userCollection.InsertOne(ctx, newUser)
	if err != nil {
		return nil, err
	}

	return &newUser, nil
}

// GetUsersByCompany retrieves all users in a company with pagination
func GetUsersByCompany(companyID primitive.ObjectID, page, limit int, searchQuery string) ([]models.User, int64, error) {
	ctx := context.Background()

	filter := bson.M{"company_id": companyID}

	// Add search filter if provided
	if searchQuery != "" {
		filter["$or"] = []bson.M{
			{"name": bson.M{"$regex": searchQuery, "$options": "i"}},
			{"email": bson.M{"$regex": searchQuery, "$options": "i"}},
			{"username": bson.M{"$regex": searchQuery, "$options": "i"}},
			{"department": bson.M{"$regex": searchQuery, "$options": "i"}},
		}
	}

	skip := (page - 1) * limit
	opts := options.Find().
		SetSkip(int64(skip)).
		SetLimit(int64(limit)).
		SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := userCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var users []models.User
	if err := cursor.All(ctx, &users); err != nil {
		return nil, 0, err
	}

	total, err := userCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

// UpdateUserByID updates a user's information
func UpdateUserByID(userID primitive.ObjectID, input UpdateUserInput) error {
	ctx := context.Background()

	updates := bson.M{}

	if input.Name != "" {
		updates["name"] = input.Name
	}
	if input.Username != "" {
		updates["username"] = input.Username
	}
	if input.Phone != "" {
		updates["phone"] = input.Phone
	}
	if input.Department != "" {
		updates["department"] = input.Department
	}
	if input.Position != "" {
		updates["position"] = input.Position
	}
	if input.IsActive != nil {
		updates["is_active"] = *input.IsActive
	}

	// If role is being changed, update role and permissions
	if input.RoleID != "" {
		roleID, err := primitive.ObjectIDFromHex(input.RoleID)
		if err != nil {
			return errors.New("invalid role ID")
		}

		role, err := GetRoleByID(roleID)
		if err != nil {
			return errors.New("invalid role")
		}

		updates["role_id"] = roleID
		updates["role_name"] = role.Name
		updates["permissions"] = role.Permissions
	}

	updates["updated_at"] = primitive.NewDateTimeFromTime(time.Now())

	_, err := userCollection.UpdateOne(
		ctx,
		bson.M{"_id": userID},
		bson.M{"$set": updates},
	)

	return err
}

// DeleteUser soft deletes a user by deactivating them
func DeleteUser(userID primitive.ObjectID) error {
	_, err := userCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": userID},
		bson.M{
			"$set": bson.M{
				"is_active":  false,
				"updated_at": primitive.NewDateTimeFromTime(time.Now()),
			},
		},
	)
	return err
}

// ResetUserPassword resets a user's password
func ResetUserPassword(userID primitive.ObjectID, newPassword string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	_, err = userCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": userID},
		bson.M{
			"$set": bson.M{
				"password":   string(hashedPassword),
				"updated_at": primitive.NewDateTimeFromTime(time.Now()),
			},
		},
	)
	return err
}

// GetUserStats retrieves user statistics for a company
func GetUserStats(companyID primitive.ObjectID) (map[string]interface{}, error) {
	ctx := context.Background()

	totalUsers, err := userCollection.CountDocuments(ctx, bson.M{"company_id": companyID})
	if err != nil {
		return nil, err
	}

	activeUsers, err := userCollection.CountDocuments(ctx, bson.M{
		"company_id": companyID,
		"is_active":  true,
	})
	if err != nil {
		return nil, err
	}

	// Count users by role
	pipeline := []bson.M{
		{"$match": bson.M{"company_id": companyID}},
		{"$group": bson.M{
			"_id":   "$role_name",
			"count": bson.M{"$sum": 1},
		}},
	}

	cursor, err := userCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	roleDistribution := make(map[string]int)
	for cursor.Next(ctx) {
		var result struct {
			RoleName string `bson:"_id"`
			Count    int    `bson:"count"`
		}
		if err := cursor.Decode(&result); err != nil {
			continue
		}
		roleDistribution[result.RoleName] = result.Count
	}

	stats := map[string]interface{}{
		"total_users":       totalUsers,
		"active_users":      activeUsers,
		"inactive_users":    totalUsers - activeUsers,
		"role_distribution": roleDistribution,
	}

	return stats, nil
}
