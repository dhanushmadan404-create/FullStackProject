// API_BASE_URL is defined in common.js

// ---------------- GLOBAL VARIABLES ----------------
let map = null;
let userMarker = null;
let foodMarker = null;
let routingControl = null;
// getUser
let userLat = null;
let userLng = null;
// getFoodId
let foodLat = null;
let foodLng = null;
// ---------------- ICONS ----------------
const userIcon = L.icon({
  iconUrl: "/frontend/assets/3448609.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const foodIcon = L.icon({
  iconUrl: "/frontend/assets/food.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const shopIcon = L.icon({
  iconUrl: "/frontend/assets/shop.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// ---------------- INITIALIZE MAP ----------------
function initMap() {
  const mapElement = document.getElementById("map");

  // Default Chennai View
  map = L.map("map").setView([13.0827, 80.2707], 11);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(map);
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

    foods.forEach((food) => {
      if (food.latitude && food.longitude) {
        L.marker([food.latitude, food.longitude], { icon: shopIcon })
          .addTo(map)
          .bindPopup(`<b>${food.food_name}</b><br>${food.category}`);
      }
    });
  } catch (error) {
    Toastify({
      text: `Error loading all foods`,
      duration: 5000,
      gravity: "top",
      position: "right",
      style: { background: "red" },
      close: true,
      stopOnFocus: true
    }).showToast();
  }
}

// ---------------- GET USER LOCATION ----------------
function getUserLocation() {
  if (!navigator.geolocation) {
    console.log("Geolocation not supported in this browser");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLat = position.coords.latitude;
      userLng = position.coords.longitude;

      map.setView([userLat, userLng], 13);

      if (userMarker) {
        map.removeLayer(userMarker);
      }

      userMarker = L.marker([userLat, userLng], { icon: userIcon })
        .addTo(map)
        .bindPopup("You are here")
        .openPopup();

      if (foodLat && foodLng) {
        drawRoute();
      }
    },

    (error) => {
      Toastify({
        text: `Location access denied:`,
        duration: 5000,
        gravity: "top",
        position: "right",
        style: { background: "red" },
        close: true,
        stopOnFocus: true
      }).showToast();
    },
  );
}

// ---------------- LOAD SINGLE FOOD LOCATION ----------------
async function loadFoodLocation(foodId) {
  try {
    const res = await fetch(`${API_BASE_URL}/foods/${foodId}`);
    if (!res.ok) {
      Toastify({
        text: `Failed to fetch food details`,
        duration: 5000,
        gravity: "top",
        position: "right",
        style: { background: "red" },
        close: true,
        stopOnFocus: true
      }).showToast();
      return;
    }

    const food = await res.json();

    if (!food.latitude || !food.longitude) {
      console.log("Food location not available");
      return;
    }

    foodLat = food.latitude;
    foodLng = food.longitude;

    if (foodMarker) {
      map.removeLayer(foodMarker);
    }

    foodMarker = L.marker([food.latitude, food.longitude], { icon: foodIcon })
      .addTo(map)
      .bindPopup(`<b>${food.food_name}</b><br>${food.category}`)
      .openPopup();

    if (userLat && userLng) {
      drawRoute();
    }
  } catch (error) {
    Toastify({
      text: `Error loading food location:`,
      duration: 5000,
      gravity: "top",
      position: "right",
      style: { background: "red" },
      close: true,
      stopOnFocus: true
    }).showToast();
  }
}

// ---------------- DRAW ROUTE ----------------
function drawRoute() {
  if (!map || userLat == null || foodLat == null) {
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
    waypoints: [L.latLng(userLat, userLng), L.latLng(foodLat, foodLng)],
    routeWhileDragging: false,
    addWaypoints: false,
    draggableWaypoints: false,
    lineOptions: {
      styles: [{ color: "blue", opacity: 0.7, weight: 4 }],
    },
    createMarker: () => null,
  }).addTo(map);
}

// ---------------- MAIN EXECUTION ----------------
document.addEventListener("DOMContentLoaded", () => {
  initMap();
  getUserLocation();

  const params = new URLSearchParams(window.location.search);
  const foodId = params.get("food_id");
  console.log(foodId);
  if (foodId) {
    loadFoodLocation(foodId);
  } else {
    loadAllFoodLocations();
  }
});
