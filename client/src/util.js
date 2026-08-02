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




