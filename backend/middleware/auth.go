package middleware

import (
	"chatgpt-clone/backend/services"
	"context"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// A private key for our context to avoid collisions.
type contextKey string

// Context keys for storing user information
const (
	UserIDKey       contextKey = "userID"
	CompanyIDKey    contextKey = "companyID"
	RoleIDKey       contextKey = "roleID"
	RoleNameKey     contextKey = "roleName"
	PermissionsKey  contextKey = "permissions"
	IsSuperAdminKey contextKey = "isSuperAdmin"
)

// AuthMiddleware is the JWT authentication middleware that reads from a cookie.
func AuthMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Read the cookie named "token"
		cookie, err := c.Cookie("token")
		if err != nil {
			if err == http.ErrNoCookie {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Missing authentication token"})
			}
			return c.JSON(http.StatusBadRequest, map[string]string{"message": "Bad request"})
		}

		// Extract the token string from the cookie
		tokenString := cookie.Value

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, echo.NewHTTPError(http.StatusUnauthorized, "Unexpected signing method")
			}
			return services.JwtSecret, nil
		})

		if err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Invalid token"})
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			// Extract user ID
			userIDStr, ok := claims["user_id"].(string)
			if !ok {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Invalid token claims"})
			}

			userID, err := primitive.ObjectIDFromHex(userIDStr)
			if err != nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Invalid user ID in token"})
			}

			// Start with user ID in context
			ctx := context.WithValue(c.Request().Context(), UserIDKey, userID)

			// Extract company ID (for multi-tenant)
			if companyIDStr, ok := claims["company_id"].(string); ok && companyIDStr != "" {
				companyID, err := primitive.ObjectIDFromHex(companyIDStr)
				if err == nil {
					ctx = context.WithValue(ctx, CompanyIDKey, companyID)
				}
			}

			// Extract role information
			if roleIDStr, ok := claims["role_id"].(string); ok && roleIDStr != "" {
				roleID, err := primitive.ObjectIDFromHex(roleIDStr)
				if err == nil {
					ctx = context.WithValue(ctx, RoleIDKey, roleID)
				}
			}

			if roleName, ok := claims["role_name"].(string); ok {
				ctx = context.WithValue(ctx, RoleNameKey, roleName)
			}

			// Extract permissions array
			if permsInterface, ok := claims["permissions"]; ok {
				if permsArray, ok := permsInterface.([]interface{}); ok {
					permissions := make([]string, 0, len(permsArray))
					for _, p := range permsArray {
						if pStr, ok := p.(string); ok {
							permissions = append(permissions, pStr)
						}
					}
					ctx = context.WithValue(ctx, PermissionsKey, permissions)
				}
			}

			// Extract super admin flag
			if isSuperAdmin, ok := claims["is_super_admin"].(bool); ok {
				ctx = context.WithValue(ctx, IsSuperAdminKey, isSuperAdmin)
			}

			c.SetRequest(c.Request().WithContext(ctx))

			return next(c)
		}

		return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Invalid token"})
	}
}
