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
  if (!token) return window.location.href = "./login.html";

  try {
    // 1️⃣ Get current user info
    const res = await fetch(`${API_URL}/users/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      localStorage.clear();
      return window.location.href = "./login.html";
    }

    const userData = await res.json();

    // Render profile info
    // Using annesana.png as fallback since default.png is missing
    profile_image.innerHTML = `<img src="${userData.image_url || '../assets/annesana.png'}" class="card-image"/>`;
    vendorName.innerHTML = `
            <h2>${userData.name}</h2>
            <p>${userData.email}</p>
        `;

    // 2️⃣ Get vendor-specific info using user_id from verified /me response
    try {
      const vendorRes = await fetch(`${API_URL}/vendors/user/${userData.user_id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (vendorRes.ok) {
        const vendorData = await vendorRes.json();

        // Keep vendor data in localStorage for other pages
        localStorage.setItem("vendor", JSON.stringify(vendorData));

        TimeStatus.textContent = `${vendorData.opening_time} - ${vendorData.closing_time}`;

        // 3️⃣ Get foods added by this vendor
        const foodRes = await fetch(`${API_URL}/foods/vendor/${vendorData.vendor_id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (foodRes.ok) {
          const foods = await foodRes.json();
          food_container.innerHTML = "";

          if (foods.length === 0) {
            food_container.innerHTML = "<p>No food items added yet.</p>";
          } else {
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
      } else {
        TimeStatus.textContent = "Vendor profile not found. Please register.";
      }

    } catch (error) {
      console.error("Vendor load error:", error);
      TimeStatus.textContent = "Error loading vendor details";
    }
  } catch (error) {
    console.error("Profile load error:", error);
    alert("Failed to load profile ❌");
  }
});

function logout() {
  localStorage.clear();
  window.location.href = "./login.html";
}

async function deleteFood(foodId) {
  if (!foodId || !confirm("Are you sure you want to delete this food item?")) return;

  try {
    const res = await fetch(`${API_URL}/foods/${foodId}`, {
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
    const element = document.getElementById(`food-${foodId}`);
    if (element) element.remove();

  } catch (err) {
    console.error("Delete error:", err);
    alert(`Error deleting food ❌: ${err.message}`);
  }
}
