
// -----------------------------
// Load Trending Foods (Display Only)
// -----------------------------
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

    foods.forEach((food) => {
      const div = document.createElement("div");

      const imgUrl = getImageUrl(
        food.food_image_url,
        "/frontend/assets/default_food.png"
      );

      div.innerHTML = `
        <div class="card">
          <div class="image_container">
            <img
              src="./frontend/assets/food_image/Categories/break_fast.jpg"
              class="card-image"
              onerror="this.onerror=null; this.src='/frontend/assets/default_food.png';"
            />
          </div>

         <div>
    <h2 class="food_name">${food.food_name}</h2>
    <b>${food.opening_time} To ${food.closing_time}</b>
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

document.addEventListener("DOMContentLoaded", loadTrendingFoods);