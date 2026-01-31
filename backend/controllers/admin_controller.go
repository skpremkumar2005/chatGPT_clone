package controllers

import (
	"chatgpt-clone/backend/middleware"
	"chatgpt-clone/backend/models"
	"chatgpt-clone/backend/services"
	"chatgpt-clone/backend/utils"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// RegisterCompany handles company registration
func RegisterCompany(c echo.Context) error {
	var input services.CompanyRegistrationInput
	if err := c.Bind(&input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
	}
	if err := c.Validate(&input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
	}

	company, adminUser, err := services.CreateCompany(input)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
	}

	return utils.SuccessResponse(c, "Company registered successfully", map[string]interface{}{
		"company": company,
		"admin":   adminUser,
	})
}

// CreateUser handles creating a new user (admin only)
func CreateUser(c echo.Context) error {
	companyID, ok := c.Request().Context().Value(middleware.CompanyIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "Company context missing")
	}

	creatorID, ok := c.Request().Context().Value(middleware.UserIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "User context missing")
	}

	var input services.CreateUserInput
	if err := c.Bind(&input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
	}
	if err := c.Validate(&input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
	}

	// Ensure user is creating for their own company
	input.CompanyID = companyID.Hex()

	user, err := services.CreateUserWithRole(input, creatorID)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
	}

	// Log activity
	services.LogActivity(
		companyID,
		creatorID,
		models.ActionCreateUser,
		models.ResourceUser,
		user.ID.Hex(),
		"Created new user: "+user.Email,
		true,
		map[string]interface{}{"user_email": user.Email, "role": user.RoleName},
		c.RealIP(),
		c.Request().UserAgent(),
		"POST",
		c.Path(),
		200,
		"",
	)

	user.Password = "" // Don't return password
	return utils.SuccessResponse(c, "User created successfully", user)
}

// GetUsers retrieves all users in the company
func GetUsers(c echo.Context) error {
	companyID, ok := c.Request().Context().Value(middleware.CompanyIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "Company context missing")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit < 1 || limit > 100 {
		limit = 20
	}

	search := c.QueryParam("search")

	users, total, err := services.GetUsersByCompany(companyID, page, limit, search)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve users")
	}

	// Remove passwords
	for i := range users {
		users[i].Password = ""
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"users":       users,
			"total":       total,
			"page":        page,
			"limit":       limit,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// UpdateUser updates a user's information
func UpdateUser(c echo.Context) error {
	companyID, ok := c.Request().Context().Value(middleware.CompanyIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "Company context missing")
	}

	updaterID, ok := c.Request().Context().Value(middleware.UserIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "User context missing")
	}

	userID, err := primitive.ObjectIDFromHex(c.Param("user_id"))
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid user ID")
	}

	// Verify user belongs to the company
	user, err := services.GetUserByID(userID)
	if err != nil || user.CompanyID != companyID {
		return utils.ErrorResponse(c, http.StatusNotFound, "User not found")
	}

	var input services.UpdateUserInput
	if err := c.Bind(&input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
	}

	err = services.UpdateUserByID(userID, input)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
	}

	// Log activity
	services.LogActivity(
		companyID,
		updaterID,
		models.ActionUpdateUser,
		models.ResourceUser,
		userID.Hex(),
		"Updated user: "+user.Email,
		true,
		map[string]interface{}{"user_email": user.Email},
		c.RealIP(),
		c.Request().UserAgent(),
		"PUT",
		c.Path(),
		200,
		"",
	)

	return utils.SuccessResponse(c, "User updated successfully", nil)
}

// DeactivateUser deactivates a user
func DeactivateUser(c echo.Context) error {
	companyID, ok := c.Request().Context().Value(middleware.CompanyIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "Company context missing")
	}

	deactivatorID, ok := c.Request().Context().Value(middleware.UserIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "User context missing")
	}

	userID, err := primitive.ObjectIDFromHex(c.Param("user_id"))
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid user ID")
	}

	// Verify user belongs to the company
	user, err := services.GetUserByID(userID)
	if err != nil || user.CompanyID != companyID {
		return utils.ErrorResponse(c, http.StatusNotFound, "User not found")
	}

	// Prevent self-deactivation
	if userID == deactivatorID {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Cannot deactivate yourself")
	}

	err = services.DeleteUser(userID)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to deactivate user")
	}

	// Log activity
	services.LogActivity(
		companyID,
		deactivatorID,
		models.ActionDeactivateUser,
		models.ResourceUser,
		userID.Hex(),
		"Deactivated user: "+user.Email,
		true,
		map[string]interface{}{"user_email": user.Email},
		c.RealIP(),
		c.Request().UserAgent(),
		"DELETE",
		c.Path(),
		200,
		"",
	)

	return utils.SuccessResponse(c, "User deactivated successfully", nil)
}

// GetUserStats retrieves user statistics
func GetUserStats(c echo.Context) error {
	companyID, ok := c.Request().Context().Value(middleware.CompanyIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "Company context missing")
	}

	stats, err := services.GetUserStats(companyID)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve statistics")
	}

	return utils.SuccessResponse(c, "Statistics retrieved successfully", stats)
}

// GetRoles retrieves all roles for the company
func GetRoles(c echo.Context) error {
	companyID, ok := c.Request().Context().Value(middleware.CompanyIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "Company context missing")
	}

	roles, err := services.GetRolesByCompany(companyID)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve roles")
	}

	return utils.SuccessResponse(c, "Roles retrieved successfully", roles)
}

// UpdateRolePermissions updates permissions for a role
func UpdateRolePermissions(c echo.Context) error {
	companyID, ok := c.Request().Context().Value(middleware.CompanyIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "Company context missing")
	}

	roleID, err := primitive.ObjectIDFromHex(c.Param("role_id"))
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid role ID")
	}

	// Verify role belongs to company
	role, err := services.GetRoleByID(roleID)
	if err != nil || role.CompanyID != companyID {
		return utils.ErrorResponse(c, http.StatusNotFound, "Role not found")
	}

	var input struct {
		Permissions []string `json:"permissions" validate:"required"`
	}
	if err := c.Bind(&input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
	}

	err = services.UpdateRolePermissions(roleID, input.Permissions)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
	}

	return utils.SuccessResponse(c, "Role permissions updated successfully", nil)
}

// GetCompanySettings retrieves company settings
func GetCompanySettings(c echo.Context) error {
	companyID, ok := c.Request().Context().Value(middleware.CompanyIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "Company context missing")
	}

	company, err := services.GetCompanyByID(companyID)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusNotFound, "Company not found")
	}

	return utils.SuccessResponse(c, "Settings retrieved successfully", map[string]interface{}{
		"company":  company,
		"settings": company.Settings,
	})
}

// UpdateCompanySettings updates company settings
func UpdateCompanySettings(c echo.Context) error {
	companyID, ok := c.Request().Context().Value(middleware.CompanyIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "Company context missing")
	}

	var settings models.CompanySettings
	if err := c.Bind(&settings); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
	}

	err := services.UpdateCompanySettings(companyID, settings)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update settings")
	}

	return utils.SuccessResponse(c, "Settings updated successfully", nil)
}

// GetActivityLogs retrieves activity logs
func GetActivityLogs(c echo.Context) error {
	companyID, ok := c.Request().Context().Value(middleware.CompanyIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "Company context missing")
	}

	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit < 1 || limit > 100 {
		limit = 50
	}

	var userID *primitive.ObjectID
	if userIDStr := c.QueryParam("user_id"); userIDStr != "" {
		uid, err := primitive.ObjectIDFromHex(userIDStr)
		if err == nil {
			userID = &uid
		}
	}

	action := c.QueryParam("action")
	resource := c.QueryParam("resource")

	logs, total, err := services.GetActivityLogs(companyID, page, limit, userID, action, resource, nil, nil)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve activity logs")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"logs":        logs,
			"total":       total,
			"page":        page,
			"limit":       limit,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// GetCompanyAnalytics retrieves company analytics
func GetCompanyAnalytics(c echo.Context) error {
	companyID, ok := c.Request().Context().Value(middleware.CompanyIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "Company context missing")
	}

	days, _ := strconv.Atoi(c.QueryParam("days"))
	if days < 1 {
		days = 30
	}

	stats, err := services.GetCompanyActivityStats(companyID, days)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to retrieve analytics")
	}

	userStats, err := services.GetUserStats(companyID)
	if err == nil {
		stats["user_stats"] = userStats
	}

	return utils.SuccessResponse(c, "Analytics retrieved successfully", stats)
}

// ========== SUPER ADMIN COMPANY MANAGEMENT ==========

// CreateCompanyBySuperAdmin creates a new company (super admin only)
func CreateCompanyBySuperAdmin(c echo.Context) error {
	var input services.CompanyRegistrationInput
	if err := c.Bind(&input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
	}
	if err := c.Validate(&input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
	}

	company, adminUser, err := services.CreateCompany(input)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
	}

	// Log activity
	userID, _ := c.Request().Context().Value(middleware.UserIDKey).(primitive.ObjectID)
	superAdminCompanyID, _ := c.Request().Context().Value(middleware.CompanyIDKey).(primitive.ObjectID)
	services.LogActivity(
		superAdminCompanyID,
		userID,
		models.ActionCreateCompany,
		models.ResourceCompany,
		company.ID.Hex(),
		"Super admin created new company: "+company.Name,
		true,
		map[string]interface{}{"company_domain": company.Domain},
		c.RealIP(),
		c.Request().UserAgent(),
		"POST",
		c.Path(),
		200,
		"",
	)

	return utils.SuccessResponse(c, "Company created successfully", map[string]interface{}{
		"company": company,
		"admin":   adminUser,
	})
}

// GetAllCompaniesBySuperAdmin retrieves all companies (super admin only)
func GetAllCompaniesBySuperAdmin(c echo.Context) error {
	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit < 1 || limit > 100 {
		limit = 20
	}

	search := c.QueryParam("search")

	companies, total, err := services.GetAllCompanies(page, limit, search)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch companies")
	}

	totalPages := (total + limit - 1) / limit

	return utils.SuccessResponse(c, "Companies retrieved successfully", map[string]interface{}{
		"companies":   companies,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": totalPages,
	})
}

// GetCompanyByID retrieves a specific company (super admin only)
func GetCompanyByID(c echo.Context) error {
	companyIDStr := c.Param("company_id")
	companyID, err := primitive.ObjectIDFromHex(companyIDStr)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid company ID")
	}

	company, err := services.GetCompanyByID(companyID)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusNotFound, "Company not found")
	}

	return utils.SuccessResponse(c, "Company retrieved successfully", company)
}

// UpdateCompanyBySuperAdmin updates company details (super admin only)
func UpdateCompanyBySuperAdmin(c echo.Context) error {
	companyIDStr := c.Param("company_id")
	companyID, err := primitive.ObjectIDFromHex(companyIDStr)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid company ID")
	}

	var updates map[string]interface{}
	if err := c.Bind(&updates); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
	}

	// Remove protected fields
	delete(updates, "_id")
	delete(updates, "created_at")

	err = services.UpdateCompany(companyID, updates)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
	}

	// Log activity
	userID, _ := c.Request().Context().Value(middleware.UserIDKey).(primitive.ObjectID)
	superAdminCompanyID, _ := c.Request().Context().Value(middleware.CompanyIDKey).(primitive.ObjectID)
	services.LogActivity(
		superAdminCompanyID,
		userID,
		models.ActionUpdateCompany,
		models.ResourceCompany,
		companyID.Hex(),
		"Super admin updated company",
		true,
		updates,
		c.RealIP(),
		c.Request().UserAgent(),
		"PUT",
		c.Path(),
		200,
		"",
	)

	return utils.SuccessResponse(c, "Company updated successfully", nil)
}

// DeactivateCompany deactivates a company (super admin only)
func DeactivateCompany(c echo.Context) error {
	companyIDStr := c.Param("company_id")
	companyID, err := primitive.ObjectIDFromHex(companyIDStr)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid company ID")
	}

	err = services.DeactivateCompany(companyID)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
	}

	// Log activity
	userID, _ := c.Request().Context().Value(middleware.UserIDKey).(primitive.ObjectID)
	superAdminCompanyID, _ := c.Request().Context().Value(middleware.CompanyIDKey).(primitive.ObjectID)
	services.LogActivity(
		superAdminCompanyID,
		userID,
		models.ActionDeleteUser, // Reusing for company deactivation
		models.ResourceCompany,
		companyID.Hex(),
		"Super admin deactivated company",
		true,
		nil,
		c.RealIP(),
		c.Request().UserAgent(),
		"DELETE",
		c.Path(),
		200,
		"",
	)

	return utils.SuccessResponse(c, "Company deactivated successfully", nil)
}
