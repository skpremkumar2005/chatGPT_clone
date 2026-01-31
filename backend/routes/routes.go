package routes

import (
	"chatgpt-clone/backend/controllers"
	"chatgpt-clone/backend/middleware"
	"chatgpt-clone/backend/models"

	"github.com/labstack/echo/v4"
)

// SetupRoutes configures all the application routes on the Echo instance.
func SetupRoutes(e *echo.Echo) {
	// API group
	api := e.Group("/api")

	// Public routes - No authentication required
	// Company registration (public)
	api.POST("/companies/register", controllers.RegisterCompany)

	// Authentication routes (no auth required)
	auth := api.Group("/auth")
	{
		// Note: Public user registration is disabled in multi-tenant B2B system
		// Users must be created by company admins or during company registration
		auth.POST("/register", controllers.Register) // Returns forbidden error with instructions
		auth.POST("/login", controllers.Login)
	}

	// Authenticated routes - Base authentication required
	authRequired := api.Group("")
	authRequired.Use(middleware.AuthMiddleware)   // Apply JWT authentication middleware
	authRequired.Use(middleware.ActivityLogger()) // Log all activities
	{
		// User routes
		authRequired.GET("/auth/me", controllers.GetCurrentUser)
		authRequired.POST("/auth/logout", controllers.Logout)

		// Chat Management routes
		chats := authRequired.Group("/chats")
		{
			chats.POST("", controllers.CreateChat)
			chats.GET("", controllers.GetChats)
			chats.GET("/:chat_id", controllers.GetChatByID)
			chats.PUT("/:chat_id", controllers.UpdateChat)
			chats.DELETE("/:chat_id", controllers.DeleteChat)
			chats.POST("/:chat_id/cleanup", controllers.CleanupChat)
			// Message routes (nested under chats)
			chats.POST("/:chat_id/messages", controllers.CreateMessage)
			chats.GET("/:chat_id/messages", controllers.GetMessages)
			// Document processing route
			chats.POST("/:chat_id/documents", controllers.UploadAndProcessDocument)
		}

		// Direct Message routes
		messages := authRequired.Group("/messages")
		{
			messages.DELETE("/:message_id", controllers.DeleteMessage)
		}
	}

	// Admin Panel Routes - Requires authentication + specific permissions
	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware)
	admin.Use(middleware.ActivityLogger())
	{
		// User Management
		users := admin.Group("/users")
		{
			users.POST("", controllers.CreateUser, middleware.RequirePermission(models.PermissionManageUsers))
			users.GET("", controllers.GetUsers, middleware.RequirePermission(models.PermissionViewUsers))
			users.PUT("/:user_id", controllers.UpdateUser, middleware.RequirePermission(models.PermissionManageUsers))
			users.DELETE("/:user_id", controllers.DeactivateUser, middleware.RequirePermission(models.PermissionManageUsers))
			users.GET("/stats", controllers.GetUserStats, middleware.RequirePermission(models.PermissionViewAnalytics))
		}

		// Role Management
		roles := admin.Group("/roles")
		{
			roles.GET("", controllers.GetRoles, middleware.RequirePermission(models.PermissionViewRoles))
			roles.PUT("/:role_id/permissions", controllers.UpdateRolePermissions, middleware.RequirePermission(models.PermissionManageRoles))
		}

		// Activity Logs & Monitoring
		admin.GET("/activity-logs", controllers.GetActivityLogs, middleware.RequirePermission(models.PermissionViewActivityLogs))
		admin.GET("/analytics", controllers.GetCompanyAnalytics, middleware.RequirePermission(models.PermissionViewAnalytics))

		// Company Settings
		admin.GET("/settings", controllers.GetCompanySettings, middleware.RequirePermission(models.PermissionManageCompanySettings))
		admin.PUT("/settings", controllers.UpdateCompanySettings, middleware.RequirePermission(models.PermissionManageCompanySettings))

		// Super Admin Company Management
		companies := admin.Group("/companies")
		companies.Use(middleware.RequireSuperAdmin()) // Only super admins
		{
			companies.POST("", controllers.CreateCompanyBySuperAdmin)
			companies.GET("", controllers.GetAllCompaniesBySuperAdmin)
			companies.GET("/:company_id", controllers.GetCompanyByID)
			companies.PUT("/:company_id", controllers.UpdateCompanyBySuperAdmin)
			companies.DELETE("/:company_id", controllers.DeactivateCompany)
		}
	}
}
