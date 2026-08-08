import React, { useContext, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Store } from '../helpersComponents/Store';
import { fetchProduct } from '../service/productService';
import getError, { getLoginUrl } from '../util';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { trackCartEvent } from '../service/analyticsService';

function CartScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { cart: { cartItems }, userInfo } = state;
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  useEffect(() => {
    if (cartItems.length > 0) trackCartEvent('view_cart', cartItems);
  }, [cartItems]);

  const updateCartHandler = async (item, quantity) => {
    try {
      const data = await fetchProduct(item._id);
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
    trackCartEvent('remove_from_cart', [item]);
    ctxDispatch({ type: 'CART_REMOVE_ITEM', payload: item });
  };

  const checkoutHandler = () => {
    trackCartEvent('begin_checkout', cartItems);
    navigate(userInfo ? '/shipping' : getLoginUrl('/shipping'));
  };

  return (
    <section className="cart-page">
      <Helmet><title>Your cart | Nora’s Workshop</title></Helmet>

      <div className="cart-heading">
        <span>{t('Your selection')}</span>
        <h1>{t('Shopping cart')}</h1>
        <p>{itemCount === 0 ? t('Your cart is ready for something meaningful.') : t(itemCount === 1 ? '{{count}} item saved for your occasion.' : '{{count}} items saved for your occasion.', { count: itemCount })}</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="cart-empty">
          <div className="cart-empty-icon"><i className="fas fa-shopping-bag" aria-hidden="true"></i></div>
          <h2>{t('Your cart is empty')}</h2>
          <p>{t('Discover handmade gifts and décor created for life’s special moments.')}</p>
          <Link to="/search" className="cart-shop-link">{t('Explore the collection')}</Link>
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
                      {t('Remove')}
                    </button>
                  </div>
                  <div className="cart-quantity" aria-label={t('Quantity for {{name}}', { name: item.name })}>
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
            <span className="cart-summary-eyebrow">{t('Order summary')}</span>
            <h2>{t('Your total')}</h2>
            <div className="cart-summary-row">
              <span>{t('Subtotal')} · {t(itemCount === 1 ? '{{count}} item' : '{{count}} items', { count: itemCount })}</span>
              <strong>{'$' + subtotal.toFixed(2)}</strong>
            </div>
            <div className="cart-summary-row">
              <span>{t('Delivery')}</span>
              <span>{t('Calculated at checkout')}</span>
            </div>
            <div className="cart-summary-total">
              <span>{t('Total')}</span>
              <strong>{'$' + subtotal.toFixed(2)}</strong>
            </div>
            <Button type="button" onClick={checkoutHandler} className="cart-checkout">
              {t('Continue to checkout')}
              <i className="fas fa-arrow-right" aria-hidden="true"></i>
            </Button>
            {!userInfo && (
              <div className="cart-account-note" role="note">
                <i className="fas fa-user-lock" aria-hidden="true"></i>
                <span><strong>{t('Account required at checkout')}</strong>{t('Your cart will stay saved while you sign in or create an account.')}</span>
              </div>
            )}
            <div className="cart-assurance">
              <span><i className="fas fa-lock" aria-hidden="true"></i> {t('Secure checkout')}</span>
              <span><i className="fas fa-box" aria-hidden="true"></i> {t('Carefully packaged')}</span>
            </div>
            <div className="cart-policy-links"><Link to="/help/shipping">{t('Shipping information')}</Link><Link to="/help/returns">{t('Return policy')}</Link></div>
            <Link to="/search" className="cart-continue">{t('Continue shopping')}</Link>
          </aside>
        </div>
      )}
    </section>
  );
}

export default CartScreen;
