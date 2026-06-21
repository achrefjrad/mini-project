package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"mini-project/services"
)

func SearchProducts(c echo.Context) error {
	query := c.QueryParam("q")
	products := services.SearchProducts(query)
	return c.JSON(http.StatusOK, products)
}
