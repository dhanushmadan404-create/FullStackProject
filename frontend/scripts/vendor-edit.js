// Using centralized api-helper.js for API_URL and fetchAPI

const token = localStorage.getItem("token");
const vendorStr = localStorage.getItem("vendor");
const vendorId = vendorStr ? JSON.parse(vendorStr).vendor_id : null;

let list = [];
let menu = document.querySelector(".menu-list");
let inputList = document.getElementById("list");

// ---------------- MENU LIST ----------------
const sendBtn = document.getElementById("send");
if (sendBtn) {
    sendBtn.addEventListener("click", () => {
        const value = inputList.value.trim();
        if (value === "") return;
        list.push(value);
        let food = document.createElement("b");
        food.innerHTML = `${value}<br/>`;
        menu.appendChild(food);
        inputList.value = "";
    });
}

// ---------------- MAP ----------------
let mapCon = document.getElementById("mapContainer");
const locGroup = document.querySelector(".location-group");
if (locGroup) {
    locGroup.addEventListener("click", () => {
        mapCon.style.display = "block";
        setTimeout(() => map.invalidateSize(), 100);
    });
}

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
        if (marker) map.removeLayer(marker);
        marker = L.marker([lat, lon], { icon: foodIcon }).addTo(map);
        latitude = lat;
        longitude = lon;
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
    if (!vendorId) {
        alert("Vendor ID missing. Redirecting to profile.");
        return location.href = "./vendor-profile.html";
    }

    try {
        currentVendorData = await fetchAPI(`/vendors/${vendorId}`);

        document.getElementById("number").value = currentVendorData.phone_number || "";
        document.getElementById("openTime").value = currentVendorData.opening_time || "";
        document.getElementById("closeTime").value = currentVendorData.closing_time || "";

    } catch (err) {
        console.error(err);
        alert("Error loading profile data: " + err.message);
    }
});

// ---------------- SUBMIT (UPDATE) ----------------
const editForm = document.getElementById("vendorEditForm");
if (editForm) {
    editForm.addEventListener("submit", async (e) => {
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

            await fetchAPI(`/vendors/${vId}`, {
                method: "PUT",
                body: vendorForm
            });

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
                    if (!foodName) continue;
                    const fd = new FormData();
                    fd.append("food_name", foodName);
                    fd.append("category", foodType.toLowerCase());
                    fd.append("latitude", latitude);
                    fd.append("longitude", longitude);
                    fd.append("vendor_id", vId);
                    fd.append("image", imageInput.files[0]);

                    await fetchAPI(`/foods`, {
                        method: "POST",
                        body: fd
                    });
                }
            }

            alert("Profile Updated Successfully! ✅");
            window.location.href = "./vendor-profile.html";

        } catch (err) {
            console.error(err);
            alert("Update failed: " + err.message);
        }
    });
}
