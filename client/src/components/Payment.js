import React, { useContext, useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import CheckoutSteps from './CheckoutSteps';
import { Store } from '../helpersComponents/Store';
import { useTranslation } from 'react-i18next';

function Payment() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { cart: { shippingInfo, paymentMethod, cartItems } } = state;
    const [selectedMethod, setSelectedMethod] = useState(paymentMethod || 'PayPal');
    const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

    useEffect(() => {
        if (cartItems.length === 0) navigate('/cart', { replace: true });
        else if (!shippingInfo.address) navigate('/shipping', { replace: true });
    }, [cartItems.length, navigate, shippingInfo.address]);

    const submitHandler = (event) => {
        event.preventDefault();
        ctxDispatch({ type: 'SAVE_PAYMENT_METHOD', payload: selectedMethod });
        localStorage.setItem('paymentMethod', selectedMethod);
        navigate('/order');
    };

    return (
        <section className="checkout-page">
            <Helmet><title>Payment method | Nora’s Atelier</title></Helmet>
            <CheckoutSteps step1 step2 step3 />

            <div className="checkout-heading">
                <span>{t('Secure checkout')}</span><h1>{t('Choose payment')}</h1><p>{t('Select how you would like to pay for your order.')}</p>
            </div>

            <div className="payment-layout">
                <div className="checkout-form-card payment-card">
                    <div className="checkout-form-heading">
                        <div className="checkout-form-icon"><i className="fas fa-wallet" aria-hidden="true"></i></div>
                        <div>
                            <h2>{t('Payment method')}</h2><p>{t('Your payment details are handled securely.')}</p>
                        </div>
                    </div>

                    <Form onSubmit={submitHandler} className="payment-form">
                        <label className={'payment-option' + (selectedMethod === 'PayPal' ? ' selected' : '')}>
                            <Form.Check
                                type="radio"
                                name="payment-method"
                                value="PayPal"
                                checked={selectedMethod === 'PayPal'}
                                onChange={(event) => setSelectedMethod(event.target.value)}
                                aria-label="Pay with PayPal"
                            />
                            <span className="payment-option-icon paypal"><i className="fab fa-paypal" aria-hidden="true"></i></span>
                            <span className="payment-option-copy">
                                <strong>PayPal</strong>
                                <small>{t('Review your order, then confirm it securely with PayPal.')}</small>
                            </span>
                            <i className="fas fa-check-circle payment-option-check" aria-hidden="true"></i>
                        </label>

                        <label className={'payment-option' + (selectedMethod === 'Card' ? ' selected' : '')}>
                            <Form.Check
                                type="radio"
                                name="payment-method"
                                value="Card"
                                checked={selectedMethod === 'Card'}
                                onChange={(event) => setSelectedMethod(event.target.value)}
                                aria-label="Pay by credit or debit card"
                            />
                            <span className="payment-option-icon"><i className="far fa-credit-card" aria-hidden="true"></i></span>
                            <span className="payment-option-copy">
                                <strong>{t('Credit or debit card')}</strong>
                                <small>{t('Pay securely with Visa or another supported card through Stripe.')}</small>
                            </span>
                            <i className="fas fa-check-circle payment-option-check" aria-hidden="true"></i>
                        </label>

                        <div className="payment-security-note">
                            <i className="fas fa-shield-alt" aria-hidden="true"></i>
                            <span>
                                <strong>{t('Protected payment')}</strong>
                                You’ll complete payment securely through {selectedMethod === 'Card' ? 'Stripe Checkout' : 'PayPal'}.
                            </span>
                        </div>

                        <div className="checkout-form-actions">
                            <Link to="/shipping"><i className="fas fa-arrow-left" aria-hidden="true"></i> {t('Back to delivery')}</Link>
                            <Button type="submit">
                                {t('Review order')}
                                <i className="fas fa-arrow-right" aria-hidden="true"></i>
                            </Button>
                        </div>
                    </Form>
                </div>

                <aside className="payment-summary">
                    <span>{t('Order snapshot')}</span>
                    <h2>{t(itemCount === 1 ? '{{count}} item in your cart' : '{{count}} items in your cart', { count: itemCount })}</h2>
                    <div className="payment-summary-products">
                        {cartItems.slice(0, 3).map((item) => (
                            <div key={item._id}>
                                <img src={item.image} alt="" />
                                <p><strong>{item.name}</strong><small>{t('Quantity {{count}}', { count: item.quantity })}</small></p>
                                <span>{'$' + (item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="payment-summary-total">
                        <span>{t('Cart subtotal')}</span>
                        <strong>{'$' + subtotal.toFixed(2)}</strong>
                    </div>
                    <p>{t('Shipping and tax are calculated in the final order review.')}</p>
                </aside>
            </div>
        </section>
    );
}

export default Payment;
