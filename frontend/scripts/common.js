
document.addEventListener("DOMContentLoaded", () => {
    checkLoginStatus();
});

function checkLoginStatus() {
    const user = localStorage.getItem("user");
    const loginBtn = document.getElementById("login");
    const profileBtn = document.getElementById("profile");

    // If login button doesn't exist, we can't do anything
    if (!loginBtn) return;

    if (user) {
        // user logged in
        loginBtn.style.display = "none";
        if (profileBtn) profileBtn.style.display = "inline-block";
    } else {
        // user not logged in
        loginBtn.style.display = "inline-block";
        if (profileBtn) profileBtn.style.display = "none";
    }
}



