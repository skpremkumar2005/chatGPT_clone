package routes

import (
	"chatgpt-clone/backend/controllers"
	"chatgpt-clone/backend/middleware"

	"github.com/labstack/echo/v4"
)

// SetupRoutes configures all the application routes on the Echo instance.
func SetupRoutes(e *echo.Echo) {
	// API group
	api := e.Group("/api")

	// Authentication routes (no auth required)
	auth := api.Group("/auth")
	{
		auth.POST("/register", controllers.Register)
		auth.POST("/login", controllers.Login)
	}

	// Authenticated routes
	authRequired := api.Group("")
	authRequired.Use(middleware.AuthMiddleware) // Apply JWT authentication middleware
	{
		// User routes
		authRequired.GET("/auth/me", controllers.GetCurrentUser)
		authRequired.POST("/auth/logout", controllers.Logout) // Placeholder for logout

		// Chat Management routes
		chats := authRequired.Group("/chats")
		{
			chats.POST("", controllers.CreateChat)
			chats.GET("", controllers.GetChats)
			chats.GET("/:chat_id", controllers.GetChatByID)       // Assuming you need this
			chats.PUT("/:chat_id", controllers.UpdateChat)       // For renaming, etc.
			chats.DELETE("/:chat_id", controllers.DeleteChat) // For archiving/deleting
            chats.POST("/:chat_id/cleanup", controllers.CleanupChat)
			// Message routes (nested under chats)
			chats.POST("/:chat_id/messages", controllers.CreateMessage)
			chats.GET("/:chat_id/messages", controllers.GetMessages)
		}

		// Direct Message routes (optional, if you want to delete a single message)
		messages := authRequired.Group("/messages")
		{
			messages.DELETE("/:message_id", controllers.DeleteMessage)
		}
	}
}