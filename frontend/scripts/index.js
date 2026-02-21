// ---------------- API BASE URL ----------------
if (typeof API_BASE_URL === "undefined") {
  window.API_BASE_URL =
    window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:8000/api"
      : "/api";
}

// Set of food IDs that the current user has already liked
let likedFoodIds = new Set();

// -----------------------------
// Load liked food IDs (if logged in)
// -----------------------------
async function loadLikedIds() {
  const token = localStorage.getItem("token");
  if (!token) return; // not logged in — leave set empty

  try {
    const res = await fetch(`${API_BASE_URL}/foods/liked`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const ids = await res.json();
      likedFoodIds = new Set(ids);
    }
  } catch (e) {
    console.warn("Could not load liked foods:", e);
  }
}

// -----------------------------
// Toggle Like / Remove
// -----------------------------
async function toggleLike(foodId, btn) {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("user_id");

  if (!token || !userId) {
    window.location.href = "./frontend/pages/login.html";
    return;
  }

  const alreadyLiked = likedFoodIds.has(foodId);
  const method = alreadyLiked ? "DELETE" : "POST";

  try {
    const res = await fetch(`${API_BASE_URL}/foods/like`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ food_id: foodId, user_id: parseInt(userId) }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || "Action failed");
      return;
    }

    const data = await res.json();

    if (alreadyLiked) {
      likedFoodIds.delete(foodId);
      btn.textContent = "❤️ Like";
      btn.style.backgroundColor = "#5e2ca5";
    } else {
      likedFoodIds.add(foodId);
      btn.textContent = "💔 Remove";
      btn.style.backgroundColor = "#e53935";
    }

    // Update likes count in the card
    const likesEl = document.getElementById(`likes-${foodId}`);
    if (likesEl && data.total_likes !== undefined) {
      likesEl.textContent = `❤️ ${data.total_likes} Likes`;
    }
  } catch (e) {
    console.error("Toggle like failed:", e);
    alert("Something went wrong");
  }
}

// -----------------------------
// Load Trending Foods
// -----------------------------
async function loadTrendingFoods() {
  const container = document.getElementById("trending_container");
  if (!container) return;

  container.innerHTML = "<p>Loading trending foods...</p>";

  // Load liked IDs first (if logged in)
  await loadLikedIds();

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

      // Use getImageUrl from common.js for correct backend URL resolution
      const imgUrl = getImageUrl(
        food.food_image_url,
        "./frontend/assets/default_food.png"
      );

      const isLiked = likedFoodIds.has(food.food_id);
      const btnLabel = isLiked ? "💔 Remove" : "❤️ Like";
      const btnColor = isLiked ? "#e53935" : "#5e2ca5";

      div.innerHTML = `
        <div class="card">
          <div class="image_container">
            <img
              src="${imgUrl}"
              class="card-image"
              onerror="this.onerror=null; this.src='./frontend/assets/default_food.png';"
            />
          </div>

          <h2 class="food_name">${food.food_name}</h2>

          <div class="likes" id="likes-${food.food_id}">
            ❤️ ${food.total_likes ?? 0} Likes
          </div>

          <div class="card-buttons">
            <button
              onclick="window.location.href='./frontend/pages/map.html?food_id=${food.food_id}'"
            >
              FIND
            </button>
            <button
              id="like-btn-${food.food_id}"
              style="background-color:${btnColor};"
              onclick="toggleLike(${food.food_id}, this)"
            >
              ${btnLabel}
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
