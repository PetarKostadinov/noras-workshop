import { parseResponse } from '../util';

export const getDashboardSummary = async (token, signal) => {
    const response = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
        signal,
    });
    return parseResponse(response, 'Unable to load the dashboard');
};

export const getAdminCollection = async (collection, page, token, signal) => {
    const response = await fetch(`/api/admin/${collection}?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
    });
    return parseResponse(response, `Unable to load ${collection}`);
};
