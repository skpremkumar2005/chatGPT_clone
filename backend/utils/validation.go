package utils

import (
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
)

// CustomValidator holds the validator instance.
type CustomValidator struct {
	validator *validator.Validate
}

// NewValidator creates and returns a new CustomValidator.
func NewValidator() *CustomValidator {
	return &CustomValidator{validator: validator.New()}
}

// Validate is the function that Echo will call to validate structs.
// It conforms to the echo.Validator interface.
func (cv *CustomValidator) Validate(i interface{}) error {
	if err := cv.validator.Struct(i); err != nil {
		// Optionally, you can return a custom error message here.
		// For now, we'll return a generic HTTP error,
		// and the framework will handle sending the response.
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return nil
}