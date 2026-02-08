// Using centralized api-helper.js for API_URL, fetchAPI, and getImageUrl
// ---------------- GET category FROM URL ----------------
const params = new URLSearchParams(window.location.search);
const category = params.get("category") || "breakfast"; // Default to breakfast if null
const cate = category === "drinking" ? "Juice" : category;
// const category = "dinner";

document.addEventListener("DOMContentLoaded", async () => {
  const Cate = document.getElementById("Cate")
  Cate.innerHTML = `   <h1>${cate.toUpperCase()}</h1>
    <div class="section-title">TOP CATEGORIES</div>

    <div class="categories">
    
        <div onclick="window.location.href='category.html?category=dinner'" class="category">
          <img src="../assets/food_image/Categories/dinner.webp" alt="sorry_404-error" class="cat-img" /><b
            class="title">Dinner</b>
        </div>
      
     
        <div onclick="window.location.href='category.html?category=breakfast'" class="category">
          <img src="../assets/food_image/Categories/break_fast.jpg" alt="sorry_404-error" class="cat-img" /><b
            class="title">BreakFast</b>
        </div>
  
      
        <div onclick="window.location.href='category.html?category=drinking'" class="category">
          <img src="../assets/food_image/Categories/drinking.JPG" alt="sorry_404-error" class="cat-img" /><b
            class="title">Juice</b>
        </div>
  

        <div onclick="window.location.href='category.html?category=lunch'" class="category">
          <img src="../assets/food_image/Categories/lunch.avif" alt="sorry_404-error" class="cat-img" /><b
            class="title">Lunch</b>
        </div>
   
   
        <div onclick="window.location.href='category.html?category=snacks'" class="category">
          <img src="../assets/food_image/Categories/snacks.jpg" alt="sorry_404-error" class="cat-img" /><b
            class="title">Snacks</b>
        </div>
    
    </div>
`
  const cardContainer = document.getElementById("cardContainer");
  if (!cardContainer) return;

  try {
    const foods = await fetchAPI(`/foods/category/${category}`);

    if (!Array.isArray(foods) || foods.length === 0) {
      cardContainer.innerHTML = `
                <div style="text-align:center; width:100%; margin-top:50px;">
                    <p>No foods found for ${category}. Check back later! 🍛</p>
                </div>`;
      return;
    }

    cardContainer.innerHTML = "";
    foods.forEach(food => {
      const div = document.createElement("div");
      const imgUrl = getImageUrl(food.food_image_url, '../assets/annesana.png');

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
