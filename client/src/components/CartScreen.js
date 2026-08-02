import React, { useContext } from 'react';
import { Button } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Store } from '../helpersComponents/Store';
import { getProductById } from '../service/cartService';
import getError, { getLoginUrl } from '../util';
import { toast } from 'react-toastify';

function CartScreen() {
  const navigate = useNavigate();
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { cart: { cartItems }, userInfo } = state;
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const updateCartHandler = async (item, quantity) => {
    try {
      const data = await getProductById(item._id);
      if (data.countMany < quantity) {
        toast.error(`Only ${data.countMany} of “${item.name}” ${data.countMany === 1 ? 'is' : 'are'} currently available.`);
        return;
      }
      ctxDispatch({ type: 'CART_ADD_ITEM', payload: { ...item, quantity } });
    } catch (error) {
      toast.error(getError(error, 'We couldn’t update the cart. Please try again.'));
    }
  };

  const removeItemHandler = (item) => {
    ctxDispatch({ type: 'CART_REMOVE_ITEM', payload: item });
  };

  const checkoutHandler = () => {
    navigate(userInfo ? '/shipping' : getLoginUrl('/shipping'));
  };

  return (
    <section className="cart-page">
      <Helmet><title>Your cart | Nora’s Atelier</title></Helmet>

      <div className="cart-heading">
        <span>Your selection</span>
        <h1>Shopping cart</h1>
        <p>{itemCount === 0 ? 'Your cart is ready for something meaningful.' : itemCount + (itemCount === 1 ? ' item' : ' items') + ' saved for your occasion.'}</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <div className="cart-empty-icon"><i className="fas fa-shopping-bag" aria-hidden="true"></i></div>
          <h2>Your cart is empty</h2>
          <p>Discover handmade gifts and décor created for life’s special moments.</p>
          <Link to="/search" className="cart-shop-link">Explore the collection</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items" aria-label="Cart items">
            {cartItems.map((item) => {
              const productUrl = '/product/' + item._id + '/' + item.slug;
              return (
                <article className="cart-item" key={item._id}>
                  <Link to={productUrl} className="cart-item-image">
                    <img src={item.image} alt={item.name} />
                  </Link>
                  <div className="cart-item-details">
                    <span>{item.category || item.brand}</span>
                    <Link to={productUrl}><h2>{item.name}</h2></Link>
                    <button className="cart-remove-mobile" type="button" onClick={() => removeItemHandler(item)}>
                      Remove
                    </button>
                  </div>
                  <div className="cart-quantity" aria-label={'Quantity for ' + item.name}>
                    <Button variant="link" onClick={() => updateCartHandler(item, item.quantity - 1)} disabled={item.quantity === 1} aria-label="Decrease quantity">
                      <i className="fas fa-minus" aria-hidden="true"></i>
                    </Button>
                    <span>{item.quantity}</span>
                    <Button variant="link" onClick={() => updateCartHandler(item, item.quantity + 1)} disabled={item.quantity === item.countMany} aria-label="Increase quantity">
                      <i className="fas fa-plus" aria-hidden="true"></i>
                    </Button>
                  </div>
                  <strong className="cart-item-price">{'$' + (item.price * item.quantity).toFixed(2)}</strong>
                  <button className="cart-remove" type="button" onClick={() => removeItemHandler(item)} aria-label={'Remove ' + item.name}>
                    <i className="far fa-trash-alt" aria-hidden="true"></i>
                  </button>
                </article>
              );
            })}
          </div>

          <aside className="cart-summary">
            <span className="cart-summary-eyebrow">Order summary</span>
            <h2>Your total</h2>
            <div className="cart-summary-row">
              <span>Subtotal · {itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
              <strong>{'$' + subtotal.toFixed(2)}</strong>
            </div>
            <div className="cart-summary-row">
              <span>Delivery</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="cart-summary-total">
              <span>Total</span>
              <strong>{'$' + subtotal.toFixed(2)}</strong>
            </div>
            <Button type="button" onClick={checkoutHandler} className="cart-checkout">
              Continue to checkout
              <i className="fas fa-arrow-right" aria-hidden="true"></i>
            </Button>
            {!userInfo && (
              <div className="cart-account-note" role="note">
                <i className="fas fa-user-lock" aria-hidden="true"></i>
                <span><strong>Account required at checkout</strong>Your cart will stay saved while you sign in or create an account.</span>
              </div>
            )}
            <div className="cart-assurance">
              <span><i className="fas fa-lock" aria-hidden="true"></i> Secure checkout</span>
              <span><i className="fas fa-box" aria-hidden="true"></i> Carefully packaged</span>
            </div>
            <Link to="/search" className="cart-continue">Continue shopping</Link>
          </aside>
        </div>
      )}
    </section>
  );
}

export default CartScreen;
