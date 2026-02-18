// ---------------- API BASE URL ----------------
if (typeof API_BASE_URL === "undefined") {
  window.API_BASE_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:8000/api"
      : "/api";
}

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

    foods.forEach((food) => {
      const div = document.createElement("div");
      const imgUrl = getImageUrl(
        food.food_image_url,
        "../assets/default_food.png",
      );

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

  <div class="likes">
  ❤️ <span id="like-count-${food.food_id}">
    ${food.total_likes ?? 0}
  </span> Likes
</div>


    <div class="card-buttons">

      <button 
        id="like-btn-${food.food_id}"
        onclick="handleLike(${food.food_id})"
        ${food.liked_by_user ? "disabled" : ""}>
        LIKE
      </button>

      <button 
        id="remove-btn-${food.food_id}"
        onclick="handleRemove(${food.food_id})"
        style="display:${food.liked_by_user ? "inline-block" : "none"}">
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
async function handleLike(foodId) {
  const userId = localStorage.getItem("user_id");

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
    console.log("Sending Like:", { userId, foodId });

    const res = await fetch(`${API_BASE_URL}/foods/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: parseInt(userId),
        food_id: foodId
      })
    });

    const data = await res.json();
    console.log("Response:", data);

    // 🔴 If backend says already liked
    if (data.status === false) {
      console.log("Already liked:", data.message);

      Toastify({
        text: data.message,
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "red" }
      }).showToast();
      return;
    }

    // 🟢 Success
    document.getElementById(`like-btn-${foodId}`).disabled = true;
    document.getElementById(`remove-btn-${foodId}`).style.display = "inline-block";
    document.getElementById(`like-count-${foodId}`).textContent = data.total_likes;

    Toastify({
      text: "Liked successfully ❤️",
      duration: 3000,
      gravity: "top",
      position: "right",
      style: { background: "green" }
    }).showToast();

  } catch (error) {
    console.log("Like Error:", error);

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
  const userId = localStorage.getItem("user_id");

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
    console.log("Sending Remove:", { userId, foodId });

    const res = await fetch(`${API_BASE_URL}/foods/like`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: parseInt(userId),
        food_id: foodId
      })
    });

    const data = await res.json();
    console.log("Response:", data);

    if (!res.ok) {
      console.log("Remove Failed:", data.detail);

      Toastify({
        text: data.detail || "Remove failed",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "red" }
      }).showToast();
      return;
    }

    // 🟢 Success
    document.getElementById(`like-btn-${foodId}`).disabled = false;
    document.getElementById(`remove-btn-${foodId}`).style.display = "none";
    document.getElementById(`like-count-${foodId}`).textContent = data.total_likes;

    Toastify({
      text: "Like removed ❌",
      duration: 3000,
      gravity: "top",
      position: "right",
      style: { background: "blue" }
    }).showToast();

  } catch (error) {
    console.log("Remove Error:", error);

    Toastify({
      text: "Something went wrong",
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
