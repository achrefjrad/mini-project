package main

import (
	"mini-project/routes"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	e := echo.New()

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:3000"},
		AllowMethods: []string{"GET", "POST", "OPTIONS"},
	}))

	routes.SetupRoutes(e)

	e.Logger.Fatal(e.Start(":8080"))
}
