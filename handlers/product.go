package handlers

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"mini-project/services"
)

func GetProduct(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid product id"})
	}

	product := services.GetProductByID(id)
	if product == nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "product not found"})
	}

	return c.JSON(http.StatusOK, product)
}
