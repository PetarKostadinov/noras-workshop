
import { parseResponse } from '../util';

export async function fetchProducts(page, pageSize, signal) {
    const response = await fetch(`/api/products/search?page=${page}&pageSize=${pageSize}`, { signal });
    return parseResponse(response, 'Unable to load products');
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

export const updateProductImages = async (id, images, token) => {
  const response = await fetch(`/api/products/${id}/images`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ images }),
  });
  return parseResponse(response, 'Unable to save product images');
};

export const deleteProduct = async (id, token) => {
  const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse(response, 'Unable to delete product');
}

export const fetchProduct = async (id) => {
  const response = await fetch(`/api/products/${id}`);
  return parseResponse(response, 'Unable to load product');
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
  return parseResponse(response, 'Unable to load categories');
}

