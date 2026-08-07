
import { parseResponse } from '../util';

export async function loginUser(email, password) {
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    return parseResponse(response, 'Invalid email or password');
}


export async function register(username, email, password) {
  const response = await fetch('/api/users/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  });

  return parseResponse(response, 'Unable to create your account');
}

export const updateProfile = async (token, username, email, password) => {
    const response = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username,
        email,
        ...(password ? { password } : {}),
      })
    });
    return parseResponse(response, 'Unable to update profile');
};
