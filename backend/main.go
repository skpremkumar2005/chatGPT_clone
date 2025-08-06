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
	// Load .env file (only works locally)
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file, using environment variables")
	}

	// Connect to DB
	config.ConnectDB()

	// Initialize services
	services.Init()

	// Create Echo instance
	e := echo.New()

	// Register the custom validator
	e.Validator = utils.NewValidator()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{os.Getenv("FRONTEND_URL")},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
		AllowMethods:     []string{echo.GET, echo.HEAD, echo.PUT, echo.PATCH, echo.POST, echo.DELETE},
		AllowCredentials: true,
	}))

	// Register routes
	routes.SetupRoutes(e)

	// ✅ Add health check route for Render to detect open port
	e.GET("/", func(c echo.Context) error {
		return c.String(200, "Server is running")
	})

	// ✅ Use PORT from environment (Render requires this)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // default for local dev
	}

	log.Printf("✅ Server starting on port %s", port)
	e.Logger.Fatal(e.Start(":" + port))
}
