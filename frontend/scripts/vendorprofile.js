const API_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000/api'
    : '/api';
const token = localStorage.getItem("token");

// ---------------------- Vendor Profile Script ----------------------
const profile_image = document.getElementById("DB");
const vendorName = document.getElementById("vendor_details");
const TimeStatus = document.getElementById("timeStatus");
const food_container = document.getElementById("food_container");

document.addEventListener("DOMContentLoaded", async () => {
  ;
  if (!token) return window.location.href = "./login.html";

  try {
    // 1️⃣ Get vendor user_id from the security /me endpoint
    const res = await fetch(`${API_URL}/users/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      localStorage.clear();
      return window.location.href = "./login.html";
    }

    const userData = await res.json();

    // Render profile info
    profile_image.innerHTML = `<img src="${userData.image_url || '../assets/default.png'}" class="card-image"/>`;
    vendorName.innerHTML = `
      <h2>${userData.name}</h2>
      <p>${userData.email}</p>
    `;

    // 2️⃣ Get vendor-specific info
    try {
      let vendor = localStorage.getItem("vendor");
      const vendorDetails = await fetch(`${API_URL}/vendors/user/${vendor.user_id}`);
      vendorDetails = await vendorDetails.json();
      if (vendorDetails) {
        TimeStatus.textContent = `${vendorDetails.opening_time} - ${vendorDetails.closing_time}`;

        // 3️⃣ Get foods added by this vendor
        const foodRes = await fetch(`${API_URL}/foods/vendor/${vendorDetails.vendor_id}/`);
        if (foodRes.ok) {
          const foods = await foodRes.json();
          food_container.innerHTML = "";
          foods.forEach(food => {
            const div = document.createElement("div");
            div.classList.add("review-card");
            div.id = `food-${food.food_id}`;
            div.innerHTML = `
                    <img src="${food.food_image_url}" class="card-image"/>
                    <div class="card-info">
                        <p><strong>${food.food_name}</strong></p>
                        <p>${food.category}</p>
                        <button onclick="deleteFood(${food.food_id})" 
                            style="background:red;color:white;border:none;padding:5px;cursor:pointer;border-radius:4px;">Remove</button>
                    </div>
                `;
            food_container.appendChild(div);
          });
        }
      }

    } catch (error) {
      console.error("Vendor load error:", error);
      alert("Failed to load vendor profile ❌");
    }
  } catch (error) {
    console.error("Vendor load error:", error);
    alert("Failed to load vendor profile ❌");
  }
});

function logout() {
  localStorage.clear();
  window.location.href = "./login.html";
}
async function deleteFood(foodId) {
  if (!foodId || !confirm("Are you sure you want to delete this food item?")) return;

  try {
    const res = await fetch(`${API_URL}/foods/${foodId}/`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Delete failed");
    }

    alert("Food deleted successfully ✅");
    // Optionally remove row from table dynamically instead of reload
    const row = document.querySelector(`#foodTable button[data-id='${foodId}']`)?.closest("tr");
    if (row) row.remove();
  } catch (err) {
    console.error("Delete error:", err);
    alert(`Error deleting food ❌: ${err.message}`);
  }
}
