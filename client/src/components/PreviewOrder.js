import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Button } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import getError from '../util';
import CheckoutSteps from './CheckoutSteps';
import { Store } from '../helpersComponents/Store';
import { useTranslation } from 'react-i18next';
import { createOrder } from '../service/orderService';

function PreviewOrder() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { cart, userInfo } = state;
    const [placingOrder, setPlacingOrder] = useState(false);

    const totals = useMemo(() => {
        const round = (value) => Math.round(value * 100 + Number.EPSILON) / 100;
        const itemsPrice = round(cart.cartItems.reduce((total, item) => total + item.quantity * item.price, 0));
        const shippingPrice = itemsPrice > 100 ? 0 : 10;
        const taxPrice = round(itemsPrice * 0.15);
        return {
            itemsPrice,
            shippingPrice,
            taxPrice,
            totalPrice: round(itemsPrice + shippingPrice + taxPrice),
        };
    }, [cart.cartItems]);

    useEffect(() => {
        if (cart.cartItems.length === 0) {
            navigate('/cart', { replace: true });
        } else if (!cart.shippingInfo.address) {
            navigate('/shipping');
        } else if (!cart.paymentMethod) {
            navigate('/payment');
        }
    }, [cart.cartItems.length, cart.paymentMethod, cart.shippingInfo.address, navigate]);

    const placeOrderHandler = async () => {
        if (placingOrder) return;
        try {
            setPlacingOrder(true);
            const data = await createOrder({ ...cart, ...totals }, userInfo);
            ctxDispatch({ type: 'CART_CLEAR' });
            localStorage.removeItem('cartItems');
            navigate('/order/' + data.order._id);
        } catch (err) {
            toast.error(getError(err));
        } finally {
            setPlacingOrder(false);
        }
    };

    const itemCount = cart.cartItems.reduce((total, item) => total + item.quantity, 0);
    const address = cart.shippingInfo;

    return (
        <section className="checkout-page review-page">
            <Helmet><title>Review order | Nora’s Atelier</title></Helmet>
            <CheckoutSteps step1 step2 step3 step4 />

            <div className="checkout-heading">
                <span>{t('Final step')}</span><h1>{t('Review your order')}</h1><p>{t('Please check the details below before placing your order.')}</p>
            </div>

            <div className="review-layout">
                <div className="review-content">
                    <section className="review-section">
                        <div className="review-section-heading">
                            <div className="review-section-icon"><i className="fas fa-map-marker-alt" aria-hidden="true"></i></div>
                            <div><span>{t('Delivery')}</span><h2>{t('Shipping address')}</h2></div><Link to="/shipping">{t('Edit')}</Link>
                        </div>
                        <address className="review-address">
                            <strong>{address.fullName}</strong>
                            <span>{address.address}</span>
                            <span>{address.city}, {address.postCode}</span>
                            <span>{address.country}</span>
                        </address>
                    </section>

                    <section className="review-section">
                        <div className="review-section-heading">
                            <div className="review-section-icon"><i className="fas fa-wallet" aria-hidden="true"></i></div>
                            <div><span>{t('Payment')}</span><h2>{t('Payment method')}</h2></div><Link to="/payment">{t('Edit')}</Link>
                        </div>
                        <div className="review-payment">
                            <span className="review-payment-icon"><i className={cart.paymentMethod === 'Card' ? 'far fa-credit-card' : 'fab fa-paypal'} aria-hidden="true"></i></span>
                            <div>
                                <strong>{cart.paymentMethod}</strong>
                                <small>Your order will be saved as pending, then confirmed after secure payment.</small>
                            </div>
                        </div>
                    </section>

                    <section className="review-section review-items-section">
                        <div className="review-section-heading">
                            <div className="review-section-icon"><i className="fas fa-shopping-bag" aria-hidden="true"></i></div>
                            <div><span>{t('Your selection')}</span><h2>{t(itemCount === 1 ? '{{count}} item' : '{{count}} items', { count: itemCount })}</h2></div><Link to="/cart">{t('Edit')}</Link>
                        </div>
                        <div className="review-items">
                            {cart.cartItems.map((item) => {
                                const productUrl = '/product/' + item._id + '/' + item.slug;
                                return (
                                    <article className="review-item" key={item._id}>
                                        <Link to={productUrl}><img src={item.image} alt={item.name} /></Link>
                                        <div>
                                            <Link to={productUrl}><h3>{item.name}</h3></Link>
                                            <span>Quantity {item.quantity}</span>
                                        </div>
                                        <strong>{'$' + (item.price * item.quantity).toFixed(2)}</strong>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                </div>

                <aside className="review-summary">
                    <span>{t('Order summary')}</span><h2>{t('Ready for payment')}</h2><div className="review-summary-row"><span>{t('Items')}</span><strong>{'$' + totals.itemsPrice.toFixed(2)}</strong></div>
                    <div className="review-summary-row">
                        <span>{t('Delivery')}</span>
                        <strong>{totals.shippingPrice === 0 ? 'Free' : '$' + totals.shippingPrice.toFixed(2)}</strong>
                    </div>
                    <div className="review-summary-row"><span>{t('Tax')}</span><strong>{'$' + totals.taxPrice.toFixed(2)}</strong></div><div className="review-summary-total"><span>{t('Total')}</span><strong>{'$' + totals.totalPrice.toFixed(2)}</strong></div>
                    {totals.shippingPrice === 0 && (
                        <div className="review-free-delivery"><i className="fas fa-truck" aria-hidden="true"></i> Free delivery applied</div>
                    )}
                    <Button onClick={placeOrderHandler} disabled={placingOrder || cart.cartItems.length === 0} className="review-place-order">
                        {placingOrder ? (
                            <><span className="spinner-border spinner-border-sm" aria-hidden="true"></span> Creating secure order...</>
                        ) : (
                            <>{t('Continue to secure payment')} <i className="fas fa-arrow-right" aria-hidden="true"></i></>
                        )}
                    </Button>
                    <p className="review-terms">
                        Your order is confirmed only after payment is completed successfully.
                    </p>
                    <div className="review-trust">
                        <span><i className="fas fa-lock" aria-hidden="true"></i> Secure checkout</span>
                        <span><i className="fas fa-box" aria-hidden="true"></i> Carefully packaged</span>
                    </div>
                </aside>
            </div>
        </section>
    );
}

export default PreviewOrder;
