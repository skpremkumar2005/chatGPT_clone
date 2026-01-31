package controllers

import (
	"chatgpt-clone/backend/middleware"
	"chatgpt-clone/backend/services"
	"chatgpt-clone/backend/utils"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Register is deprecated in multi-tenant system
// Users should be created by company admins via /api/admin/users
// or during company registration via /api/companies/register
func Register(c echo.Context) error {
	return utils.ErrorResponse(c, http.StatusForbidden,
		"Public registration is not allowed. Please contact your company administrator to create an account, or register your company at /api/companies/register")
}

// Login handles user login and returns a JWT.
func Login(c echo.Context) error {
	var input services.LoginUserInput
	if err := c.Bind(&input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
	}
	if err := c.Validate(&input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
	}

	// Use multi-tenant login
	token, user, err := services.MultiTenantLoginUser(input, c.RealIP())
	if err != nil {
		return utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
	}

	// Set the token in a secure, HttpOnly cookie
	cookie := new(http.Cookie)
	cookie.Name = "token"
	cookie.Value = token
	cookie.Expires = time.Now().Add(72 * time.Hour)
	cookie.Path = "/"
	cookie.HttpOnly = true
	cookie.Secure = true
	cookie.SameSite = http.SameSiteNoneMode
	c.SetCookie(cookie)

	// Return user info without password
	user.Password = ""
	return utils.SuccessResponse(c, "Login successful", map[string]interface{}{
		"user":    user,
		"company": user.CompanyID.Hex(),
		"role":    user.RoleName,
	})
}

// GetCurrentUser retrieves the profile of the currently authenticated user.
func GetCurrentUser(c echo.Context) error {
	// Retrieve userID from context, put there by the AuthMiddleware
	userID, ok := c.Request().Context().Value(middleware.UserIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid user ID in token")
	}

	user, err := services.GetUserByID(userID)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusNotFound, "User not found")
	}

	// Do not return password
	user.Password = ""

	return utils.SuccessResponse(c, "User profile fetched successfully", user)
}

// Logout is a placeholder for session/token invalidation logic.
func Logout(c echo.Context) error {
	// --- CHANGE IS HERE ---
	// To "delete" a cookie, we set it again but with an expiration date in the past.
	cookie := new(http.Cookie)
	cookie.Name = "token"
	cookie.Value = ""
	cookie.Expires = time.Unix(0, 0) // Set to a past time
	cookie.Path = "/"
	cookie.HttpOnly = true
	c.SetCookie(cookie)
	// --- END OF CHANGE ---

	return utils.SuccessResponse(c, "Logged out successfully", nil)
}
