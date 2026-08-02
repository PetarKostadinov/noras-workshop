import { parseResponse } from '../util';

const getProducts = async (options) => {
  const { page, category, query, price, rating, order } = options;
  const response = await fetch(
    `/api/products/search?page=${page}&query=${query}&category=${category}&price=${price}&rating=${rating}&order=${order}`
  );
  return parseResponse(response, 'Unable to load products');
};

const getCategories = async () => {
  const response = await fetch('/api/products/categories');
  return parseResponse(response, 'Unable to load categories');
};

export { getProducts, getCategories };
