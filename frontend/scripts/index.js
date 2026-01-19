const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://127.0.0.1:8000/api' : '/api';

/**
 * Robustly formats image URLs from the backend.
 * @param {string} rawUrl - The URL from the API.
 * @param {string} fallback - Fallback asset path.
 * @returns {string} - Formatted URL.
 */
function getImageUrl(rawUrl, fallback = './frontend/assets/annesana.png') {
    if (!rawUrl) return fallback;
    if (rawUrl.startsWith('http')) return rawUrl;
    // Ensure leading slash
    return rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl;
}

document.addEventListener("DOMContentLoaded", async () => {
    // We could make trending dynamic here if endpoints exist, 
    // but for now let's ensure existing images are robust if they were dynamic.
});
