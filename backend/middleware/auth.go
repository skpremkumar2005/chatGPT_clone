package middleware

import (
	"chatgpt-clone/backend/services" // <-- ADD THIS IMPORT
	"context"
	"net/http"
	// "os" // We no longer need this here

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// A private key for our context to avoid collisions.
type contextKey string

// UserIDKey is the key used to store and retrieve the user's ID from the request context.
const UserIDKey contextKey = "userID"


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

        // --- THIS IS THE FIX ---
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, echo.NewHTTPError(http.StatusUnauthorized, "Unexpected signing method")
			}
            // Use the imported secret directly
			return services.JwtSecret, nil
		})
        // --- END OF FIX ---

		if err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Invalid token"})
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			userIDStr, ok := claims["user_id"].(string)
			if !ok {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Invalid token claims"})
			}

			userID, err := primitive.ObjectIDFromHex(userIDStr)
			if err != nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Invalid user ID in token"})
			}

			// Add user ID to the context using our defined key
			ctx := context.WithValue(c.Request().Context(), UserIDKey, userID)
			c.SetRequest(c.Request().WithContext(ctx))

			return next(c)
		}

		return c.JSON(http.StatusUnauthorized, map[string]string{"message": "Invalid token"})
	}
}