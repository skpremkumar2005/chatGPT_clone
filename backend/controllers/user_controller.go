package controllers

import (
	"chatgpt-clone/backend/middleware"
	"chatgpt-clone/backend/services"
	"chatgpt-clone/backend/utils"
	"net/http"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// UpdateUserProfile updates the authenticated user's own profile fields.
func UpdateUserProfile(c echo.Context) error {
	userID, ok := c.Request().Context().Value(middleware.UserIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid user ID in token")
	}

	var input services.UpdateProfileInput
	if err := c.Bind(&input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
	}
	if err := c.Validate(&input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
	}

	user, err := services.UpdateUserProfile(userID, input)
	if err != nil {
		return utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update profile")
	}

	user.Password = ""
	return utils.SuccessResponse(c, "Profile updated successfully", user)
}

// ChangePassword lets the authenticated user change their own password.
func ChangePassword(c echo.Context) error {
	userID, ok := c.Request().Context().Value(middleware.UserIDKey).(primitive.ObjectID)
	if !ok {
		return utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid user ID in token")
	}

	var input services.ChangePasswordInput
	if err := c.Bind(&input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, "Invalid request body")
	}
	if err := c.Validate(&input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
	}

	if err := services.ChangeUserPassword(userID, input); err != nil {
		return utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
	}

	return utils.SuccessResponse(c, "Password changed successfully", nil)
}
