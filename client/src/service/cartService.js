import { parseResponse } from '../util';

export async function getProductById(id) {
  const response = await fetch(`/api/products/${id}`);
  return parseResponse(response, 'Unable to load product');
}

