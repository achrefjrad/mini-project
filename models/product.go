package models

type Product struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	Price       float64 `json:"price"`
	PriceText   string  `json:"price_text,omitempty"`
	Category    string  `json:"category"`
	Subcategory string  `json:"subcategory"`
	Description string  `json:"description"`
	Image       string  `json:"image"`
	ProductURL  string  `json:"product_url,omitempty"`
}
