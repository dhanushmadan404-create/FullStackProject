// ---------------- GET category FROM URL ----------------
const params = new URLSearchParams(window.location.search);
const category = params.get("category") || "breakfast";
const cate = category === "drinking" ? "Juice" : category;
const CateImage={
  breakfast:'../assets/food_image/Categories/break_fast.jpg',
  lunch:'../assets/food_image/Categories/lunch.avif',
  dinner:'../assets/food_image/Categories/dinner.webp',
  juice:'../assets/food_image/Categories/drinking.JP',
  snacks:'../assets/food_image/Categories/snacks.jpg'
}
const userId = localStorage.getItem("user_id");
const token = localStorage.getItem("token");

document.addEventListener("DOMContentLoaded", async () => {
  const Cate = document.getElementById("Cate");
  const cardContainer = document.getElementById("cardContainer");

  cardContainer.innerHTML = "<p>Loading foods...</p>"

  // ---------- Category Title ----------
  Cate.innerHTML = `
    <h1>${cate.toUpperCase()}</h1>
  `;

  // ---------- Load Foods ----------
  try {
    // 1️⃣ Fetch liked foods if logged in
    let likedFoodIds = [];
    if (token) {
      const likedRes = await fetch(`${API_BASE_URL}/foods/liked`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (likedRes.ok) {
        likedFoodIds = await likedRes.json();
      }
    }

    // 2️⃣ Fetch foods in category
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
    let defaultFood=
    foods.forEach((food) => {
      const isLiked = likedFoodIds.includes(food.food_id);
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
        onerror="this.onerror=null; this.src=${CateImage[cate.toUpperCase()]};"
      />
    </div>
<div>
    <h2 class="food_name">${food.food_name}</h2>
    <b>${food.opening_time} To ${food.closing_time}</b>
</div>

  <div class="likes">
  ❤️ <span id="like-count-${food.food_id}">
    ${food.total_likes ?? 0}
  </span> Likes
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
  } catch (err) {
    Toastify({
      text: `Fetch Error: ${err.message}`,
      duration: 5000,
      gravity: "top",
      position: "right",
      style: { background: "red" },
      close: true,
      stopOnFocus: true,
    }).showToast();

    cardContainer.innerHTML = `<p style='text-align:center;'>Failed to load records ❌</p>`;
  }
});
// like handle
// button
async function handleLike(foodId) {
  let likeButton = document.getElementById(`like-btn-${foodId}`);
  let removeButton = document.getElementById(`remove-btn-${foodId}`);
  let userId = localStorage.getItem("user_id");

  if (!userId) {
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
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        food_id: Number(foodId)
      })
    });

    const data = await res.json();

    if (!res.ok || data.status === false) {
      Toastify({
        text: data.message || "Already liked",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "red" }
      }).showToast();

      likeButton.style.display = "none";
      removeButton.style.display = "inline-block";
      return;
    }

    // ✅ Success
    likeButton.style.display = "none";
    removeButton.style.display = "inline-block";

    document.getElementById(`like-count-${foodId}`).textContent =
      data.total_likes;

    Toastify({
      text: "Liked successfully ❤️",
      duration: 3000,
      gravity: "top",
      position: "right",
      style: { background: "green" }
    }).showToast();

  } catch (error) {
    Toastify({
      text: "Something went wrong",
      duration: 3000,
      gravity: "top",
      position: "right",
      style: { background: "red" }
    }).showToast();
  }
}
// remove like handle
async function handleRemove(foodId) {
  const likeButton = document.getElementById(`like-btn-${foodId}`);
  const removeButton = document.getElementById(`remove-btn-${foodId}`);
  const token = localStorage.getItem("token");

  if (!token) {
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
    const res = await fetch(`${API_BASE_URL}/foods/like/${foodId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    // ✅ Safe JSON parsing
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      let errorMessage = "Remove failed";

      if (typeof data.detail === "string") {
        errorMessage = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMessage = data.detail[0]?.msg || errorMessage;
      }

      Toastify({
        text: errorMessage,
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "red" }
      }).showToast();
      return;
    }

    // ✅ Success UI update
    likeButton.style.display = "inline-block";
    removeButton.style.display = "none";

    document.getElementById(`like-count-${foodId}`).textContent =
      data.total_likes ?? 0;

    Toastify({
      text: data.message || "Like removed successfully",
      duration: 3000,
      gravity: "top",
      position: "right",
      style: { background: "blue" }
    }).showToast();

  } catch (error) {
    Toastify({
      text: "Network error. Please try again.",
      duration: 3000,
      gravity: "top",
      position: "right",
      style: { background: "red" }
    }).showToast();
  }
}

// ---------------- REVIEW SYSTEM ----------------

const Review = document.getElementById("review");

// Open Review Popup
window.openReview = async function (food_id, food_name) {
  Review.style.visibility = "visible";

  Review.innerHTML = `
    <div  class="review-box">
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
    const commentValue = document.getElementById("commentText").value.trim();

    if (!commentValue) {
      Toastify({
        text: `Comment cannot be empty`,
        duration: 5000,
        gravity: "top",
        position: "right",
        style: { background: "red" },
        close: true,
        stopOnFocus: true,
      }).showToast();
      console.log(commentValue);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          food_id: food_id,
          comment: commentValue,
        }),
      });

      if (!response.ok) {
        Toastify({
          text: `Failed to post comment`,
          gravity: "top",
          position: "right",
          style: { background: "red" },
          close: true,
          stopOnFocus: true,
        }).showToast();

        return;
      }
      Toastify({
        text: `Comment posted successfully`,
        gravity: "top",
        position: "right",
        style: { background: "green" },
      }).showToast();

      document.getElementById("commentText").value = "";
      loadReviews(food_id);
    } catch (error) {
      Toastify({
        text: `Make sure are you login : ${error}`,
        duration: 5000,
        gravity: "top",
        position: "right",
        style: { background: "red" },
        close: true,
        stopOnFocus: true,
      }).showToast();
    }
  });

  // Load existing reviews
  loadReviews(food_id);
};

// Load Reviews
async function loadReviews(food_id) {
  const reviewContainer = document.getElementById("allReviews");

  try {
    const response = await fetch(`${API_BASE_URL}/reviews/food/${food_id}`);

    if (!response.ok) throw new Error("Failed to load reviews");

    const reviewData = await response.json();

    reviewContainer.innerHTML = "";

    if (reviewData.length === 0) {
      reviewContainer.innerHTML = "<p>No comments yet.</p>";
      return;
    }

    reviewData.forEach((data) => {
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
    Toastify({
      text: `Load Review Error: ${error}`,
      duration: 5000,
      gravity: "top",
      position: "right",
      style: { background: "red" },
      close: true,
      stopOnFocus: true,
    }).showToast();
    reviewContainer.innerHTML = "<p>Failed to load comments ❌</p>";
  }
}
