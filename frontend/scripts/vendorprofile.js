const profile_image = document.getElementById("DB");
const vendorName = document.getElementById("vendor_details");
const TimeStatus = document.getElementById("timeStatus");
const food_container = document.getElementById("food_container");
const reviews_container = document.getElementById("reviews_container");

// Make API_URL consistent with common.js
const API_URL = window.API_BASE_URL;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      alert("User ID not found. Please login again.");
      logout();
      return;
    }

    // Fetch user info first
    const res = await fetch(`${API_URL}/users/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch user data");

    const user = await res.json();
    console.log("User Data:", user);

    // Render profile image + name/email
    profile_image.innerHTML = `<img src="${getImageUrl(user.image_url)}" class="card-image" onerror="this.onerror=null; this.src='../assets/default_vendor.png';"/>`;
    vendorName.innerHTML = `
      <h2>${user.name}</h2>
      <p>${user.email}</p>
    `;

    // Fetch vendor info from backend
    const vendorDocRes = await fetch(`${API_URL}/vendors/user/${userId}`);
    if (!vendorDocRes.ok) throw new Error("Failed to fetch vendor data");

    const vendorDoc = await vendorDocRes.json();
    console.log("Vendor Data:", vendorDoc);
    localStorage.setItem("vendorId", vendorDoc.vendor_id);

    TimeStatus.innerHTML = `${vendorDoc.opening_time || "N/A"} - ${vendorDoc.closing_time || "N/A"}`;

    // Fetch foods
    const foodRes = await fetch(`${API_URL}/foods/vendor/${vendorDoc.vendor_id}`);
    if (!foodRes.ok) throw new Error("Failed to fetch foods");

    const foods = await foodRes.json();
    console.log("Foods:", foods);

    if (Array.isArray(foods)) {
      foods.forEach(food => {
        const div = document.createElement("div");
        div.id = `food-${food.food_id}`;
        div.classList.add("review-card");
        div.innerHTML = `
          <img src="${getImageUrl(food.food_image_url)}" class="card-image"
               onerror="this.onerror=null; this.src='../assets/default_food.png';"
          />
          <div class="card-info">
            <p><strong>${food.food_name}</strong></p>
            <p>${food.category}</p>
            <button onclick="deleteFood(${food.food_id})" style="background:red;color:white;border:none;padding:5px;cursor:pointer;">
              Remove
            </button>
          </div>
        `;
        food_container.appendChild(div);
      });
    }

  } catch (e) {
    console.error(e);
    Toastify({
      text: "Failed to load vendor profile ❌",
      duration: 4000,
      gravity: "top",
      position: "right",
      style: { background: "red" },
    }).showToast();
  }
});

// -----------------------------
// Logout
// -----------------------------
function logout() {
  localStorage.clear();
  location.href = "./login.html";
}

// -----------------------------
// Delete Food
// -----------------------------
async function deleteFood(foodId) {
  if (!confirm("Are you sure you want to remove this item?")) return;

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/foods/${foodId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      Toastify({
        text: "Food removed ✅",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "green" },
      }).showToast();

      const el = document.getElementById(`food-${foodId}`);
      if (el) el.remove();
    } else {
      Toastify({
        text: "Failed to delete food ❌",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "red" },
      }).showToast();
    }
  } catch (err) {
    console.error(err);
    Toastify({
      text: "Error deleting food ❌",
      duration: 3000,
      gravity: "top",
      position: "right",
      style: { background: "red" },
    }).showToast();
  }
}
