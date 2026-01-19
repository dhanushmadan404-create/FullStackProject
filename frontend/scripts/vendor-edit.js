const API_URL =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:8000/api'
        : '/api';
const token = localStorage.getItem("token");
const userDetails = JSON.parse(localStorage.getItem("user_details") || "{}");
const vendorId = JSON.parse(localStorage.getItem("vendor") || "{}").vendor_id;

let list = [];
let menu = document.querySelector(".menu-list");
let inputList = document.getElementById("list");

// ---------------- MENU LIST ----------------
document.getElementById("send").addEventListener("click", () => {
    const value = inputList.value.trim();
    if (value === "") return;
    list.push(value);
    let food = document.createElement("b");
    food.innerHTML = `${value}<br/>`;
    menu.appendChild(food);
    inputList.value = "";
});

// ---------------- MAP ----------------
let mapCon = document.getElementById("mapContainer");
document.querySelector(".location-group").addEventListener("click", () => {
    mapCon.style.display = "block";
    setTimeout(() => map.invalidateSize(), 100);
});
document.getElementById("back").addEventListener("click", () => {
    mapCon.style.display = "none";
});
document.getElementById("save").addEventListener("click", () => {
    mapCon.style.display = "none";
});

const map = L.map("map").setView([13.0827, 80.2707], 11);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 20 }).addTo(map);

document.getElementById("location").addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        map.setView([lat, lon], 15);
    });
});

const foodIcon = L.icon({
    iconUrl: "../assets/3448609.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

let marker = null;
let latitude = null;
let longitude = null;

map.on("click", (e) => {
    if (marker) map.removeLayer(marker);
    marker = L.marker([e.latlng.lat, e.latlng.lng], { icon: foodIcon }).addTo(map);
    latitude = e.latlng.lat;
    longitude = e.latlng.lng;
});

// ---------------- LOAD EXISTING DATA ----------------
let currentVendorData = null;

document.addEventListener("DOMContentLoaded", async () => {
    if (!token) return location.href = "./login.html";

    try {
        const res = await fetch(`${API_URL}/vendors/${vendorId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch vendor");
        currentVendorData = await res.json();

        document.getElementById("number").value = currentVendorData.phone_number;
        document.getElementById("openTime").value = currentVendorData.opening_time;
        document.getElementById("closeTime").value = currentVendorData.closing_time;

    } catch (err) {
        console.error(err);
        alert("Error loading profile data");
    }
});

// ---------------- SUBMIT (UPDATE) ----------------
document.getElementById("vendorEditForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentVendorData) return;

    const phone = document.getElementById("number").value;
    const openTime = document.getElementById("openTime").value;
    const closeTime = document.getElementById("closeTime").value;
    const vId = currentVendorData.vendor_id;

    try {
        // 1. Update Vendor Details (FormData)
        const vendorForm = new FormData();
        vendorForm.append("phone_number", phone);
        vendorForm.append("opening_time", openTime);
        vendorForm.append("closing_time", closeTime);

        const updateRes = await fetch(`${API_URL}/vendors/${vId}`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` },
            body: vendorForm
        });

        if (!updateRes.ok) {
            const err = await updateRes.json();
            throw new Error(err.detail || "Update vendor details failed");
        }

        // 2. Add New Foods (POST)
        const menuContainer = document.querySelector(".menu-list");
        const newFoodItems = [...menuContainer.children].map(item => item.textContent.trim());
        const imageInput = document.getElementById("image");
        const foodType = document.getElementById("foodType").value;

        if (newFoodItems.length > 0) {
            if (!imageInput.files[0]) throw new Error("Please upload an image for new foods.");
            if (!foodType) throw new Error("Please select a food type for new foods.");
            if (latitude === null || longitude === null) throw new Error("Please select a location for new foods.");

            for (const foodName of newFoodItems) {
                const fd = new FormData();
                fd.append("food_name", foodName);
                fd.append("category", foodType.toLowerCase());
                fd.append("latitude", latitude);
                fd.append("longitude", longitude);
                fd.append("vendor_id", vId);
                fd.append("image", imageInput.files[0]); // ✅ Send file directly

                const foodRes = await fetch(`${API_URL}/foods`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: fd
                });

                if (!foodRes.ok) {
                    const err = await foodRes.json();
                    throw new Error(`Failed to add food '${foodName}': ${err.detail}`);
                }
            }
        }

        alert("Profile Updated Successfully! ✅");
        window.location.href = "./vendor-profile.html";

    } catch (err) {
        console.error(err);
        alert("Update failed: " + err.message);
    }
});
