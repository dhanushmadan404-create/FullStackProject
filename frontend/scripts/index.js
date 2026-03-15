
// -----------------------------
// Load Trending Foods (Display Only)
// -----------------------------
const hideSearch=true
async function loadTrendingFoods() {
  const container = document.getElementById("trending_container");
  if (!container) return;

  container.innerHTML = "<p>Loading trending foods...</p>";

  try {
    const response = await fetch(`${API_BASE_URL}/foods/top-liked`);

    if (!response.ok) {
      throw new Error("Failed to fetch trending foods");
    }

    const foods = await response.json();
    container.innerHTML = "";

    if (!Array.isArray(foods) || foods.length === 0) {
      container.innerHTML = "<p>No trending foods found.</p>";
      return;
    }

    foods.forEach(async (food) => {
      let addressText = "Address unavailable";
      const div = document.createElement("div");
      
      if (food && food.Address) {
        const road = food.Address.city || "";
        const city = food.Address.state || "";
        const suburb = food.Address.country || "";
        addressText = [road, city, suburb].filter(Boolean).join(", ") || "";
      }
    
      const imgUrl = getImageUrl(
        food.food_image_url,
        "/frontend/assets/default_food.png"
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
         
    <p><h3>Shop Time:</h3>${food.opening_time} To ${food.closing_time}</p> 
   <br/><h3>Address:</h3><p>${addressText}</p>
</div>

          <div class="likes">
            ❤️ ${food.total_likes ?? 0} Likes
          </div>

          <div class="card-buttons">
            <button
              onclick="window.location.href='/frontend/pages/map.html?food_id=${food.food_id}'"
            >
              FIND
            </button>
          </div>
        </div>
      `;

      container.appendChild(div);
    });

  } catch (error) {
    console.error("Error loading trending foods:", error);
    container.innerHTML = "<p>Something went wrong. Please try again.</p>";
  }
}

document.addEventListener("DOMContentLoaded", () => {

  loadTrendingFoods()
  const check = localStorage.getItem("role")
  if (check === "vendor") {
    window.location.href = "/frontend/pages/vendor-profile.html"
  }
});

// Redirect
