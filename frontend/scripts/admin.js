// ---------------- GLOBALS ----------------
const API_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000/api'
    : '/api';
const token = localStorage.getItem("token");

// ---------------- LOGOUT ----------------
function logout() {
  localStorage.clear();
  location.href = "./login.html";
}

// ---------------- SHOW SECTION ----------------
function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(sectionId).classList.add("active");
}

// ---------------- LOAD VENDORS ----------------
async function loadVendors() {
  const tableBody = document.querySelector("#vendorTable tbody");
  tableBody.innerHTML = "";

  try {
    const res = await fetch(`${API_URL}/vendors`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch vendors");

    const vendors = await res.json();

    vendors.forEach(vendor => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${vendor.vendor_id}</td>
        <td>${vendor.user.name}</td>
        <td>${vendor.user.email}</td>
        <td>${vendor.phone_number || ''}</td>
        <td>${vendor.opening_time || ''}</td>
        <td>${vendor.closing_time || ''}</td>
        <td><button onclick="deleteVendor(${vendor.vendor_id}, this)">Delete ❌</button></td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error("Load vendors error:", err);
    alert(err.message);
  }
}

// ---------------- DELETE VENDOR ----------------
async function deleteVendor(vendorId, btn) {
  if (!confirm("Are you sure you want to delete this vendor?")) return;

  try {
    const res = await fetch(`${API_URL}/vendors/${vendorId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to delete vendor");
    }

    // Remove row from table
    btn.closest("tr").remove();
    alert("Vendor deleted successfully ✅");
  } catch (err) {
    console.error("Delete vendor error:", err);
    alert(err.message);
  }
  try {
    const foodRes = await fetch(`${API_URL}/foods/${vendorId}/foods`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to delete vendor");
    }

  } catch (err) {
    console.error("Delete vendor food error:", err);
    alert(err.message);
  }
};
// ---------------- DOM CONTENT LOADED ----------------
document.addEventListener("DOMContentLoaded", async () => {
  const role = localStorage.getItem("admin");
  const userDetails = JSON.parse(localStorage.getItem("user_details") || "{}");

  if (!token || role !== "admin") {
    alert("Unauthorized. Admin access required.");
    location.href = "./login.html";
    return;
  }

  document.getElementById("adminName").textContent = userDetails.name || "Admin";

  // Load vendors initially
  loadVendors();

  // Existing code for Foods section...
});

