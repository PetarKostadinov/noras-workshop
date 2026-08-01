import axios from 'axios';
import React, { useContext, useEffect, useReducer } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import getError from '../util';
import LoadingComponent from '../helpersComponents/LoadingComponent';
import MessageComponent from '../helpersComponents/MessageComponent';
import { Store } from '../helpersComponents/Store';

function reducer(state, action) {
    switch (action.type) {
        case 'FETCH_REQUEST':
            return { ...state, loading: true, error: '' };
        case 'FETCH_SUCCESS':
            return { ...state, loading: false, order: action.payload, error: '' };
        case 'FETCH_FAIL':
            return { ...state, loading: false, error: action.payload };
        case 'PAY_REQUEST':
            return { ...state, loadingPay: true };
        case 'PAY_SUCCESS':
            return { ...state, loadingPay: false, successPay: true, order: action.payload };
        case 'PAY_FAIL':
            return { ...state, loadingPay: false, errorPay: action.payload };
        default:
            return state;
    }
}

function OrderFinalStep() {
    const { id: orderId } = useParams();
    const navigate = useNavigate();
    const { state } = useContext(Store);
    const { userInfo } = state;
    const [{ loading, error, order, loadingPay }, dispatch] = useReducer(reducer, {
        loading: true,
        order: {},
        error: '',
        successPay: false,
        loadingPay: false,
    });
    const [{ isPending }, paypalDispatch] = usePayPalScriptReducer();

    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
            return;
        }

        const fetchOrder = async () => {
            try {
                dispatch({ type: 'FETCH_REQUEST' });
                const { data } = await axios.get('/api/orders/' + orderId, {
                    headers: { authorization: 'Bearer ' + userInfo.token },
                });
                dispatch({ type: 'FETCH_SUCCESS', payload: data });
            } catch (err) {
                dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
            }
        };
        fetchOrder();
    }, [navigate, orderId, userInfo]);

    useEffect(() => {
        if (!order._id || order.isPaid || order.paymentMethod !== 'PayPal' || !userInfo) return;

        const loadPayPal = async () => {
            try {
                const { data: clientId } = await axios.get('/api/keys/paypal');
                paypalDispatch({
                    type: 'resetOptions',
                    value: { 'client-id': clientId, currency: 'USD' },
                });
                paypalDispatch({ type: 'setLoadingStatus', value: 'pending' });
            } catch (err) {
                toast.error('Unable to load PayPal');
            }
        };
        loadPayPal();
    }, [order._id, order.isPaid, order.paymentMethod, paypalDispatch, userInfo]);

    const createPayPalOrder = (data, actions) => (
        actions.order.create({ purchase_units: [{ amount: { value: order.totalPrice } }] })
    );

    const approvePayPalOrder = (data, actions) => (
        actions.order.capture().then(async (details) => {
            try {
                dispatch({ type: 'PAY_REQUEST' });
                const response = await axios.put(
                    '/api/orders/' + order._id + '/pay',
                    details,
                    { headers: { authorization: 'Bearer ' + userInfo.token } }
                );
                dispatch({ type: 'PAY_SUCCESS', payload: response.data.order });
                toast.success('Payment completed successfully');
            } catch (err) {
                const message = getError(err);
                dispatch({ type: 'PAY_FAIL', payload: message });
                toast.error(message);
            }
        })
    );

    if (loading) {
        return <div className="order-state"><LoadingComponent /></div>;
    }

    if (error) {
        return <div className="order-state"><MessageComponent variant="danger">{error}</MessageComponent></div>;
    }

    const placedDate = order.createdAt
        ? new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date(order.createdAt))
        : '';

    return (
        <section className="order-page">
            <Helmet><title>Order confirmation | Nora’s Atelier</title></Helmet>

            <div className="order-success-banner">
                <div className="order-success-icon"><i className="fas fa-check" aria-hidden="true"></i></div>
                <div>
                    <span>Thank you for your order</span>
                    <h1>Your order has been placed</h1>
                    <p>We’ll begin preparing your handmade pieces with care.</p>
                </div>
                <Link to="/search">Continue shopping</Link>
            </div>

            <div className="order-meta">
                <div><span>Order number</span><strong>{order._id}</strong></div>
                <div><span>Order date</span><strong>{placedDate}</strong></div>
                <div><span>Total</span><strong>{'$' + order.totalPrice.toFixed(2)}</strong></div>
            </div>

            <div className="order-layout">
                <div className="order-content">
                    <section className="order-detail-card">
                        <div className="order-detail-heading">
                            <span className="order-detail-icon"><i className="fas fa-truck" aria-hidden="true"></i></span>
                            <div><span>Delivery</span><h2>Shipping details</h2></div>
                            <span className={'order-status ' + (order.isDelivered ? 'complete' : 'pending')}>
                                {order.isDelivered ? 'Delivered' : 'Preparing'}
                            </span>
                        </div>
                        <div className="order-address">
                            <strong>{order.shippingInfo.fullName}</strong>
                            <span>{order.shippingInfo.address}</span>
                            <span>{order.shippingInfo.city}, {order.shippingInfo.postCode}</span>
                            <span>{order.shippingInfo.country}</span>
                        </div>
                    </section>

                    <section className="order-detail-card">
                        <div className="order-detail-heading">
                            <span className="order-detail-icon"><i className="fas fa-wallet" aria-hidden="true"></i></span>
                            <div><span>Payment</span><h2>{order.paymentMethod}</h2></div>
                            <span className={'order-status ' + (order.isPaid ? 'complete' : 'attention')}>
                                {order.isPaid ? 'Paid' : 'Payment due'}
                            </span>
                        </div>
                        <p className="order-payment-copy">
                            {order.isPaid
                                ? 'Payment received on ' + new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(order.paidAt))
                                : 'Complete your secure PayPal payment from the order summary.'}
                        </p>
                    </section>

                    <section className="order-detail-card">
                        <div className="order-detail-heading">
                            <span className="order-detail-icon"><i className="fas fa-shopping-bag" aria-hidden="true"></i></span>
                            <div><span>Your selection</span><h2>Order items</h2></div>
                        </div>
                        <div className="order-items">
                            {order.orderItems.map((item) => {
                                const productUrl = '/product/' + item.product + '/' + item.slug;
                                return (
                                    <article className="order-item" key={item._id}>
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

                <aside className="order-summary-card">
                    <span>Order summary</span>
                    <h2>{order.isPaid ? 'Payment complete' : 'Complete payment'}</h2>
                    <div className="order-summary-row"><span>Items</span><strong>{'$' + order.itemsPrice.toFixed(2)}</strong></div>
                    <div className="order-summary-row"><span>Delivery</span><strong>{order.shippingPrice === 0 ? 'Free' : '$' + order.shippingPrice.toFixed(2)}</strong></div>
                    <div className="order-summary-row"><span>Tax</span><strong>{'$' + order.taxPrice.toFixed(2)}</strong></div>
                    <div className="order-summary-total"><span>Total</span><strong>{'$' + order.totalPrice.toFixed(2)}</strong></div>

                    {!order.isPaid && order.paymentMethod === 'PayPal' && (
                        <div className="order-paypal">
                            <p><i className="fas fa-lock" aria-hidden="true"></i> Secure payment powered by PayPal</p>
                            {isPending || loadingPay ? (
                                <LoadingComponent />
                            ) : (
                                <PayPalButtons
                                    createOrder={createPayPalOrder}
                                    onApprove={approvePayPalOrder}
                                    onError={(err) => toast.error(getError(err))}
                                />
                            )}
                        </div>
                    )}

                    {order.isPaid && (
                        <div className="order-paid-message">
                            <i className="fas fa-check-circle" aria-hidden="true"></i>
                            <div><strong>Payment received</strong><span>Your order is being prepared.</span></div>
                        </div>
                    )}

                    <div className="order-help">
                        <i className="far fa-envelope" aria-hidden="true"></i>
                        <p><strong>Need help?</strong><a href="mailto:petar_vs@outlook.com">Contact the atelier</a></p>
                    </div>
                </aside>
            </div>
        </section>
    );
}

export default OrderFinalStep;
