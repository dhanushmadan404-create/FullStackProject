// Using centralized api-helper.js for API_URL and fetchAPI

// ---------------------- Vendor Profile Script ----------------------
const profile_image = document.getElementById("DB");
const vendorName = document.getElementById("vendor_details");
const TimeStatus = document.getElementById("timeStatus");
const food_container = document.getElementById("food_container");

document.addEventListener("DOMContentLoaded", async () => {
  if (!localStorage.getItem("token")) return window.location.href = "./login.html";

  try {
    // 1️⃣ Get current user info
    const userData = await fetchAPI("/users/me");

    // Render profile info
    const imgUrl = getImageUrl(userData.image_url);
    profile_image.innerHTML = `<img src="${imgUrl}" class="card-image"/>`;
    vendorName.innerHTML = `
            <h2>${userData.name}</h2>
            <p>${userData.email}</p>
        `;

    // 2️⃣ Get vendor-specific info using user_id from verified /me response
    try {
      const vendorData = await fetchAPI(`/vendors/user/${userData.user_id}`);

      if (vendorData.exists) {
        // Keep vendor data in localStorage for other pages
        localStorage.setItem("vendor", JSON.stringify(vendorData));

        TimeStatus.textContent = `${vendorData.opening_time} - ${vendorData.closing_time}`;

        // 3️⃣ Get foods added by this vendor
        try {
          const foods = await fetchAPI(`/foods/vendor/${vendorData.vendor_id}`);
          food_container.innerHTML = "";

          if (foods.length === 0) {
            food_container.innerHTML = "<p>No food items added yet.</p>";
          } else {
            foods.forEach(food => {
              const div = document.createElement("div");
              div.classList.add("review-card");
              div.id = `food-${food.food_id}`;
              const foodImg = getImageUrl(food.food_image_url);
              div.innerHTML = `
                                <img src="${foodImg}" class="card-image"
                                 onerror="this.onerror=null; this.src='../../assets/default_vendor.png';"/>
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
        } catch (foodError) {
          console.error("Food load error:", foodError);
          food_container.innerHTML = "<p>Error loading food items.</p>";
        }
      } else {
        TimeStatus.textContent = "Vendor profile not found. Please register.";
      }
    } catch (vendorError) {
      console.error("Vendor load error:", vendorError);
      TimeStatus.textContent = "Error loading vendor details";
    }
  } catch (error) {
    console.error("Profile load error:", error);
    // Explicitly handle 401/unauthorized
    if (error.message.includes("401") || error.message.includes("Unauthorized")) {
      localStorage.clear();
      window.location.href = "./login.html";
    } else {
      alert("Failed to load profile ❌");
    }
  }
});

function logout() {
  localStorage.clear();
  window.location.href = "./login.html";
}

async function deleteFood(foodId) {
  if (!foodId || !confirm("Are you sure you want to delete this food item?")) return;

  try {
    await fetchAPI(`/foods/${foodId}`, {
      method: "DELETE"
    });

    alert("Food deleted successfully ✅");
    const element = document.getElementById(`food-${foodId}`);
    if (element) element.remove();

  } catch (err) {
    console.error("Delete error:", err);
    alert(`Error deleting food ❌: ${err.message}`);
  }
}
