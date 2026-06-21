package routes

import (
	"github.com/labstack/echo/v4"
	"mini-project/handlers"
)

func SetupRoutes(e *echo.Echo) {
	e.GET("/health", handlers.HealthCheck)
	e.GET("/search", handlers.SearchProducts)
	e.GET("/products/:id", handlers.GetProduct)
}
