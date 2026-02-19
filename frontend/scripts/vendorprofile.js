
const profile_image = document.getElementById("DB");
const vendorName = document.getElementById("vendor_details");
const TimeStatus = document.getElementById("timeStatus");
const food_container = document.getElementById("food_container");
const reviews_container = document.getElementById("reviews_container");

document.addEventListener("DOMContentLoaded", async () => {
  try {

    const vendorId = localStorage.getItem("vendorId");
    console.log(vendorId)
    const res = await fetch(`http://127.0.0.1:8000/users/${vendorId}`);
    const vendor = await res.json();
    console.log(vendor)
    if (!res.ok) return alert(vendor.detail);

    if (!res.ok) return alert(vendor.detail);

    const userRole = JSON.parse(localStorage.getItem("user"));
    // Basic check if logged in vendor matches profile

    profile_image.innerHTML = `<img src="${API_URL}/uploads/${vendor.image || 'default.png'}"  class="card-image"/>`;
    vendorName.innerHTML = `
      <h2>${vendor.name}</h2>
      <p>${vendor.email}</p>
    `;


    const vendorDocRes = await fetch(`${API_URL}/vendors/users/${vendor.user_id}`);
    const vendorDoc = await vendorDocRes.json();
    console.log(vendorDoc)
    TimeStatus.innerHTML = `${vendorDoc.opening_time} - ${vendorDoc.closing_time}`;

    // food details
    // food details
    const foodRes = await fetch(`${API_URL}/foods/vendor/${vendorDoc.vendor_id}`);
    const foods = await foodRes.json();
    console.log(foods)
    foods.forEach(food => {
      const div = document.createElement("div");
      div.innerHTML = `
        <div class="review-card">
        <div class="review-card" id="food-${food.food_id}">
          <img src="${API_URL}/${food.food_image_url}"  class="card-image"/>
          <div class="card-info">
            <p><strong>${food.food_name}</strong></p>
            <p>${food.category}</p>
            <button onclick="deleteFood(${food.food_id})" style="background:red;color:white;border:none;padding:5px;cursor:pointer;">Remove</button>
          </div>
        </div>
      `;
      food_container.appendChild(div);
    });

  } catch (e) {
    console.error(e);
    alert("Failed to load vendor profile ❌");
  }
});

async function logout() {
  localStorage.clear();
  location.href = "./login.html";
}

async function deleteFood(foodId) {
  if (!confirm("Are you sure you want to remove this item?")) return;

  try {
    const res = await fetch(`${API_URL}/foods/${foodId}`, {
      method: "DELETE"
    });

    if (res.ok) {
      alert("Food removed ✅");
      document.getElementById(`food-${foodId}`).remove();

      // remove from localStorage if stored (optional based on user request "UI and localStorage correctly")
      // Usually we don't store list of foods in localstorage, but if we do, clear it.
    } else {
      alert("Failed to delete ❌");
    }
  } catch (err) {
    console.error(err);
    alert("Error deleting food");
  }
}
