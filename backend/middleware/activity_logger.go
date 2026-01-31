package middleware

import (
	"chatgpt-clone/backend/services"
	"time"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ActivityLogger middleware logs all requests as activity logs
func ActivityLogger() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			start := time.Now()

			// Process request
			err := next(c)

			// Extract context values
			var userID primitive.ObjectID
			var companyID primitive.ObjectID

			if userIDInterface := c.Request().Context().Value(UserIDKey); userIDInterface != nil {
				if uid, ok := userIDInterface.(primitive.ObjectID); ok {
					userID = uid
				}
			}

			if companyIDInterface := c.Request().Context().Value(CompanyIDKey); companyIDInterface != nil {
				if cid, ok := companyIDInterface.(primitive.ObjectID); ok {
					companyID = cid
				}
			}

			// Only log if we have user and company context
			if !userID.IsZero() && !companyID.IsZero() {
				duration := time.Since(start)

				action := determineAction(c.Request().Method, c.Path())
				resource := determineResource(c.Path())
				description := generateDescription(c.Request().Method, c.Path())

				statusCode := c.Response().Status
				success := statusCode >= 200 && statusCode < 400

				// Log asynchronously to avoid blocking the request
				go func() {
					services.LogActivity(
						companyID,
						userID,
						action,
						resource,
						"",
						description,
						success,
						map[string]interface{}{
							"duration_ms": duration.Milliseconds(),
							"path":        c.Path(),
						},
						c.RealIP(),
						c.Request().UserAgent(),
						c.Request().Method,
						c.Path(),
						statusCode,
						"",
					)
				}()
			}

			return err
		}
	}
}

// determineAction maps HTTP method and path to activity action
func determineAction(method, path string) string {
	// Map common endpoints to actions
	if path == "/api/auth/login" {
		return "login"
	}
	if path == "/api/auth/logout" {
		return "logout"
	}
	if method == "POST" && contains(path, "/chats") {
		return "create_chat"
	}
	if method == "DELETE" && contains(path, "/chats") {
		return "delete_chat"
	}
	if method == "POST" && contains(path, "/messages") {
		return "send_message"
	}
	if method == "POST" && contains(path, "/documents") {
		return "upload_document"
	}
	if method == "POST" && contains(path, "/users") {
		return "create_user"
	}
	if method == "PUT" && contains(path, "/users") {
		return "update_user"
	}
	if method == "DELETE" && contains(path, "/users") {
		return "delete_user"
	}

	// Default action based on method
	switch method {
	case "GET":
		return "view"
	case "POST":
		return "create"
	case "PUT", "PATCH":
		return "update"
	case "DELETE":
		return "delete"
	default:
		return "unknown"
	}
}

// determineResource extracts resource type from path
func determineResource(path string) string {
	if contains(path, "/users") {
		return "user"
	}
	if contains(path, "/chats") {
		return "chat"
	}
	if contains(path, "/messages") {
		return "message"
	}
	if contains(path, "/documents") {
		return "document"
	}
	if contains(path, "/companies") {
		return "company"
	}
	if contains(path, "/roles") {
		return "role"
	}
	if contains(path, "/settings") {
		return "settings"
	}
	return "unknown"
}

// generateDescription creates a human-readable description
func generateDescription(method, path string) string {
	action := determineAction(method, path)
	resource := determineResource(path)
	return action + " " + resource
}

// contains checks if a string contains a substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || containsHelper(s, substr))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
