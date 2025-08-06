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

// Register handles new user registration.
func Register(c echo.Context) error {
	var input services.RegisterUserInput
	if err := c.Bind(&input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
	}
	if err := c.Validate(&input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
	}

	user, err := services.RegisterNewUser(input)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusConflict, err.Error())
	}

	// Do not return password in the response
	user.Password = ""

	return utils.SuccessResponse(c, "User registered successfully", user)
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

	token, err := services.LoginUser(input)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
	}

	// --- CHANGE IS HERE ---
	// Set the token in a secure, HttpOnly cookie
	cookie := new(http.Cookie)
	cookie.Name = "token" // The name of the cookie
	cookie.Value = token
	cookie.Expires = time.Now().Add(72 * time.Hour) // Set expiration
	cookie.Path = "/"                               // Set the path to the root so it's sent on all requests
	cookie.HttpOnly = true                          // Crucial for security! Prevents JS access.
	// Set SameSite for CSRF protection. 'Lax' is a good default.
	// 'Strict' is more secure but can have issues with cross-origin requests.
	cookie.SameSite = http.SameSiteLaxMode
	// In production, you MUST set Secure to true to ensure the cookie is only sent over HTTPS.
	// cookie.Secure = true
	c.SetCookie(cookie)
	// --- END OF CHANGE ---

	// Return a success message instead of the token
	return utils.SuccessResponse(c, "Login successful", nil)
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
