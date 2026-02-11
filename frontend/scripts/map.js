// --- API CONFIG ---
// --- API CONFIG ---
// API_BASE_URL is defined in common.js

// --- Global Variables ---
let map = null;
let userMarker = null;
let foodMarker = null;
let routingControl = null;

// Icons
const userIcon = L.icon({
  iconUrl: "../assets/3448609.png", // User icon
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const foodIcon = L.icon({
  iconUrl: "../assets/food.png",   // Targeted food icon
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const shopIcon = L.icon({
  iconUrl: "../assets/shop.png",   // Generic shop icon
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});


// --- Main Execution ---
document.addEventListener("DOMContentLoaded", () => {
  initMap();
  getUserLocation();

  // Check if we are viewing a specific food item
  const params = new URLSearchParams(window.location.search);
  const foodId = params.get("food_id");

  if (foodId) {
    loadFoodLocation(foodId);
  } else {
    // If not specific food, maybe show all?
    loadAllFoodLocations();
  }
});


// --- Initialize Map ---
function initMap() {
  const mapElement = document.getElementById("map");
  if (!mapElement) return;

  // Default view (Chennai)
  map = L.map("map").setView([13.0827, 80.2707], 11);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(map);
}


// --- Get User Location ---
function getUserLocation() {
  if (!navigator.geolocation) {
    console.warn("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // Save for routing
      window.userLat = lat;
      window.userLng = lng;

      if (map) {
        map.setView([lat, lng], 13);

        // Remove old marker if exists
        if (userMarker) map.removeLayer(userMarker);

        userMarker = L.marker([lat, lng], { icon: userIcon })
          .addTo(map)
          .bindPopup("You are here")
          .openPopup();

        // Try routing if we already have a destination
        if (window.foodLat && window.foodLng) {
          drawRoute();
        }
      }
    },
    (error) => {
      console.warn("Location access denied or failed:", error.message);
    }
  );
}


// --- Load Specific Food Location ---
async function loadFoodLocation(foodId) {
  try {
    const res = await fetch(`${API_BASE_URL}/foods/${foodId}`);
    if (!res.ok) return;
    const food = await res.json();

    if (food.latitude && food.longitude) {
      window.foodLat = food.latitude;
      window.foodLng = food.longitude;

      // Add Marker
      if (foodMarker) map.removeLayer(foodMarker);

      foodMarker = L.marker([food.latitude, food.longitude], { icon: foodIcon })
        .addTo(map)
        .bindPopup(`<b>${food.food_name}</b><br>${food.category}`)
        .openPopup();

      // Try routing
      if (window.userLat && window.userLng) {
        drawRoute();
      }
    }
  } catch (error) {
    console.error("Error loading food details:", error);
  }
}


// --- Load All Food Locations ---
async function loadAllFoodLocations() {
  try {
    const res = await fetch(`${API_BASE_URL}/foods/all`);
    if (!res.ok) return;
    const foods = await res.json();

    foods.forEach(food => {
      if (food.latitude && food.longitude) {
        L.marker([food.latitude, food.longitude], { icon: shopIcon })
          .addTo(map)
          .bindPopup(`<b>${food.food_name}</b><br>${food.category}`);
      }
    });
  } catch (error) {
    console.error("Error loading all foods:", error);
  }
}


// --- Draw Route ---
function drawRoute() {
  if (!map || !window.userLat || !window.foodLat) return;

  // Remove old route
  if (routingControl) {
    map.removeControl(routingControl);
  }

  // Check if Routing plugin is loaded
  if (typeof L.Routing !== 'undefined') {
    routingControl = L.Routing.control({
      waypoints: [
        L.latLng(window.userLat, window.userLng),
        L.latLng(window.foodLat, window.foodLng)
      ],
      routeWhileDragging: false,
      // draggableWaypoints: false,
      addWaypoints: false,
      lineOptions: {
        styles: [{ color: 'blue', opacity: 0.6, weight: 4 }]
      },
      createMarker: function () { return null; } // We already have custom markers
    }).addTo(map);
  }
}
