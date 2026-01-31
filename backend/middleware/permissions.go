package middleware

import (
	"chatgpt-clone/backend/models"
	"net/http"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PermissionMiddleware checks if user has required permission
func RequirePermission(permission string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Get permissions from context (set by AuthMiddleware)
			permissionsInterface := c.Request().Context().Value(PermissionsKey)
			if permissionsInterface == nil {
				return echo.NewHTTPError(http.StatusForbidden, "No permissions found")
			}

			permissions, ok := permissionsInterface.([]string)
			if !ok {
				return echo.NewHTTPError(http.StatusForbidden, "Invalid permissions format")
			}

			// Check if user has the required permission
			hasPermission := false
			for _, p := range permissions {
				if p == permission {
					hasPermission = true
					break
				}
			}

			if !hasPermission {
				return echo.NewHTTPError(http.StatusForbidden, "Insufficient permissions")
			}

			return next(c)
		}
	}
}

// RequireAnyPermission checks if user has at least one of the required permissions
func RequireAnyPermission(permissions ...string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			userPermissionsInterface := c.Request().Context().Value(PermissionsKey)
			if userPermissionsInterface == nil {
				return echo.NewHTTPError(http.StatusForbidden, "No permissions found")
			}

			userPermissions, ok := userPermissionsInterface.([]string)
			if !ok {
				return echo.NewHTTPError(http.StatusForbidden, "Invalid permissions format")
			}

			// Check if user has any of the required permissions
			for _, requiredPerm := range permissions {
				for _, userPerm := range userPermissions {
					if userPerm == requiredPerm {
						return next(c)
					}
				}
			}

			return echo.NewHTTPError(http.StatusForbidden, "Insufficient permissions")
		}
	}
}

// RequireSuperAdmin checks if user is a super admin
func RequireSuperAdmin() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			isSuperAdminInterface := c.Request().Context().Value(IsSuperAdminKey)
			if isSuperAdminInterface == nil {
				return echo.NewHTTPError(http.StatusForbidden, "Super admin access required")
			}

			isSuperAdmin, ok := isSuperAdminInterface.(bool)
			if !ok || !isSuperAdmin {
				return echo.NewHTTPError(http.StatusForbidden, "Super admin access required")
			}

			return next(c)
		}
	}
}

// RequireCompanyAdmin checks if user is a company admin
func RequireCompanyAdmin() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			roleNameInterface := c.Request().Context().Value(RoleNameKey)
			if roleNameInterface == nil {
				return echo.NewHTTPError(http.StatusForbidden, "Admin access required")
			}

			roleName, ok := roleNameInterface.(string)
			if !ok {
				return echo.NewHTTPError(http.StatusForbidden, "Invalid role")
			}

			if roleName != models.RoleCompanyAdmin {
				// Also check if super admin
				isSuperAdminInterface := c.Request().Context().Value(IsSuperAdminKey)
				if isSuperAdminInterface != nil {
					if isSuperAdmin, ok := isSuperAdminInterface.(bool); ok && isSuperAdmin {
						return next(c)
					}
				}
				return echo.NewHTTPError(http.StatusForbidden, "Company admin access required")
			}

			return next(c)
		}
	}
}

// TenantIsolationMiddleware ensures users can only access their company's data
// This is automatically applied by extracting company_id from JWT
func TenantIsolationMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Company ID is already in context from AuthMiddleware
			companyIDInterface := c.Request().Context().Value(CompanyIDKey)
			if companyIDInterface == nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "Company context missing")
			}

			// Validate company ID format
			_, ok := companyIDInterface.(primitive.ObjectID)
			if !ok {
				return echo.NewHTTPError(http.StatusUnauthorized, "Invalid company context")
			}

			// Company ID is now available in context for all subsequent operations
			return next(c)
		}
	}
}
