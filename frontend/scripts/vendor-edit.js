const API_URL =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:8000/api'
        : '/api';
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
    setTimeout(() => map.invalidateSize(), 100); // Fix rendering
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

    try {
        // Fetch vendor details
        const res = await fetch(`${API_URL}/vendors/${vendorId}`);
        if (!res.ok) throw new Error("Failed to fetch vendor");
        currentVendorData = await res.json();

        // Pre-fill form
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

    // Validate Times
    if (!openTime || !closeTime) return alert("Select opening & closing time");
    // (Add detailed time validation if consistent with registration)

    const vendorId = currentVendorData.vendor_id;

    try {
        // 1. Update Vendor Details (PUT)
        const updateBody = {
            phone_number: parseInt(phone), // Schema says int
            cart_image_url: currentVendorData.cart_image_url, // Reuse existing path
            opening_time: openTime,
            closing_time: closeTime,
            user_id: currentVendorData.user_id
        };

        const updateRes = await fetch(`${API_URL}/vendors/${vendorId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateBody)
        });

        if (!updateRes.ok) {
            const err = await updateRes.json();
            throw new Error(err.detail || "Update failed");
        }

        // Utility to convert file to Base64
        function getBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        }

        // 2. Add New Foods (POST)
        const menuContainer = document.querySelector(".menu-list");
        const newFoods = [...menuContainer.children].map(item => item.textContent.trim());
        const imageInput = document.getElementById("image");
        const foodType = document.getElementById("foodType").value;

        if (newFoods.length > 0) {
            if (!imageInput.files[0]) return alert("Please upload an image for new foods.");
            if (!foodType) return alert("Please select a food type for new foods.");
            if (latitude === null || longitude === null) return alert("Please select a location for new foods.");

            const imageBase64 = await getBase64(imageInput.files[0]);

            for (const foodName of newFoods) {
                const fd = new FormData();
                fd.append("food_name", foodName);
                fd.append("category", foodType.toLowerCase());
                fd.append("latitude", latitude);
                fd.append("longitude", longitude);
                fd.append("vendor_id", vendorId);
                fd.append("image_base64", imageBase64);

                await fetch(`${API_URL}/foods`, {
                    method: "POST",
                    body: fd
                });
            }
        }

        alert("Profile Updated Successfully! ✅");
        window.location.href = "/pages/vendor-profile.html";

    } catch (err) {
        console.error(err);
        alert("Update failed: " + err.message);
    }
});




