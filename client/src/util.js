const FRIENDLY_MESSAGES = [
    { pattern: /failed to fetch|network request failed|network response was not ok|load failed|econnrefused/i, message: 'We couldn’t reach the server. Check your connection and try again.' },
    { pattern: /invalid token|jwt expired|no token/i, message: 'Your session has expired. Please sign in again.' },
    { pattern: /admin access required|forbidden/i, message: 'You don’t have permission to perform this action.' },
    { pattern: /request entity too large|payload too large/i, message: 'That file is too large. Choose an image smaller than 5 MB.' },
    { pattern: /product not found|item not found/i, message: 'We couldn’t find that product. It may have been removed.' },
    { pattern: /user not found/i, message: 'We couldn’t find that account.' },
    { pattern: /order not found/i, message: 'We couldn’t find that order, or you may not have access to it.' },
    { pattern: /a record with that unique value already exists|e11000/i, message: 'That value is already in use. Try a different name, email, or URL slug.' },
    { pattern: /invalid image url/i, message: 'The selected image could not be used. Please choose another image.' },
    { pattern: /http error!? status:\s*404|request failed \(404\)/i, message: 'We couldn’t find what you requested. It may have been moved or removed.' },
    { pattern: /http error!? status:\s*5\d\d|request failed \(5\d\d\)/i, message: 'Something went wrong on our side. Please try again in a moment.' },
];

const addPunctuation = (message) => /[.!?…]$/.test(message) ? message : `${message}.`;

export default function getError(error, fallback = 'Something went wrong. Please try again.') {
    if (!error) return fallback;

    const status = error.status || error.response?.status;
    const rawMessage = error.response?.data?.message
        || error.data?.message
        || error.message
        || (typeof error === 'string' ? error : '');

    if (error.name === 'AbortError') return '';
    if (status === 401 && !/invalid email or password/i.test(rawMessage)) {
        return 'Your session has expired. Please sign in again.';
    }
    if (status === 403) return 'You don’t have permission to perform this action.';
    if (status >= 500 && !rawMessage) return 'Something went wrong on our side. Please try again in a moment.';

    const friendly = FRIENDLY_MESSAGES.find(({ pattern }) => pattern.test(rawMessage));
    if (friendly) return friendly.message;
    if (!rawMessage || rawMessage === 'Error') return fallback;
    return addPunctuation(rawMessage);
}

export async function parseResponse(response, fallbackMessage) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data.message || fallbackMessage || `Request failed (${response.status})`);
        error.status = response.status;
        error.data = data;
        throw error;
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
