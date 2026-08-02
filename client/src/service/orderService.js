import { parseResponse } from '../util';

export const fetchOrderHistory = async (token) => {
    const response = await fetch('/api/orders/mine', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return parseResponse(response, 'Unable to load order history');
  };

  export async function createOrder(cart, userInfo) {
    const order = {
      orderItems: cart.cartItems,
      shippingInfo: cart.shippingInfo,
      paymentMethod: cart.paymentMethod,
      itemsPrice: cart.itemsPrice,
      shippingPrice: cart.shippingPrice,
      taxPrice: cart.taxPrice,
      totalPrice: cart.totalPrice,
    };
  
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userInfo.token}`,
      },
      body: JSON.stringify(order),
    });
  
    return parseResponse(response, 'Unable to create order');
  }
