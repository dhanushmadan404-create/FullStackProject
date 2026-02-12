// ---------------- GET category FROM URL ----------------
const params = new URLSearchParams(window.location.search);
const category = params.get("category") || "breakfast";
const cate = category === "drinking" ? "Juice" : category;

document.addEventListener("DOMContentLoaded", async () => {

  const Cate = document.getElementById("Cate");
  const cardContainer = document.getElementById("cardContainer");

  if (!cardContainer) return;

  // ---------- Category Title ----------
  Cate.innerHTML = `
    <h1>${cate.toUpperCase()}</h1>
    <div class="section-title">TOP CATEGORIES</div>
  `;

  // ---------- Load Foods ----------
  try {
    const response = await fetch(`${API_BASE_URL}/foods/category/${category}`);
    if (!response.ok) throw new Error("Failed to load foods");

    const foods = await response.json();

    if (!Array.isArray(foods) || foods.length === 0) {
      cardContainer.innerHTML = `
        <div style="text-align:center; width:100%; margin-top:50px;">
          <p>No foods found for ${category}. 🍛</p>
        </div>`;
      return;
    }

    cardContainer.innerHTML = "";

    foods.forEach(food => {

      const div = document.createElement("div");
      const imgUrl = getImageUrl(food.food_image_url, '../assets/default_food.png');

      div.innerHTML = `
        <div class="card">
          <div class="image_container">
            <h2 class="food_name">${food.food_name}</h2>
            <img
              src="${imgUrl}"
              class="card-image"
              onerror="this.onerror=null; this.src='../assets/default_food.png';"
            />
          </div>

          <div class="card-buttons">
            <button onclick="openReview(${food.food_id}, '${food.food_name}')">
              REVIEW
            </button>

            <button onclick="foodloc(${food.food_id})">
              FIND
            </button>
          </div>
        </div>
      `;

      cardContainer.appendChild(div);
    });

  } catch (err) {
    console.error("Fetch Error:", err);
    cardContainer.innerHTML =
      `<p style='text-align:center;'>Failed to load records ❌</p>`;
  }

});


// ---------------- REVIEW SYSTEM ----------------

const Review = document.getElementById("review");

// Open Review Popup
window.openReview = async function (food_id, food_name) {

  Review.style.visibility = "visible";

  Review.innerHTML = `
    <div class="review-box">
      <h2>${food_name}</h2>
      <span id="closeReview" style="cursor:pointer;">❌</span>

      <div class="commentEntry">
        <textarea 
          id="commentText" 
          placeholder="Enter your comment"
          minlength="5"
          maxlength="200"></textarea>
        <button id="shareBtn">Share</button>
      </div>

      <div id="allReviews"></div>
    </div>
  `;

  // Close button
  document.getElementById("closeReview").addEventListener("click", () => {
    Review.style.visibility = "hidden";
  });

  // Share comment
  document.getElementById("shareBtn").addEventListener("click", async () => {

    const commentValue =
      document.getElementById("commentText").value.trim();

    if (!commentValue) {
      console.log("Comment cannot be empty");
      return;
    }

    try {

      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          food_id: food_id,
          comment: commentValue
        })
      });

      if (!response.ok) {
        console.log("Failed to post comment");
        return;
      }

      console.log("Comment posted successfully");

      document.getElementById("commentText").value = "";
      loadReviews(food_id);

    } catch (error) {
      console.error("Post Review Error:", error);
    }
  });

  // Load existing reviews
  loadReviews(food_id);
};


// Load Reviews
async function loadReviews(food_id) {

  const reviewContainer = document.getElementById("allReviews");

  try {

    const response =
      await fetch(`${API_BASE_URL}/reviews/food/${food_id}`);

    if (!response.ok)
      throw new Error("Failed to load reviews");

    const reviewData = await response.json();

    reviewContainer.innerHTML = "";

    if (reviewData.length === 0) {
      reviewContainer.innerHTML = "<p>No comments yet.</p>";
      return;
    }

    reviewData.forEach(data => {

      const div = document.createElement("div");
      div.classList.add("review-item");

      div.innerHTML = `
        <b>${data.username || "User"}</b>
        <small>
          ${new Date(data.created_at).toLocaleString()}
        </small>
        <p>${data.comment}</p>
        <hr/>
      `;

      reviewContainer.appendChild(div);
    });

  } catch (error) {
    console.error("Load Review Error:", error);
    reviewContainer.innerHTML =
      "<p>Failed to load comments ❌</p>";
  }
}


// ---------------- FOOD LOCATION ----------------

window.foodloc = function (food_id) {

  if (!food_id) {
    console.log("Food ID missing");
    return;
  }

  window.location.href =
    "../map.html?food_id=" + food_id;
};
