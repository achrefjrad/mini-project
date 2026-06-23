package services

import (
	"strings"

	"mini-project/models"
)

func SearchProducts(query string) []models.Product {
	all := Cache.GetAll()
	if query == "" {
		return all
	}

	q := strings.ToLower(query)
	var result []models.Product
	for _, p := range all {
		if strings.Contains(strings.ToLower(p.Name), q) ||
			strings.Contains(strings.ToLower(p.Description), q) ||
			strings.Contains(strings.ToLower(p.Category), q) ||
			strings.Contains(strings.ToLower(p.Subcategory), q) {
			result = append(result, p)
		}
	}
	return result
}

func GetProductByID(id int) *models.Product {
	return Cache.GetByID(id)
}
