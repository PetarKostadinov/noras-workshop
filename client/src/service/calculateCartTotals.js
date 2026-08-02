export function calculateCartTotals(cart) {
    const round2 = (num) => Math.round(num * 100 + Number.EPSILON) / 100;
    const itemsPrice = round2(
        cart.cartItems.reduce((a, c) => a + c.quantity * c.price, 0)
    );
    const shippingPrice = itemsPrice > 100 ? 0 : 10;
    const taxPrice = round2(0.15 * itemsPrice);
    const totalPrice = round2(itemsPrice + shippingPrice + taxPrice);

    return { ...cart, itemsPrice, shippingPrice, taxPrice, totalPrice };
}
