package main

import (
	"time"

	"mini-project/routes"
	"mini-project/services"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	e := echo.New()

	// CORS (frontend on localhost:3000)
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:3000"},
		AllowMethods: []string{"GET", "POST", "OPTIONS"},
	}))

	// Register routes FIRST
	routes.SetupRoutes(e)

	// Start server immediately (non-blocking setup comes AFTER this line)
	go func() {
		// small delay optional (lets server boot before heavy scraping logs)
		time.Sleep(500 * time.Millisecond)

		// run scraper in background
		services.StartScraper(45 * time.Minute)
	}()

	// Optional log
	e.Logger.Info("Server running on http://localhost:8080")

	// Start HTTP server (this blocks)
	e.Logger.Fatal(e.Start(":8080"))
}
