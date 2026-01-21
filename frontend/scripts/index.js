const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://127.0.0.1:8000/api' : '/api';

/**
 * Robustly formats image URLs from the backend.
 * @param {string} rawUrl - The URL from the API.
 * @param {string} fallback - Fallback asset path.
 * @returns {string} - Formatted URL.
 */
function getImageUrl(rawUrl, fallback = './frontend/assets/annesana.png') {
    if (!rawUrl) return fallback;
    if (rawUrl.startsWith('http')) return rawUrl;
    // Ensure leading slash
    return rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl;
}

document.addEventListener("DOMContentLoaded", async () => {
    const trendingContainer = document.querySelector(".trending_prod");
    if (!trendingContainer) return;

    try {
        // Fetch all foods and just show the first 4 as "trending" for now
        const foods = await fetchAPI("/foods");

        if (foods && foods.length > 0) {
            trendingContainer.innerHTML = "";
            foods.slice(0, 4).forEach(food => {
                const imgUrl = getImageUrl(food.food_image_url, './frontend/assets/food_image/items/dinner/chicken_rice.jpg');
                const card = document.createElement("a");
                card.href = "./frontend/pages/map.html?food_id=" + food.food_id;
                card.innerHTML = `
                  <div class="prod_container">
                    <img src="${imgUrl}" alt="${food.food_name}">
                    <b>${food.food_name}</b>
                  </div>
                `;
                trendingContainer.appendChild(card);
            });
        }
    } catch (err) {
        console.error("Failed to load trending items:", err);
        // Fallback to static items is already in HTML, so we just log the error.
    }
});
