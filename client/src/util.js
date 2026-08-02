export default function getError(error) {
    return error.response && error.response.data.message ? error.response.data.message : error.message;
}

export async function parseResponse(response, fallbackMessage) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.message || fallbackMessage || `Request failed (${response.status})`);
    }
    return data;
}

export function getSafeRedirect(search, fallback = '/') {
    const redirect = new URLSearchParams(search).get('redirect');
    if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
        return fallback;
    }
    return redirect;
}

export function getLoginUrl(pathname, search = '') {
    const destination = `${pathname}${search}`;
    return `/login?redirect=${encodeURIComponent(destination)}`;
}




