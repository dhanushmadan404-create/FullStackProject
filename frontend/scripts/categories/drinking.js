const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://127.0.0.1:8000/api' : '/api';
const category = "drinking";

document.addEventListener("DOMContentLoaded", async () => {
  const card = document.getElementById("cardContainer");

  try {
    const res = await fetch(`${API_URL}/foods/category/${category}`);
    const foods = await res.json();

    if (!foods || foods.length === 0) {
      alert("Food data empty");
      return;
    }

    foods.forEach(food => {
      const div = document.createElement("div");
      div.innerHTML = `
        <div class="card">
          <div class="image_container">
            <h2 class="food_name">${food.food_name}</h2>
            <img
              src="${food.food_image_url}"
              class="card-image"
            />
          </div>
          <div class="card-buttons">
            <button class="find-btn" onclick="foodloc(${food.food_id})">
              FIND
            </button>
          </div>
        </div>
      `;
      card.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    alert("Failed ❌");
  }
});

function foodloc(food_id) {
  if (!food_id) {
    alert("Food ID missing");
    return;
  }

  window.location.href = `/pages/map.html?food_id=${food_id}`;
}






