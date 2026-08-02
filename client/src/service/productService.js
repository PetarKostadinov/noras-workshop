
import { parseResponse } from '../util';

export async function fetchProducts(page, limit) {
    const response = await fetch(`/api/products?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    const data = await response.json();
    return data;
  }
  
export const createProduct = async (userInfo, item) => {
    const response = await fetch('/api/products/create', {
      method: 'POST',
      body: JSON.stringify(item),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userInfo.token}`
      }
    });
    return parseResponse(response, 'Unable to create product');
}

export const uploadProductImage = async (token, file) => {
  const response = await fetch('/api/products/upload', {
    method: 'POST',
    headers: {
      'Content-Type': file.type,
      Authorization: `Bearer ${token}`,
    },
    body: file,
  });
  return parseResponse(response, 'Unable to upload image');
};

export const deleteProduct = async (id, token) => {
  const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(response, 'Unable to delete product');
}

export const fetchProduct = async (id) => {
  const response = await fetch(`/api/products/_id/${id}`);
  if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data;
}

export const updateItem = async (id, slug, data, token) => {
  const response = await fetch(`/api/products/${id}/editItem/${slug}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return parseResponse(response, 'Unable to update product');
};

export async function getCategories() {
  const response = await fetch(`/api/products/categories`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

export const getProduct = async (id) => {
  try {
    const response = await fetch(`/api/products/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching product:', error);
  }
};



