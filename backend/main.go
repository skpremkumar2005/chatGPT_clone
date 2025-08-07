package main

import (
	"chatgpt-clone/backend/config"
	"chatgpt-clone/backend/routes"
	"chatgpt-clone/backend/services"
	"chatgpt-clone/backend/utils"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// Load .env (for local dev)
	err := godotenv.Load()
	if err != nil {
		log.Println("⚠️ .env file not found, using environment variables")
	}

	// Connect to database
	config.ConnectDB()

	// Initialize any services
	services.Init()

	// Create Echo instance
	e := echo.New()

	// Register custom validator
	e.Validator = utils.NewValidator()

	// CORS Configuration
	allowedOrigin := os.Getenv("FRONTEND_URL")
	if allowedOrigin == "" {
		allowedOrigin = "http://localhost:3000" // fallback for local dev
	}
	log.Println("✅ Allowed CORS Origin:", allowedOrigin)

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{allowedOrigin},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		AllowMethods:     []string{echo.GET, echo.HEAD, echo.PUT, echo.PATCH, echo.POST, echo.DELETE},
		AllowCredentials: true,
	}))

	// Setup all routes
	routes.SetupRoutes(e)

	// Health check route for Render to detect open port
	e.GET("/", func(c echo.Context) error {
		return c.String(200, "Server is running 🚀")
	})

	// Get PORT from env (Render will set this)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("✅ Server starting on port %s", port)
	e.Logger.Fatal(e.Start(":" + port))
}
