// API_BASE_URL is defined in common.js

// ---------------- GLOBAL VARIABLES ----------------
let map = null;
let userMarker = null;
let foodMarker = null;
let routingControl = null;

// ---------------- ICONS ----------------
const userIcon = L.icon({
  iconUrl: "../assets/3448609.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const foodIcon = L.icon({
  iconUrl: "../assets/food.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const shopIcon = L.icon({
  iconUrl: "../assets/shop.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});


// ---------------- MAIN EXECUTION ----------------
document.addEventListener("DOMContentLoaded", () => {

  initMap();
  getUserLocation();

  const params = new URLSearchParams(window.location.search);
  const foodId = params.get("food_id");

  if (foodId) {
    loadFoodLocation(foodId);
  } else {
    loadAllFoodLocations();
  }
});


// ---------------- INITIALIZE MAP ----------------
function initMap() {

  const mapElement = document.getElementById("map");
  if (!mapElement) {
    console.log("Map container not found");
    return;
  }

  // Default Chennai View
  map = L.map("map").setView([13.0827, 80.2707], 11);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(map);
}


// ---------------- GET USER LOCATION ----------------
function getUserLocation() {

  if (!navigator.geolocation) {
    console.log("Geolocation not supported in this browser");
    return;
  }

  navigator.geolocation.getCurrentPosition(

    (position) => {

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      window.userLat = lat;
      window.userLng = lng;

      if (!map) return;

      map.setView([lat, lng], 13);

      if (userMarker) {
        map.removeLayer(userMarker);
      }

      userMarker = L.marker([lat, lng], { icon: userIcon })
        .addTo(map)
        .bindPopup("You are here")
        .openPopup();

      if (window.foodLat && window.foodLng) {
        drawRoute();
      }
    },

    (error) => {
      console.log("Location access denied:", error.message);
    }
  );
}


// ---------------- LOAD SINGLE FOOD LOCATION ----------------
async function loadFoodLocation(foodId) {

  try {

    const res = await fetch(`${API_BASE_URL}/foods/${foodId}`);
    if (!res.ok) {
      console.log("Failed to fetch food details");
      return;
    }

    const food = await res.json();

    if (!food.latitude || !food.longitude) {
      console.log("Food location not available");
      return;
    }

    window.foodLat = food.latitude;
    window.foodLng = food.longitude;

    if (foodMarker) {
      map.removeLayer(foodMarker);
    }

    foodMarker = L.marker(
      [food.latitude, food.longitude],
      { icon: foodIcon }
    )
      .addTo(map)
      .bindPopup(`<b>${food.food_name}</b><br>${food.category}`)
      .openPopup();

    if (window.userLat && window.userLng) {
      drawRoute();
    }

  } catch (error) {
    console.error("Error loading food location:", error);
  }
}


// ---------------- LOAD ALL FOOD LOCATIONS ----------------
async function loadAllFoodLocations() {

  try {

    const res = await fetch(`${API_BASE_URL}/foods/all`);
    if (!res.ok) {
      console.log("Failed to fetch all foods");
      return;
    }

    const foods = await res.json();

    if (!Array.isArray(foods)) {
      console.log("Invalid foods data");
      return;
    }

    foods.forEach(food => {

      if (food.latitude && food.longitude) {

        L.marker(
          [food.latitude, food.longitude],
          { icon: shopIcon }
        )
          .addTo(map)
          .bindPopup(`<b>${food.food_name}</b><br>${food.category}`);
      }
    });

  } catch (error) {
    console.error("Error loading all foods:", error);
  }
}


// ---------------- DRAW ROUTE ----------------
function drawRoute() {

  if (!map || !window.userLat || !window.foodLat) {
    console.log("Missing coordinates for routing");
    return;
  }

  if (routingControl) {
    map.removeControl(routingControl);
  }

  if (typeof L.Routing === "undefined") {
    console.log("Leaflet Routing plugin not loaded");
    return;
  }

  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(window.userLat, window.userLng),
      L.latLng(window.foodLat, window.foodLng),
    ],
    routeWhileDragging: false,
    addWaypoints: false,
    draggableWaypoints: false,
    lineOptions: {
      styles: [{ color: "blue", opacity: 0.7, weight: 4 }]
    },
    createMarker: () => null
  }).addTo(map);
}
