package services

import (
	"chatgpt-clone/backend/models"
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// createDefaultRoles creates default system roles for a company
func createDefaultRoles(companyID primitive.ObjectID) error {
	ctx := context.Background()
	now := primitive.NewDateTimeFromTime(time.Now())

	defaultRoles := []models.Role{
		{
			ID:          primitive.NewObjectID(),
			CompanyID:   companyID,
			Name:        models.RoleCompanyAdmin,
			DisplayName: "Company Administrator",
			Description: "Full access to company management, users, and settings",
			Permissions: models.GetDefaultPermissions(models.RoleCompanyAdmin),
			IsSystem:    true,
			CreatedAt:   now,
			UpdatedAt:   now,
		},
		{
			ID:          primitive.NewObjectID(),
			CompanyID:   companyID,
			Name:        models.RoleManager,
			DisplayName: "Manager",
			Description: "Can view team members and their activities",
			Permissions: models.GetDefaultPermissions(models.RoleManager),
			IsSystem:    true,
			CreatedAt:   now,
			UpdatedAt:   now,
		},
		{
			ID:          primitive.NewObjectID(),
			CompanyID:   companyID,
			Name:        models.RoleEmployee,
			DisplayName: "Employee",
			Description: "Standard user with basic chat access",
			Permissions: models.GetDefaultPermissions(models.RoleEmployee),
			IsSystem:    true,
			CreatedAt:   now,
			UpdatedAt:   now,
		},
	}

	// Insert all roles
	var rolesInterface []interface{}
	for _, role := range defaultRoles {
		rolesInterface = append(rolesInterface, role)
	}

	_, err := roleCollection.InsertMany(ctx, rolesInterface)
	return err
}

// CreateRole creates a new custom role
func CreateRole(companyID primitive.ObjectID, name, displayName, description string, permissions []string) (*models.Role, error) {
	ctx := context.Background()

	// Check if role name already exists in company
	count, err := roleCollection.CountDocuments(ctx, bson.M{
		"company_id": companyID,
		"name":       name,
	})
	if err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, errors.New("role with this name already exists")
	}

	role := models.Role{
		ID:          primitive.NewObjectID(),
		CompanyID:   companyID,
		Name:        name,
		DisplayName: displayName,
		Description: description,
		Permissions: permissions,
		IsSystem:    false,
		CreatedAt:   primitive.NewDateTimeFromTime(time.Now()),
		UpdatedAt:   primitive.NewDateTimeFromTime(time.Now()),
	}

	_, err = roleCollection.InsertOne(ctx, role)
	if err != nil {
		return nil, err
	}

	return &role, nil
}

// GetRoleByID retrieves a role by ID
func GetRoleByID(roleID primitive.ObjectID) (*models.Role, error) {
	var role models.Role
	err := roleCollection.FindOne(context.Background(), bson.M{"_id": roleID}).Decode(&role)
	if err != nil {
		return nil, err
	}
	return &role, nil
}

// GetRolesByCompany retrieves all roles for a company
func GetRolesByCompany(companyID primitive.ObjectID) ([]models.Role, error) {
	ctx := context.Background()

	cursor, err := roleCollection.Find(ctx, bson.M{"company_id": companyID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var roles []models.Role
	if err := cursor.All(ctx, &roles); err != nil {
		return nil, err
	}

	return roles, nil
}

// UpdateRole updates a role's details
func UpdateRole(roleID primitive.ObjectID, updates bson.M) error {
	// Prevent updating system roles' core properties
	var role models.Role
	err := roleCollection.FindOne(context.Background(), bson.M{"_id": roleID}).Decode(&role)
	if err != nil {
		return err
	}

	if role.IsSystem {
		// For system roles, only allow updating permissions
		if _, hasName := updates["name"]; hasName {
			return errors.New("cannot modify system role name")
		}
		if _, hasSystem := updates["is_system"]; hasSystem {
			return errors.New("cannot modify system role flag")
		}
	}

	updates["updated_at"] = primitive.NewDateTimeFromTime(time.Now())
	_, err = roleCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": roleID},
		bson.M{"$set": updates},
	)
	return err
}

// DeleteRole deletes a custom role (cannot delete system roles)
func DeleteRole(roleID primitive.ObjectID) error {
	ctx := context.Background()

	// Check if it's a system role
	var role models.Role
	err := roleCollection.FindOne(ctx, bson.M{"_id": roleID}).Decode(&role)
	if err != nil {
		return err
	}

	if role.IsSystem {
		return errors.New("cannot delete system role")
	}

	// Check if any users have this role
	count, err := userCollection.CountDocuments(ctx, bson.M{"role_id": roleID})
	if err != nil {
		return err
	}
	if count > 0 {
		return errors.New("cannot delete role that is assigned to users")
	}

	_, err = roleCollection.DeleteOne(ctx, bson.M{"_id": roleID})
	return err
}

// HasPermission checks if a role has a specific permission
func HasPermission(roleID primitive.ObjectID, permission string) (bool, error) {
	var role models.Role
	err := roleCollection.FindOne(context.Background(), bson.M{"_id": roleID}).Decode(&role)
	if err != nil {
		return false, err
	}

	for _, p := range role.Permissions {
		if p == permission {
			return true, nil
		}
	}
	return false, nil
}

// UpdateRolePermissions updates a role's permissions and syncs to all users with that role
func UpdateRolePermissions(roleID primitive.ObjectID, permissions []string) error {
	ctx := context.Background()

	// Update role
	_, err := roleCollection.UpdateOne(
		ctx,
		bson.M{"_id": roleID},
		bson.M{
			"$set": bson.M{
				"permissions": permissions,
				"updated_at":  primitive.NewDateTimeFromTime(time.Now()),
			},
		},
	)
	if err != nil {
		return err
	}

	// Update all users with this role to sync permissions
	_, err = userCollection.UpdateMany(
		ctx,
		bson.M{"role_id": roleID},
		bson.M{
			"$set": bson.M{
				"permissions": permissions,
				"updated_at":  primitive.NewDateTimeFromTime(time.Now()),
			},
		},
	)

	return err
}
