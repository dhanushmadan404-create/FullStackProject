const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://127.0.0.1:8000/api' : '/api';
const category = "breakfast";

document.addEventListener("DOMContentLoaded", async () => {
  const cardContainer = document.getElementById("cardContainer");
  if (!cardContainer) return;

  try {
    const res = await fetch(`${API_URL}/foods/category/${category}`);
    const foods = await res.json();

    // Safety check: ensure foods is an array and not empty
    if (!Array.isArray(foods) || foods.length === 0) {
      cardContainer.innerHTML = `
                <div style="text-align:center; width:100%; margin-top:50px;">
                    <p>No foods found for ${category}. Check back later! 🍳</p>
                </div>`;
      return;
    }

    cardContainer.innerHTML = ""; // Clear loader if any
    foods.forEach(food => {
      const div = document.createElement("div");
      // Ensure absolute image path
      const imgUrl = food.food_image_url ? (food.food_image_url.startsWith('http') ? food.food_image_url : (food.food_image_url.startsWith('/') ? food.food_image_url : '/' + food.food_image_url)) : '../../assets/annesana.png';

      div.innerHTML = `
                <div class="card">
                    <div class="image_container">
                        <h2 class="food_name">${food.food_name}</h2>
                        <img
                            src="${imgUrl}"
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
      cardContainer.appendChild(div);
    });

  } catch (err) {
    console.error("Fetch Error:", err);
    cardContainer.innerHTML = "<p style='text-align:center;'>Failed to load records ❌</p>";
  }
});

window.foodloc = function (food_id) {
  if (!food_id) {
    alert("Food ID missing");
    return;
  }
  // Correct relative path from pages/categories/ to pages/map.html
  window.location.href = "../map.html?food_id=" + food_id;
};
