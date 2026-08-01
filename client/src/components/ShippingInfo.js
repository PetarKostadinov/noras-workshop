import React, { useContext, useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import CheckoutSteps from './CheckoutSteps';
import { Store } from '../helpersComponents/Store';

function ShippingInfo() {
    const navigate = useNavigate();
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { userInfo, cart: { shippingInfo } } = state;
    const [fullName, setFullName] = useState(shippingInfo.fullName || '');
    const [address, setAddress] = useState(shippingInfo.address || '');
    const [city, setCity] = useState(shippingInfo.city || '');
    const [postCode, setPostCode] = useState(shippingInfo.postCode || '');
    const [country, setCountry] = useState(shippingInfo.country || '');

    useEffect(() => {
        if (!userInfo) navigate('/login?redirect=/shipping');
    }, [navigate, userInfo]);

    const submitHandler = (event) => {
        event.preventDefault();
        const details = {
            fullName: fullName.trim(),
            address: address.trim(),
            city: city.trim(),
            postCode: postCode.trim(),
            country: country.trim(),
        };
        ctxDispatch({ type: 'SAVE_SHIPPING_INFO', payload: details });
        localStorage.setItem('shippingInfo', JSON.stringify(details));
        navigate('/payment');
    };

    return (
        <section className="checkout-page">
            <Helmet><title>Delivery details | Nora’s Atelier</title></Helmet>
            <CheckoutSteps step1 step2 />

            <div className="checkout-heading">
                <span>Almost there</span>
                <h1>Delivery details</h1>
                <p>Tell us where your handmade pieces should be carefully delivered.</p>
            </div>

            <div className="shipping-layout">
                <div className="checkout-form-card">
                    <div className="checkout-form-heading">
                        <div className="checkout-form-icon"><i className="fas fa-map-marker-alt" aria-hidden="true"></i></div>
                        <div>
                            <h2>Shipping address</h2>
                            <p>All fields are required.</p>
                        </div>
                    </div>

                    <Form onSubmit={submitHandler} className="checkout-form">
                        <Form.Group controlId="shipping-full-name">
                            <Form.Label>Full name</Form.Label>
                            <Form.Control
                                value={fullName}
                                autoComplete="name"
                                placeholder="First and last name"
                                minLength={2}
                                onChange={(event) => setFullName(event.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group controlId="shipping-address">
                            <Form.Label>Street address</Form.Label>
                            <Form.Control
                                value={address}
                                autoComplete="street-address"
                                placeholder="Street, building, apartment"
                                minLength={5}
                                onChange={(event) => setAddress(event.target.value)}
                                required
                            />
                        </Form.Group>
                        <div className="checkout-form-row">
                            <Form.Group controlId="shipping-city">
                                <Form.Label>City</Form.Label>
                                <Form.Control
                                    value={city}
                                    autoComplete="address-level2"
                                    placeholder="City"
                                    onChange={(event) => setCity(event.target.value)}
                                    required
                                />
                            </Form.Group>
                            <Form.Group controlId="shipping-postcode">
                                <Form.Label>Postal code</Form.Label>
                                <Form.Control
                                    value={postCode}
                                    autoComplete="postal-code"
                                    placeholder="Postal code"
                                    onChange={(event) => setPostCode(event.target.value)}
                                    required
                                />
                            </Form.Group>
                        </div>
                        <Form.Group controlId="shipping-country">
                            <Form.Label>Country</Form.Label>
                            <Form.Control
                                value={country}
                                autoComplete="country-name"
                                placeholder="Country"
                                onChange={(event) => setCountry(event.target.value)}
                                required
                            />
                        </Form.Group>
                        <div className="checkout-form-actions">
                            <Link to="/cart"><i className="fas fa-arrow-left" aria-hidden="true"></i> Back to cart</Link>
                            <Button type="submit">
                                Continue to payment
                                <i className="fas fa-arrow-right" aria-hidden="true"></i>
                            </Button>
                        </div>
                    </Form>
                </div>

                <aside className="shipping-assurance">
                    <img src="/images/handmade-keepsake-box.jpg" alt="" />
                    <div>
                        <span>From our atelier to you</span>
                        <h2>Prepared with care</h2>
                        <p>Every order is checked and thoughtfully packaged before leaving the studio.</p>
                        <ul>
                            <li><i className="fas fa-check" aria-hidden="true"></i> Secure address storage</li>
                            <li><i className="fas fa-check" aria-hidden="true"></i> Carefully protected packaging</li>
                            <li><i className="fas fa-check" aria-hidden="true"></i> Delivery confirmed at checkout</li>
                        </ul>
                    </div>
                </aside>
            </div>
        </section>
    );
}

export default ShippingInfo;
