package utils

import (
	"github.com/labstack/echo/v4"
)

// Response is a standard JSON response structure
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// SuccessResponse sends a standard success response with a 200 OK status.
func SuccessResponse(c echo.Context, message string, data interface{}) error {
	return c.JSON(200, Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// ErrorResponse sends a standard error response with a given status code.
func ErrorResponse(c echo.Context, statusCode int, message string) error {
	return c.JSON(statusCode, Response{
		Success: false,
		Message: message,
	})
}