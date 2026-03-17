// -----------------------------
// Load Trending Foods (Display Only)
// -----------------------------
const hideSearch = false;
window.hideSearch = hideSearch;
let trendingFoods = [];

async function loadTrendingFoods() {
  const container = document.getElementById("trending_container");
  if (!container) return;

  container.innerHTML = "<p>Loading trending foods...</p>";

  try {
    const response = await fetch(`${API_BASE_URL}/foods/top-liked`);
    if (!response.ok) throw new Error("Failed to fetch trending foods");

    trendingFoods = await response.json();

    // Render immediately
    renderTrendingFoods(trendingFoods);
    
    // Setup search
    setupSearch("#searchInput", trendingFoods, renderTrendingFoods);

    // Asynchronously fetch and update addresses
    for (const food of trendingFoods) {
      if (food.latitude && food.longitude) {
        fetchAddress(food.latitude, food.longitude).then(addr => {
          if (addr && addr.display_name !== "Address unavailable") {
            const addressText = [addr.road, addr.suburb, addr.city].filter(Boolean).join(", ") || addr.display_name;
            const addrElement = document.getElementById(`addr-trending-${food.food_id}`);
            if (addrElement) {
              addrElement.innerText = addressText;
            }
          }
        });
      }
    }

  } catch (error) {
    console.error("Error loading trending foods:", error);
    container.innerHTML = "<p>Something went wrong. Please try again.</p>";
  }
}

function renderTrendingFoods(foods) {
  const container = document.getElementById("trending_container");
  if (!container) return;
  container.innerHTML = "";

  if (!Array.isArray(foods) || foods.length === 0) {
    container.innerHTML = "<p>No trending foods found.</p>";
    return;
  }

  foods.forEach((food) => {
    let addressText = "Loading address...";
    if (food && food.address_info) {
      const addr = food.address_info;
      addressText = [addr.road, addr.suburb, addr.city].filter(Boolean).join(", ") || addr.display_name;
    }

    const div = document.createElement("div");

    const imgUrl = getImageUrl(
      food.food_image_url,
      "/frontend/assets/default_food.png",
    );

    div.innerHTML = `
      <div class="card">
        <div class="image_container">
          <img
            src="${imgUrl}"
            class="card-image"
            onerror="this.onerror=null; this.src='./frontend/assets/food_image/Layout.png';"
          />
          <h2 class="food_name">${food.food_name}</h2>
        </div> 
       <div>
         <p><strong>Shop Time:</strong> ${food.opening_time} To ${food.closing_time}</p> 
         <p><strong>Address:</strong> <span id="addr-trending-${food.food_id}">${addressText}</span></p>
       </div>
        <div class="likes">❤️ ${food.total_likes ?? 0} Likes</div>
        <div class="card-buttons">
          <button onclick="window.location.href='/frontend/pages/map.html?food_id=${food.food_id}'">FIND</button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadTrendingFoods();
  const check = localStorage.getItem("role");
  if (check === "vendor") {
    window.location.href = "/frontend/pages/vendor-profile.html";
  }
});

// Redirect
