document.addEventListener("DOMContentLoaded", () => {
    checkLoginStatus();
});

function checkLoginStatus() {
    const token = localStorage.getItem("token");
    const loginBtn = document.getElementById("login");
    const profileBtn = document.getElementById("profile");

    // If there is no login button on this page, we don't need to do anything
    if (!loginBtn) return;

    if (token) {
        // User is logged in
        loginBtn.style.display = "none";

        // Show profile button if it exists
        if (profileBtn) {
            profileBtn.style.display = "inline-block";
        }
    } else {
        // User is NOT logged in
        loginBtn.style.display = "inline-block";

        // Hide profile button if it exists
        if (profileBtn) {
            profileBtn.style.display = "none";
        }
    }
}



