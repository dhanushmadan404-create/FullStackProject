// ---------------- GET category FROM URL ----------------
let allFoods = [];
const hideSearch = true;
window.hideSearch = hideSearch;
let likedFoodIdsGlobal = [];
// category name for gwt data in food table
const params = new URLSearchParams(window.location.search);
const category = params.get("category") || "breakfast";
const cate = category === "drinking" ? "Juice" : category;

// normal authorization
const userId = localStorage.getItem("user_id");
const token = localStorage.getItem("token");

// before searching
// ?---------------- RENDER FOODS FUNCTION ----------------
async function renderFoods(foodList) {
  const cardContainer = document.getElementById("cardContainer");
  cardContainer.innerHTML = "";

  // Check before fetch

  if (!Array.isArray(foodList) || foodList.length === 0) {
    cardContainer.innerHTML = `
      <div style="text-align:center; width:100%; margin-top:50px;">
        <p>No matching foods found 🍛</p>
      </div>`;
    return;
  }

  // ? list out the foods with address fetching
  console.log(foodList);
  
  // Create all cards immediately with loading state for addresses
  foodList.forEach((food) => {
    const isLiked = likedFoodIdsGlobal.includes(food.food_id);
    const div = document.createElement("div");

    // set data as locked loc
    div.innerHTML = `
      <div class="card">
        <div class="image_container">
          <img 
            src="${getImageUrl(food.food_image_url, '../assets/food_image/Layout.png')}" 
            class="card-image"
            onerror="this.onerror=null; this.src='../assets/food_image/Layout.png';"
          />
          <div class="title-likes">
          <h2 class="food_name">${food.food_name}</h2>
           <div class="likes">
          ❤️ <span id="like-count-${food.food_id}">
            ${food.total_likes ?? 0}
          </span> Likes
        </div>
        </div>
        </div>

        <div >
          <p><strong>Shop Time:</strong> ${food.opening_time} To ${food.closing_time}</p>
          <p><strong>Address:</strong> <span id="addr-category-${food.food_id}">Loading address...</span></p>
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
            DISLIKE
          </button>

          <button onclick="openReview(${food.food_id}, '${food.food_name}')">
            REVIEW
          </button>

          <button onclick="window.location.href='./map.html?food_id=${food.food_id}'">
            FIND
          </button>
        </div>
      </div>
    `;
    cardContainer.appendChild(div);
  });

  // Fetch addresses asynchronously and update the DOM
  for (const food of foodList) {
    if (food.latitude && food.longitude) {
      window.fetchAddress(food.latitude, food.longitude).then(addr => {
        if (addr && addr.display_name !== "Address unavailable") {
            const addressText = [addr.road, addr.suburb, addr.city].filter(Boolean).join(", ") || addr.display_name;
            const addrElement = document.getElementById(`addr-category-${food.food_id}`);
            if (addrElement) {
              addrElement.innerText = addressText;
            }
        }
      });
    }
  }
}

// ? ----------------Dom manipulation functions----------------
document.addEventListener("DOMContentLoaded", async () => {
  // Check role
  const check = localStorage.getItem("role");
  if (check === "vendor") {
    window.location.href = "/frontend/pages/vendor-profile.html";
  }
  //
  const Cate = document.getElementById("Cate");
  const cardContainer = document.getElementById("cardContainer");

  cardContainer.innerHTML = "<p>Loading foods...</p>";

  // ---------- Category Title ----------
  Cate.innerHTML = `
    <h1>${cate.toUpperCase()}</h1>
  `;

  // ---------- Load Foods ----------
  try {
    //  Fetch liked foods if logged in
    let likedFoodIds = [];
    if (token) {
      const likedRes = await fetch(`${API_BASE_URL}/foods/liked`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (likedRes.status == 200) {
        likedFoodIds = await likedRes.json();
      }
    }
    likedFoodIdsGlobal = likedFoodIds;

    //  Fetch foods in category
    const response = await fetch(`${API_BASE_URL}/foods/category/${category}`);
    if (response.status !== 200) throw new Error("Failed to load foods");

    const foods = await response.json();
    allFoods = foods;

    // Initial render
    renderFoods(allFoods);

    // Setup search
    setupSearch("#searchInput", allFoods, renderFoods);
  } catch (err) {
    Toastify({
      text: `No foods Uploaded`,
      duration: 5000,
      gravity: "top",
      position: "right",
      style: { background: "red" },
      close: true,
      stopOnFocus: true,
    }).showToast();

    cardContainer.innerHTML = `<p style='text-align:center;'>No Foods Uploaded</p>`;
  }
});

