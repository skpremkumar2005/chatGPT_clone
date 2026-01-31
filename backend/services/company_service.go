package services

import (
	"chatgpt-clone/backend/models"
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// CompanyRegistrationInput defines input for company registration
type CompanyRegistrationInput struct {
	CompanyName string `json:"company_name" validate:"required,min=2"`
	Domain      string `json:"domain" validate:"required,min=2,max=50,alphanum"`
	Email       string `json:"email" validate:"required,email"`
	Phone       string `json:"phone,omitempty"`
	Address     string `json:"address,omitempty"`

	// Admin user details
	AdminName     string `json:"admin_name" validate:"required,min=2"`
	AdminEmail    string `json:"admin_email" validate:"required,email"`
	AdminPassword string `json:"admin_password" validate:"required,min=6"`
}

// CreateCompany creates a new company with default settings and admin user
func CreateCompany(input CompanyRegistrationInput) (*models.Company, *models.User, error) {
	ctx := context.Background()

	// Check if company domain already exists
	count, err := companyCollection.CountDocuments(ctx, bson.M{"domain": input.Domain})
	if err != nil {
		return nil, nil, err
	}
	if count > 0 {
		return nil, nil, errors.New("company domain already exists")
	}

	// Check if company email already exists
	count, err = companyCollection.CountDocuments(ctx, bson.M{"email": input.Email})
	if err != nil {
		return nil, nil, err
	}
	if count > 0 {
		return nil, nil, errors.New("company email already exists")
	}

	// Create company with default settings
	company := models.Company{
		ID:                 primitive.NewObjectID(),
		Name:               input.CompanyName,
		Domain:             input.Domain,
		Email:              input.Email,
		Phone:              input.Phone,
		Address:            input.Address,
		SubscriptionTier:   "free",
		SubscriptionStatus: "active",
		MaxUsers:           10, // Free tier limit
		Settings: models.CompanySettings{
			AllowUserRegistration:    false, // Only admins can add users by default
			RequireEmailVerification: false,
			SessionTimeout:           60, // 60 minutes
			AllowedDomains:           []string{},
			MaxChatsPerUser:          100,
			MaxMessagesPerChat:       1000,
			EnableDocumentUpload:     true,
			MaxDocumentSize:          10 * 1024 * 1024, // 10MB
		},
		IsActive:  true,
		CreatedAt: primitive.NewDateTimeFromTime(time.Now()),
		UpdatedAt: primitive.NewDateTimeFromTime(time.Now()),
	}

	_, err = companyCollection.InsertOne(ctx, company)
	if err != nil {
		return nil, nil, err
	}

	// Create default roles for the company
	err = createDefaultRoles(company.ID)
	if err != nil {
		// Rollback: delete the company
		companyCollection.DeleteOne(ctx, bson.M{"_id": company.ID})
		return nil, nil, err
	}

	// Get the company_admin role
	var adminRole models.Role
	err = roleCollection.FindOne(ctx, bson.M{
		"company_id": company.ID,
		"name":       models.RoleCompanyAdmin,
	}).Decode(&adminRole)
	if err != nil {
		companyCollection.DeleteOne(ctx, bson.M{"_id": company.ID})
		return nil, nil, err
	}

	// Create admin user
	adminUser, err := CreateUserWithRole(CreateUserInput{
		CompanyID: company.ID.Hex(),
		Name:      input.AdminName,
		Email:     input.AdminEmail,
		Password:  input.AdminPassword,
		RoleID:    adminRole.ID.Hex(),
		IsActive:  true,
	}, primitive.NilObjectID) // No creator for first admin

	if err != nil {
		// Rollback
		companyCollection.DeleteOne(ctx, bson.M{"_id": company.ID})
		roleCollection.DeleteMany(ctx, bson.M{"company_id": company.ID})
		return nil, nil, err
	}

	// Update company with created_by
	companyCollection.UpdateOne(ctx, bson.M{"_id": company.ID}, bson.M{
		"$set": bson.M{"created_by": adminUser.ID},
	})

	return &company, adminUser, nil
}

// GetCompanyByID retrieves a company by ID
func GetCompanyByID(companyID primitive.ObjectID) (*models.Company, error) {
	var company models.Company
	err := companyCollection.FindOne(context.Background(), bson.M{"_id": companyID}).Decode(&company)
	if err != nil {
		return nil, err
	}
	return &company, nil
}

// GetCompanyByDomain retrieves a company by domain
func GetCompanyByDomain(domain string) (*models.Company, error) {
	var company models.Company
	err := companyCollection.FindOne(context.Background(), bson.M{"domain": domain}).Decode(&company)
	if err != nil {
		return nil, err
	}
	return &company, nil
}

// UpdateCompany updates company details
func UpdateCompany(companyID primitive.ObjectID, updates bson.M) error {
	updates["updated_at"] = primitive.NewDateTimeFromTime(time.Now())
	_, err := companyCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": companyID},
		bson.M{"$set": updates},
	)
	return err
}

// ListCompanies retrieves all companies (for super admin)
func ListCompanies(page, limit int) ([]models.Company, int64, error) {
	ctx := context.Background()

	skip := (page - 1) * limit
	opts := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit)).SetSort(bson.D{{Key: "created_at", Value: -1}})

	cursor, err := companyCollection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var companies []models.Company
	if err := cursor.All(ctx, &companies); err != nil {
		return nil, 0, err
	}

	total, err := companyCollection.CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, 0, err
	}

	return companies, total, nil
}

// UpdateCompanySettings updates company settings
func UpdateCompanySettings(companyID primitive.ObjectID, settings models.CompanySettings) error {
	_, err := companyCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": companyID},
		bson.M{
			"$set": bson.M{
				"settings":   settings,
				"updated_at": primitive.NewDateTimeFromTime(time.Now()),
			},
		},
	)
	return err
}

// GetAllCompanies retrieves all companies with pagination (super admin only)
func GetAllCompanies(page, limit int, search string) ([]models.Company, int, error) {
	ctx := context.Background()
	skip := (page - 1) * limit

	// Build filter
	filter := bson.M{}
	if search != "" {
		filter = bson.M{
			"$or": []bson.M{
				{"name": bson.M{"$regex": search, "$options": "i"}},
				{"domain": bson.M{"$regex": search, "$options": "i"}},
				{"email": bson.M{"$regex": search, "$options": "i"}},
			},
		}
	}

	// Get total count
	total, err := companyCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// Get companies
	cursor, err := companyCollection.Find(
		ctx,
		filter,
		options.Find().SetSkip(int64(skip)).SetLimit(int64(limit)).SetSort(bson.M{"created_at": -1}),
	)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var companies []models.Company
	if err = cursor.All(ctx, &companies); err != nil {
		return nil, 0, err
	}

	return companies, int(total), nil
}

// DeactivateCompany deactivates a company (super admin only)
func DeactivateCompany(companyID primitive.ObjectID) error {
	_, err := companyCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": companyID},
		bson.M{
			"$set": bson.M{
				"is_active":  false,
				"updated_at": primitive.NewDateTimeFromTime(time.Now()),
			},
		},
	)
	return err
}
