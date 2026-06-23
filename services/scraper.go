package services

import (
	"fmt"
	"hash/fnv"
	"log"
	"math/rand"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gocolly/colly/v2"
	"mini-project/models"
)

type categoryDef struct {
	Name        string
	Subcategory string
	URL         string
}

var scrapeCategories = []categoryDef{
	{Name: "Informatique", Subcategory: "Ordinateurs", URL: "https://www.tunisianet.com.tn/301-pc-portable-tunisie"},
	{Name: "Informatique", Subcategory: "Ordinateurs", URL: "https://www.tunisianet.com.tn/373-pc-de-bureau"},
	{Name: "Informatique", Subcategory: "Stockages", URL: "https://www.tunisianet.com.tn/379-disques-ssd"},
	{Name: "Informatique", Subcategory: "Stockages", URL: "https://www.tunisianet.com.tn/313-disque-dur-externe-tunisie"},
	{Name: "Informatique", Subcategory: "Réseaux et connectivité", URL: "https://www.tunisianet.com.tn/438-reseau"},
	{Name: "Informatique", Subcategory: "Périphériques", URL: "https://www.tunisianet.com.tn/700-accessoires-et-peripheriques"},
	{Name: "Informatique", Subcategory: "Composants", URL: "https://www.tunisianet.com.tn/406-composant-informatique"},
	{Name: "Téléphonie", Subcategory: "Smartphones", URL: "https://www.tunisianet.com.tn/596-smartphone-tunisie"},
	{Name: "Téléphonie", Subcategory: "Smartwatch", URL: "https://www.tunisianet.com.tn/650-smartwatch"},
	{Name: "Téléphonie", Subcategory: "Accessoires", URL: "https://www.tunisianet.com.tn/378-accessoire-telephonie-mobile-tunisie"},
	{Name: "Santé & Beauté", Subcategory: "Moniteurs de santé", URL: "https://www.tunisianet.com.tn/562-sante-connectee-bien-etre-massage"},
	{Name: "Santé & Beauté", Subcategory: "Produits pour soins personnels", URL: "https://www.tunisianet.com.tn/524-entretien-soin"},
	{Name: "Électroménager", Subcategory: "Aspirateurs", URL: "https://www.tunisianet.com.tn/558-aspirateur-tunisie-vapeur"},
	{Name: "Électroménager", Subcategory: "Machine à laver", URL: "https://www.tunisianet.com.tn/528-machine-a-laver"},
	{Name: "Électroménager", Subcategory: "Sèche-linge", URL: "https://www.tunisianet.com.tn/741-seche-linge"},
	{Name: "Électroménager", Subcategory: "Lave-vaisselle", URL: "https://www.tunisianet.com.tn/541-lave-vaisselle-tunisie"},
	{Name: "Électroménager", Subcategory: "Fours", URL: "https://www.tunisianet.com.tn/737-four-encastrable"},
}

var uiNoisePatterns = []string{
	"Ajouter au panier",
	"Ajouter au comparateur",
	"Comparer",
	"Favoris",
	"Mes favoris",
	"En savoir plus",
	"Voir le produit",
	"Quick view",
	"Aperçu rapide",
	"En stock",
	"Rupture",
	"Disponible",
	"Promo",
}

type ProductCache struct {
	mu       sync.RWMutex
	products []models.Product
	byID     map[int]*models.Product
}

var Cache = &ProductCache{
	byID: make(map[int]*models.Product),
}

func init() {
	Cache.Replace(fallbackProducts)
}

func (pc *ProductCache) GetAll() []models.Product {
	pc.mu.RLock()
	defer pc.mu.RUnlock()
	result := make([]models.Product, len(pc.products))
	copy(result, pc.products)
	return result
}

func (pc *ProductCache) GetByID(id int) *models.Product {
	pc.mu.RLock()
	defer pc.mu.RUnlock()
	p, ok := pc.byID[id]
	if !ok {
		return nil
	}
	return p
}

func (pc *ProductCache) Replace(products []models.Product) {
	pc.mu.Lock()
	defer pc.mu.Unlock()
	pc.products = products
	pc.byID = make(map[int]*models.Product, len(products))
	for i := range products {
		p := products[i]
		pc.byID[p.ID] = &products[i]
	}
	log.Printf("[cache] replaced with %d products", len(products))
}

func StartScraper(interval time.Duration) {
	log.Println("[scraper] starting initial scrape...")
	RunScrape()
	if interval > 0 {
		ticker := time.NewTicker(interval)
		go func() {
			for range ticker.C {
				log.Println("[scraper] starting periodic refresh...")
				RunScrape()
			}
		}()
	}
}

func RunScrape() {
	start := time.Now()
	products := scrapeAllCategories()
	if len(products) == 0 {
		log.Println("[scraper] WARNING: scrape returned 0 products, keeping existing cache")
		return
	}
	elapsed := time.Since(start)
	Cache.Replace(products)
	log.Printf("[scraper] scrape complete: %d products cached in %v", len(products), elapsed)
}

func generateID(productURL string) int {
	normalized := strings.TrimSpace(strings.ToLower(productURL))
	h := fnv.New32a()
	h.Write([]byte(normalized))
	return int(h.Sum32())
}

func extractPrice(s string) (float64, string) {
	raw := strings.TrimSpace(s)
	if raw == "" {
		return 0, ""
	}

	raw = strings.ReplaceAll(raw, "\u00a0", " ")
	raw = strings.ReplaceAll(raw, "\t", " ")
	reSpace := regexp.MustCompile(`\s+`)
	raw = strings.TrimSpace(reSpace.ReplaceAllString(raw, " "))

	cleaned := raw

	cleaned = strings.ReplaceAll(cleaned, "DT", "")
	cleaned = strings.ReplaceAll(cleaned, "TND", "")

	cleaned = strings.ReplaceAll(cleaned, "&nbsp;", "")
	cleaned = strings.TrimSpace(cleaned)

	cleaned = strings.ReplaceAll(cleaned, " ", "")

	if len(cleaned) >= 2 && len(cleaned)%2 == 0 {
		half := len(cleaned) / 2
		if cleaned[:half] == cleaned[half:] {
			log.Printf("[scraper] WARNING: duplicated numeric pattern in %q, keeping first half", cleaned)
			cleaned = cleaned[:half]
		}
	}

	if idx := strings.LastIndex(cleaned, ","); idx != -1 {
		cleaned = cleaned[:idx] + "." + cleaned[idx+1:]
	}

	reDigits := regexp.MustCompile(`[^\d.]`)
	cleaned = reDigits.ReplaceAllString(cleaned, "")

	if cleaned == "" {
		log.Printf("[scraper] WARNING: could not parse price from %q", raw)
		return 0, raw
	}

	val, err := strconv.ParseFloat(cleaned, 64)
	if err != nil {
		log.Printf("[scraper] WARNING: strconv.ParseFloat failed for %q (cleaned: %q): %v", raw, cleaned, err)
		return 0, raw
	}

	return val, raw
}

func cleanDescription(text string) string {
	if text == "" {
		return ""
	}

	for _, pattern := range uiNoisePatterns {
		text = strings.ReplaceAll(text, pattern, "")
	}

	re := regexp.MustCompile(`\s+`)
	text = re.ReplaceAllString(text, " ")

	text = strings.TrimSpace(text)

	return text
}

func cleanText(s string) string {
	s = strings.ReplaceAll(s, "\u00a0", " ")
	s = strings.ReplaceAll(s, "\t", " ")
	s = strings.ReplaceAll(s, "\n", " ")
	s = strings.Join(strings.Fields(s), " ")
	return strings.TrimSpace(s)
}

func normalizeName(name string) string {
	re := regexp.MustCompile(`\s+`)
	return strings.TrimSpace(re.ReplaceAllString(name, " "))
}

func absImageURL(rawURL string) string {
	url := strings.TrimSpace(rawURL)
	if url == "" {
		return ""
	}
	if strings.HasPrefix(url, "https://") || strings.HasPrefix(url, "http://") {
		return url
	}
	if strings.HasPrefix(url, "//") {
		return "https:" + url
	}
	return "https://www.tunisianet.com.tn" + url
}

func scrapeAllCategories() []models.Product {
	var all []models.Product
	seen := make(map[int]bool)

	for _, cat := range scrapeCategories {
		page := 1
		catCount := 0
		for {
			url := cat.URL
			if page > 1 {
				sep := "?"
				if strings.Contains(url, "?") {
					sep = "&"
				}
				url = fmt.Sprintf("%s%spage=%d", url, sep, page)
			}

			products, hasNext := scrapeCategoryPage(url, cat.Name, cat.Subcategory)
			for _, p := range products {
				if !seen[p.ID] {
					seen[p.ID] = true
					all = append(all, p)
					catCount++
				}
			}

			if !hasNext || len(products) == 0 {
				break
			}
			page++
			if page > 20 {
				break
			}
			time.Sleep(time.Duration(500+rand.Intn(500)) * time.Millisecond)
		}
		log.Printf("[scraper] category %s / %s → %d products", cat.Name, cat.Subcategory, catCount)
		time.Sleep(time.Duration(500+rand.Intn(500)) * time.Millisecond)
	}
	return all
}

func scrapeCategoryPage(url, category, subcategory string) ([]models.Product, bool) {
	c := colly.NewCollector(
		colly.UserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
		colly.AllowedDomains("www.tunisianet.com.tn", "tunisianet.com.tn"),
	)
	c.SetRequestTimeout(30 * time.Second)

	var products []models.Product
	hasNext := false
	visited := make(map[string]bool)

	c.OnHTML("a[rel=next]", func(e *colly.HTMLElement) {
		hasNext = true
	})

	c.OnHTML("article.product-miniature, div.item-product, div.product-item, div.js-product-miniature", func(e *colly.HTMLElement) {
		productURL := e.ChildAttr("a.product-thumbnail", "href")
		if productURL == "" {
			productURL = e.ChildAttr("a.thumbnail", "href")
		}
		if productURL == "" {
			productURL = e.ChildAttr("a.product-image", "href")
		}
		if productURL == "" {
			productURL = e.ChildAttr("a", "href")
		}
		if productURL == "" {
			return
		}
		if visited[productURL] {
			return
		}
		visited[productURL] = true

		name := cleanText(e.ChildText("h2.product-title a, h3.product-title a, .product-title a, a.product-name"))
		if name == "" {
			name = cleanText(e.ChildText("h2 a, h3 a"))
		}
		if name == "" {
			return
		}
		name = normalizeName(name)

		var price float64
		var priceText string
		var priceHTML string

		if metaContent := e.ChildAttr("meta[itemprop=price]", "content"); metaContent != "" {
			priceHTML = fmt.Sprintf("<meta itemprop=\"price\" content=\"%s\">", metaContent)
			if v, err := strconv.ParseFloat(metaContent, 64); err == nil {
				price = v
			}
			priceText = cleanText(e.ChildText("span[itemprop=price]"))
		}

		if priceHTML == "" {
			if sel := e.DOM.Find("span[itemprop=price]").First(); sel.Length() > 0 {
				priceHTML, _ = sel.Html()
				price, priceText = extractPrice(strings.TrimSpace(sel.Text()))
			}
		}
		if priceHTML == "" {
			if sel := e.DOM.Find("span.price").First(); sel.Length() > 0 {
				priceHTML, _ = sel.Html()
				price, priceText = extractPrice(strings.TrimSpace(sel.Text()))
			}
		}
		if priceHTML == "" {
			if sel := e.DOM.Find(".price").First(); sel.Length() > 0 {
				priceHTML, _ = sel.Html()
				price, priceText = extractPrice(strings.TrimSpace(sel.Text()))
			}
		}

		if priceHTML != "" {
			log.Printf("[debug price html]: %q", priceHTML)
		}

		imageURL := e.ChildAttr(".product-thumbnail img, img.img-responsive, img.primary-image", "src")
		if imageURL == "" {
			imageURL = e.ChildAttr(".product-thumbnail img, img.img-responsive, img.primary-image", "data-src")
		}
		if imageURL == "" {
			imageURL = e.ChildAttr("img", "src")
		}
		if imageURL == "" {
			imageURL = e.ChildAttr("img", "data-src")
		}
		imageURL = absImageURL(imageURL)

		descRaw := e.ChildText(".product-description, .product-description-short, .description")
		description := cleanText(cleanDescription(descRaw))

		log.Printf("[DEBUG PRODUCT ONCE] name=%q price=%f priceText=%q", name, price, priceText)

		id := generateID(productURL)

		p := models.Product{
			ID:          id,
			Name:        name,
			Price:       price,
			PriceText:   cleanText(priceText),
			Category:    cleanText(category),
			Subcategory: cleanText(subcategory),
			Description: description,
			Image:       imageURL,
			ProductURL:  productURL,
		}
		products = append(products, p)
	})

	err := c.Visit(url)
	if err != nil {
		log.Printf("[scraper] error visiting %s: %v", url, err)
		return nil, false
	}

	return products, hasNext
}
