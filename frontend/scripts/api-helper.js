/**
 * SUPER ROBUST API helper for Annesana
 * Prevents [object Object] errors and handles non-JSON / 500 errors gracefully.
 */
const API_URL =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:8000/api'
        : '/api';

async function fetchAPI(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

    const headers = {
        'Accept': 'application/json',
        ...(options.headers || {})
    };

    const token = localStorage.getItem('token');
    if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, { ...options, headers });

        const contentType = response.headers.get('content-type');
        // Framework HTML error page anuppum
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // Handle HTML/Text errors from Vercel or Server
            const text = await response.text();
            const cleanText = text.replace(/<[^>]*>/g, '').substring(0, 150).trim();
            throw new Error(`Server returned non-JSON (${response.status}): ${cleanText || 'Check server logs'}`);
        }

        if (!response.ok) {
            console.error('API Error Response:', data);

            let message = 'An unknown error occurred';

            if (data.detail) {
                if (typeof data.detail === 'string') {
                    message = data.detail;
                } else if (Array.isArray(data.detail)) {
                    // Handle FastAPI validation errors
                    message = data.detail.map(err => {
                        const loc = err.loc ? err.loc.join('.') : 'field';
                        return `${loc}: ${err.msg}`;
                    }).join('; ');
                } else {
                    message = JSON.stringify(data.detail);
                }
            } else if (data.message || data.error) {
                const raw = data.message || data.error;
                message = typeof raw === 'string' ? raw : JSON.stringify(raw);
            } else {
                message = `Request failed with status ${response.status}`;
            }

            throw new Error(message);
        }

        return data;
    } catch (error) {
        // Final fallback: Ensure we always have a string message
        const finalMsg = error.message || String(error);
        if (finalMsg === '[object Object]') {
            console.error('Caught hidden object error:', error);
            throw new Error('An unexpected object error occurred. See console for details.');
        }
        throw new Error(finalMsg);
    }
}

/**
 * Robustly formats image URLs from the backend.
 * @param {string} rawUrl - The URL from the API.
 * @param {string} fallback - Fallback asset path.
 * @returns {string} - Formatted URL.
 */
function getImageUrl(rawUrl, fallback = '..assets/annesana.png') {
    if (!rawUrl) return fallback;
    if (rawUrl.startsWith('http')) return rawUrl;

    // Fix: If on localhost, prepend the API_URL (minus /api) to local paths
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const baseUrl = API_URL.replace('/api', '');
        return `${baseUrl}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
    }

    // Ensure leading slash for relative paths on production
    return rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl;
}
