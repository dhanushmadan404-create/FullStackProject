// Using centralized api-helper.js (API_URL is already defined there)

// ---------------- GLOBAL STATE ----------------
let map = null;
let userLat = null;
let userLng = null;
let foodLat = null;
let foodLng = null;
let routingControl = null;

// Icons
let foodIcon, shopIcon, userIcon;

// ---------------- LOAD ALL FOOD LOCATIONS ----------------
async function loadAllFoodLocations() {
  try {
    const foods = await fetchAPI(`/foods/all`);

    foods.forEach(food => {
      if (food.latitude && food.longitude && map && shopIcon) {
        L.marker([food.latitude, food.longitude], { icon: shopIcon })
          .addTo(map)
          .bindPopup(`<b>${food.category}</b>`);
      }
    });
  } catch (err) {
    console.error("Error loading all food locations:", err);
  }
}

// ---------------- GET USER LOCATION ----------------
function getUserLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    position => {
      userLat = position.coords.latitude;
      userLng = position.coords.longitude;

      if (map) {
        map.setView([userLat, userLng], 15);

        if (userIcon) {
          L.marker([userLat, userLng], { icon: userIcon })
            .addTo(map)
            .bindPopup("You are here")
            .openPopup();
        }
      }

      tryRouting();
    },
    (err) => {
      console.warn("Geolocation error:", err);
      // Only alert if the user explicitly clicked the button, 
      // but since this runs on init, maybe just log.
    }
  );
}
// ---------------- GET FOOD ID FROM URL ----------------
const params = new URLSearchParams(window.location.search);
const foodId = Number(params.get("food_id"));

console.log(foodId)
// ---------------- FETCH FOOD LOCATION ----------------
async function loadFoodLocation() {
  if (!foodId) return;

  try {
    const food = await fetchAPI(`/foods/${foodId}`);
console.log(food)
    foodLat = food.latitude;
    foodLng = food.longitude;
  
    if (!foodLat || !foodLng) return;

    if (foodIcon) {
      L.marker([foodLat, foodLng], { icon: foodIcon })
        .addTo(map)
        .bindPopup(`<b>${food.category}</b>`)
        .openPopup();
    }

    tryRouting();
  } catch (err) {
    console.error("Error loading food location:", err);
  }
}

// ---------------- ROUTING ----------------
function tryRouting() {
  if (!userLat || !userLng || !foodLat || !foodLng || !map) return;

  if (routingControl) {
    map.removeControl(routingControl);
  }

  if (typeof L.Routing !== 'undefined') {
    routingControl = L.Routing.control({
      waypoints: [
        L.latLng(userLat, userLng),
        L.latLng(foodLat, foodLng),
      ],
      routeWhileDragging: false,
      lineOptions: {
        styles: [{ color: "blue", weight: 5 }],
      },
      createMarker: () => null, // hide default markers
    }).addTo(map);
  }
}


// ---------------- INIT ----------------
document.addEventListener("DOMContentLoaded", () => {
  // Check if L exists
  if (typeof L === 'undefined') {
    console.error("Leaflet (L) is not defined. Ensure map.html is loading the Leaflet library correctly.");
    return;
  }

  // 1. Init Map
  const mapElement = document.getElementById("map");
  if (!mapElement) return;

  map = L.map("map").setView([13.0827, 80.2707], 11);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 20 }).addTo(map);

  // 2. Init Icons
  foodIcon = L.icon({
    iconUrl: "../assets/food.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
  shopIcon = L.icon({
    iconUrl: "../assets/shop.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
  userIcon = L.icon({
    iconUrl: "../assets/3448609.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  // 3. Kick off location loading
  getUserLocation();
  loadFoodLocation();
  loadAllFoodLocations();

  // 4. Hook up the footer button if it exists
  const locationBtn = document.getElementById("getCurrent");
  if (locationBtn) {
    locationBtn.addEventListener("click", getUserLocation);
  }
});
