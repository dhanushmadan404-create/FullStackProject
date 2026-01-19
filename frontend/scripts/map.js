// Redundant API_URL removed - using centralized api-helper.js

// ---------------- MAP INIT ----------------
const map = L.map("map").setView([13.0827, 80.2707], 11);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 20,
}).addTo(map);

// ---------------- ICONS ----------------
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

const userIcon = L.icon({
  iconUrl: "../assets/3448609.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// ---------------- GLOBAL STATE ----------------
let userLat = null;
let userLng = null;
let foodLat = null;
let foodLng = null;
let routingControl = null;

// ---------------- GET FOOD ID FROM URL ----------------
const params = new URLSearchParams(window.location.search);
const foodId = Number(params.get("food_id"));
console.log("Food ID:", foodId);

// ---------------- FETCH FOOD LOCATION ----------------
async function loadFoodLocation() {
  if (!foodId) return;

  try {
    const res = await fetch(`${API_URL}/foods/${foodId}`);
    if (!res.ok) throw new Error("Food not found");

    const food = await res.json();

    foodLat = food.latitude;
    foodLng = food.longitude;

    if (!foodLat || !foodLng) return;

    L.marker([foodLat, foodLng], { icon: foodIcon })
      .addTo(map)
      .bindPopup(`<b>${food.food_name}</b>`)
      .openPopup();

    tryRouting();
  } catch (err) {
    console.error("Error loading food location:", err);
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

      map.setView([userLat, userLng], 15);

      L.marker([userLat, userLng], { icon: userIcon })
        .addTo(map)
        .bindPopup("You are here")
        .openPopup();

      tryRouting();
    },
    () => alert("Please enable location access")
  );
}

// ---------------- ROUTING ----------------
function tryRouting() {
  if (!userLat || !userLng || !foodLat || !foodLng) return;

  if (routingControl) {
    map.removeControl(routingControl);
  }

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

// ---------------- LOAD ALL FOOD LOCATIONS ----------------
async function loadAllFoodLocations() {
  try {
    const res = await fetch(`${API_URL}/foods/locations`);
    if (!res.ok) throw new Error("Failed to load food locations");

    const foods = await res.json();

    foods.forEach(food => {
      if (food.latitude && food.longitude) {
        L.marker([food.latitude, food.longitude], { icon: shopIcon })
          .addTo(map)
          .bindPopup(`<b>${food.food_name}</b>`);
      }
    });
  } catch (err) {
    console.error("Error loading all food locations:", err);
  }
}

// ---------------- INIT ----------------
document.addEventListener("DOMContentLoaded", () => {
  getUserLocation();
  loadFoodLocation();
  loadAllFoodLocations();
});
