// ---------------- API BASE URL ----------------
if (typeof API_BASE_URL === "undefined") {
  window.API_BASE_URL =
    window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:8000/api"
      : "/api";
}

// -----------------------------
// Load Trending Foods
// -----------------------------
async function loadTrendingFoods() {
  const container = document.getElementById("trending_container");

  if (!container) return;

  container.innerHTML = "<p>Loading trending foods...</p>";

  try {
    const token = localStorage.getItem("token");
    let likedFoodIds = [];

    // 1️⃣ Fetch liked foods if logged in
    if (token) {
      const likedRes = await fetch(`${API_BASE_URL}/foods/liked`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (likedRes.ok) {
        likedFoodIds = await likedRes.json();
      }
    }

    // 2️⃣ Fetch trending foods
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
      const isLiked = likedFoodIds.includes(food.food_id);
      const div = document.createElement("div");

      const imgUrl = getImageUrl(
        food.food_image_url,
        "./frontend/assets/default_food.png"
      );

      div.innerHTML = `
        <div class="card">
          <div class="image_container">
            <h2 class="food_name">${food.food_name}</h2>

            <img
              src="${imgUrl}"
              class="card-image"
              onerror="this.onerror=null; this.src='./frontend/assets/default_food.png';"
            />
          </div>

          <div class="likes">
            ❤️ <span id="like-count-${food.food_id}">${food.total_likes ?? 0}</span> Likes
          </div>

          <div class="card-buttons">
            <button 
              id="like-btn-${food.food_id}"
              onclick="handleLike(${food.food_id})"
              style="display:${isLiked ? "none" : "inline-block"}">
              LIKE
            </button>

            <button 
              id="remove-btn-${food.food_id}"
              onclick="handleRemove(${food.food_id})"
              style="display:${isLiked ? "inline-block" : "none"}">
              REMOVE
            </button>

            <button 
              onclick="window.location.href='./frontend/pages/map.html?food_id=${food.food_id}'">
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

// -----------------------------
// Like/Remove Functions
// -----------------------------
async function handleLike(foodId) {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("user_id");

  if (!token || !userId) {
    Toastify({
      text: "Please login first 🔐",
      duration: 3000,
      gravity: "top",
      position: "right",
      style: { background: "orange" }
    }).showToast();
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/foods/like`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        user_id: parseInt(userId),
        food_id: foodId
      })
    });

    const data = await res.json();

    if (res.ok) {
      document.getElementById(`like-btn-${foodId}`).style.display = "none";
      document.getElementById(`remove-btn-${foodId}`).style.display = "inline-block";
      document.getElementById(`like-count-${foodId}`).textContent = data.total_likes;

      Toastify({
        text: "Liked! ❤️",
        duration: 2000,
        style: { background: "green" }
      }).showToast();
    } else {
      throw new Error(data.detail || "Failed to like food");
    }
  } catch (error) {
    console.error("Like Error:", error);
  }
}

async function handleRemove(foodId) {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("user_id");

  try {
    const res = await fetch(`${API_BASE_URL}/foods/like`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        user_id: parseInt(userId),
        food_id: foodId
      })
    });

    const data = await res.json();

    if (res.ok) {
      document.getElementById(`like-btn-${foodId}`).style.display = "inline-block";
      document.getElementById(`remove-btn-${foodId}`).style.display = "none";
      document.getElementById(`like-count-${foodId}`).textContent = data.total_likes;

      Toastify({
        text: "Removed! ❌",
        duration: 2000,
        style: { background: "blue" }
      }).showToast();
    } else {
      throw new Error(data.detail || "Failed to remove like");
    }
  } catch (error) {
    console.error("Remove Error:", error);
  }
}

// -----------------------------
// Run Trending After Page Load
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadTrendingFoods();
});

