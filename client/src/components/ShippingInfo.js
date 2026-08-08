import React, { useContext, useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import CheckoutSteps from './CheckoutSteps';
import { Store } from '../helpersComponents/Store';
import { useTranslation } from 'react-i18next';
import keepsakeBoxImage from '../assets/noras-workshop-keepsake-box.jpg';
import { trackCartEvent } from '../service/analyticsService';

function ShippingInfo() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { cart: { shippingInfo, cartItems }, userInfo } = state;
    const [email, setEmail] = useState(shippingInfo.email || userInfo?.email || '');
    const [fullName, setFullName] = useState(shippingInfo.fullName || '');
    const [address, setAddress] = useState(shippingInfo.address || '');
    const [city, setCity] = useState(shippingInfo.city || '');
    const [postCode, setPostCode] = useState(shippingInfo.postCode || '');
    const [country, setCountry] = useState(shippingInfo.country || '');

    useEffect(() => {
        if (cartItems.length === 0) navigate('/cart', { replace: true });
    }, [cartItems.length, navigate]);

    const submitHandler = (event) => {
        event.preventDefault();
        const details = {
            email: email.trim().toLowerCase(),
            fullName: fullName.trim(),
            address: address.trim(),
            city: city.trim(),
            postCode: postCode.trim(),
            country: country.trim(),
        };
        ctxDispatch({ type: 'SAVE_SHIPPING_INFO', payload: details });
        trackCartEvent('add_shipping_info', cartItems, { shipping_tier: 'Standard' });
        navigate('/payment');
    };

    return (
        <section className="checkout-page">
            <Helmet><title>Delivery details | Nora’s Workshop</title></Helmet>
            <CheckoutSteps step1 step2 />

            <div className="checkout-heading">
                <span>{t('Almost there')}</span><h1>{t('Delivery details')}</h1><p>{t('Tell us where your handmade pieces should be carefully delivered.')}</p>
            </div>

            <div className="shipping-layout">
                <div className="checkout-form-card">
                    <div className="checkout-form-heading">
                        <div className="checkout-form-icon"><i className="fas fa-map-marker-alt" aria-hidden="true"></i></div>
                        <div>
                            <h2>{t('Shipping address')}</h2><p>{t('All fields are required.')}</p>
                        </div>
                    </div>

                    <Form onSubmit={submitHandler} className="checkout-form">
                        <Form.Group controlId="shipping-email">
                            <Form.Label>{t('Email address')}</Form.Label>
                            <Form.Control type="email" value={email} autoComplete="email" placeholder={t('Email address')} onChange={(event) => setEmail(event.target.value)} required />
                            <Form.Text>{t('Used to identify your order during secure payment.')}</Form.Text>
                        </Form.Group>
                        <Form.Group controlId="shipping-full-name">
                            <Form.Label>{t('Full name')}</Form.Label>
                            <Form.Control
                                value={fullName}
                                autoComplete="name"
                                placeholder={t('First and last name')}
                                minLength={2}
                                onChange={(event) => setFullName(event.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group controlId="shipping-address">
                            <Form.Label>{t('Street address')}</Form.Label>
                            <Form.Control
                                value={address}
                                autoComplete="street-address"
                                placeholder={t('Street, building, apartment')}
                                minLength={5}
                                onChange={(event) => setAddress(event.target.value)}
                                required
                            />
                        </Form.Group>
                        <div className="checkout-form-row">
                            <Form.Group controlId="shipping-city">
                                <Form.Label>{t('City')}</Form.Label>
                                <Form.Control
                                    value={city}
                                    autoComplete="address-level2"
                                    placeholder={t('City')}
                                    onChange={(event) => setCity(event.target.value)}
                                    required
                                />
                            </Form.Group>
                            <Form.Group controlId="shipping-postcode">
                                <Form.Label>{t('Postal code')}</Form.Label>
                                <Form.Control
                                    value={postCode}
                                    autoComplete="postal-code"
                                    placeholder={t('Postal code')}
                                    onChange={(event) => setPostCode(event.target.value)}
                                    required
                                />
                            </Form.Group>
                        </div>
                        <Form.Group controlId="shipping-country">
                            <Form.Label>{t('Country')}</Form.Label>
                            <Form.Control
                                value={country}
                                autoComplete="country-name"
                                placeholder={t('Country')}
                                onChange={(event) => setCountry(event.target.value)}
                                required
                            />
                        </Form.Group>
                        <div className="checkout-form-actions">
                            <Link to="/cart"><i className="fas fa-arrow-left" aria-hidden="true"></i> {t('Back to cart')}</Link>
                            <Button type="submit">
                                {t('Continue to payment')}
                                <i className="fas fa-arrow-right" aria-hidden="true"></i>
                            </Button>
                        </div>
                    </Form>
                </div>

                <aside className="shipping-assurance">
                    <img src={keepsakeBoxImage} alt="" />
                    <div>
                        <span>{t('From our workshop to you')}</span><h2>{t('Prepared with care')}</h2><p>{t('Every order is checked and thoughtfully packaged before leaving the studio.')}</p>
                        <ul>
                            <li><i className="fas fa-check" aria-hidden="true"></i> {t('Secure address storage')}</li>
                            <li><i className="fas fa-check" aria-hidden="true"></i> {t('Carefully protected packaging')}</li>
                            <li><i className="fas fa-check" aria-hidden="true"></i> {t('Delivery confirmed at checkout')}</li>
                        </ul>
                    </div>
                </aside>
            </div>
        </section>
    );
}

export default ShippingInfo;
