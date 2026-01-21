// Using centralized api-helper.js for API_URL, fetchAPI, and getImageUrl

const category = "drinking";

document.addEventListener("DOMContentLoaded", async () => {
  const cardContainer = document.getElementById("cardContainer");
  if (!cardContainer) return;

  try {
    const foods = await fetchAPI(`/foods/category/${category}`);

    if (!Array.isArray(foods) || foods.length === 0) {
      cardContainer.innerHTML = `
                <div style="text-align:center; width:100%; margin-top:50px;">
                    <p>No foods found for ${category}. Check back later! 🥤</p>
                </div>`;
      return;
    }

    cardContainer.innerHTML = "";
    foods.forEach(food => {
      const div = document.createElement("div");
      const imgUrl = getImageUrl(food.food_image_url, '../../assets/annesana.png');
       console.log(food.food_id)
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
    cardContainer.innerHTML = `<p style='text-align:center;'>Failed to load records: ${err.message} ❌</p>`;
  }
});

window.foodloc = function (food_id) {
  if (!food_id) return alert("Food ID missing");
  window.location.href = "../map.html?food_id=" + food_id;
};
