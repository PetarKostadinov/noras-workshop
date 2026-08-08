import axios from 'axios';
import React, { useContext, useEffect, useReducer, useState } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import getError from '../util';
import LoadingComponent from '../helpersComponents/LoadingComponent';
import MessageComponent from '../helpersComponents/MessageComponent';
import { Store } from '../helpersComponents/Store';
import { useTranslation } from 'react-i18next';
import { trackPurchase } from '../service/analyticsService';

const getAccessHeaders = (userInfo, guestToken) => guestToken
    ? { 'x-guest-order-token': guestToken }
    : { authorization: `Bearer ${userInfo.token}` };

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
    const { t, i18n } = useTranslation();
    const { id: orderId } = useParams();
    const { search } = useLocation();
    const { state } = useContext(Store);
    const { userInfo, guestOrderAccess } = state;
    const guestToken = guestOrderAccess[orderId];
    const hasOrderAccess = Boolean(userInfo?.token || guestToken);
    const [paypalConfigError, setPaypalConfigError] = useState('');
    const [paypalLoadAttempt, setPaypalLoadAttempt] = useState(0);
    const [checkingPayment, setCheckingPayment] = useState(false);
    const [startingCardPayment, setStartingCardPayment] = useState(false);
    const stripeReturnStatus = new URLSearchParams(search).get('stripe');
    const [{ loading, error, order, loadingPay, errorPay }, dispatch] = useReducer(reducer, {
        loading: true,
        order: {},
        error: '',
        successPay: false,
        loadingPay: false,
    });
    const [{ isPending, isRejected }, paypalDispatch] = usePayPalScriptReducer();

    useEffect(() => {
        trackPurchase(order);
    }, [order]);

    useEffect(() => {
        if (!hasOrderAccess) return dispatch({ type: 'FETCH_FAIL', payload: t('This guest order is not available in this browser.') });

        const fetchOrder = async () => {
            try {
                dispatch({ type: 'FETCH_REQUEST' });
                const { data } = await axios.get('/api/orders/' + orderId, {
                    headers: getAccessHeaders(userInfo, guestToken),
                });
                dispatch({ type: 'FETCH_SUCCESS', payload: data });
            } catch (err) {
                dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
            }
        };
        fetchOrder();
    }, [guestToken, hasOrderAccess, orderId, t, userInfo]);

    useEffect(() => {
        if (stripeReturnStatus !== 'success' || !order._id || order.isPaid || order.paymentMethod !== 'Card') return;

        const syncCardPayment = async () => {
            try {
                setCheckingPayment(true);
                const response = await axios.put(
                    '/api/orders/' + order._id + '/sync-stripe',
                    {},
                    { headers: getAccessHeaders(userInfo, guestToken) }
                );
                dispatch({ type: 'PAY_SUCCESS', payload: response.data.order });
                if (response.data.order.isPaid) toast.success('Card payment verified. Your order is confirmed.');
                else toast.info('Your card payment is still being confirmed.');
            } catch (err) {
                toast.error(getError(err));
            } finally {
                setCheckingPayment(false);
            }
        };
        syncCardPayment();
    }, [guestToken, order._id, order.isPaid, order.paymentMethod, stripeReturnStatus, userInfo]);

    useEffect(() => {
        if (!order._id || order.isPaid || order.paymentMethod !== 'PayPal' || !hasOrderAccess) return;

        const loadPayPal = async () => {
            try {
                setPaypalConfigError('');
                const { data: clientId } = await axios.get('/api/keys/paypal');
                paypalDispatch({
                    type: 'resetOptions',
                    value: { 'client-id': clientId, currency: 'USD' },
                });
                paypalDispatch({ type: 'setLoadingStatus', value: 'pending' });
            } catch (err) {
                setPaypalConfigError(getError(err));
            }
        };
        loadPayPal();
    }, [hasOrderAccess, order._id, order.isPaid, order.paymentMethod, paypalDispatch, paypalLoadAttempt]);

    const createPayPalOrder = async () => {
        const { data } = await axios.post(
            '/api/orders/' + order._id + '/paypal-order',
            {},
            { headers: getAccessHeaders(userInfo, guestToken) }
        );
        return data.id;
    };

    const approvePayPalOrder = async () => {
        try {
            dispatch({ type: 'PAY_REQUEST' });
            const response = await axios.put(
                '/api/orders/' + order._id + '/capture-paypal',
                {},
                { headers: getAccessHeaders(userInfo, guestToken) }
            );
            dispatch({ type: 'PAY_SUCCESS', payload: response.data.order });
            if (response.data.order.isPaid) {
                toast.success('Payment verified. Your order is confirmed.');
            } else {
                toast.info('Payment received. PayPal is reviewing the transaction.');
            }
        } catch (err) {
            const message = getError(err);
            dispatch({ type: 'PAY_FAIL', payload: message });
            toast.error(message);
        }
    };

    const syncPayPalStatus = async () => {
        try {
            setCheckingPayment(true);
            const response = await axios.put(
                '/api/orders/' + order._id + '/sync-paypal',
                {},
                { headers: getAccessHeaders(userInfo, guestToken) }
            );
            dispatch({ type: 'PAY_SUCCESS', payload: response.data.order });
            if (response.data.order.isPaid) {
                toast.success('Payment verified. Your order is confirmed.');
            } else {
                toast.info('Payment is still under PayPal review.');
            }
        } catch (err) {
            toast.error(getError(err));
        } finally {
            setCheckingPayment(false);
        }
    };

    const startCardCheckout = async () => {
        try {
            setStartingCardPayment(true);
            const response = await axios.post(
                '/api/orders/' + order._id + '/stripe-checkout',
                {},
                { headers: getAccessHeaders(userInfo, guestToken) }
            );
            window.location.assign(response.data.url);
        } catch (err) {
            toast.error(getError(err));
            setStartingCardPayment(false);
        }
    };

    if (loading) {
        return <div className="order-state"><LoadingComponent /></div>;
    }

    if (error) {
        return <div className="order-state"><MessageComponent variant="danger">{error}</MessageComponent></div>;
    }

    const placedDate = order.createdAt
        ? new Intl.DateTimeFormat(i18n.language === 'bg' ? 'bg-BG' : 'en-US', { dateStyle: 'long' }).format(new Date(order.createdAt))
        : '';
    const paymentProvider = order.paymentMethod === 'Card' ? 'Stripe' : 'PayPal';

    return (
        <section className="order-page">
            <Helmet><title>Order confirmation | Nora’s Workshop</title></Helmet>

            <div className="order-success-banner">
                <div className="order-success-icon">
                    <i className={order.isPaid ? 'fas fa-check' : 'far fa-clock'} aria-hidden="true"></i>
                </div>
                <div>
                    <span>{t(order.isPaid ? 'Thank you for your order' : order.paymentStatus === 'processing' ? 'Payment submitted' : 'Order saved securely')}</span>
                    <h1>{t(order.isPaid ? 'Your order is confirmed' : order.paymentStatus === 'processing' ? 'Payment is under review' : 'Complete payment to confirm')}</h1>
                    <p>{order.isPaid
                        ? 'We’ll begin preparing your handmade pieces with care.'
                        : order.paymentStatus === 'processing'
                            ? `${paymentProvider} is reviewing the transaction. We’ll confirm the order as soon as payment clears.`
                            : 'Your order is awaiting payment and will not be prepared until payment is confirmed.'}</p>
                </div>
                <Link to="/search">{t('Continue shopping')}</Link>
            </div>

            <div className="order-meta">
                <div><span>{t('Order number')}</span><strong>{order._id}</strong></div><div><span>{t('Order date')}</span><strong>{placedDate}</strong></div><div><span>{t('Total')}</span><strong>{'$' + order.totalPrice.toFixed(2)}</strong></div>
            </div>

            <div className="order-layout">
                <div className="order-content">
                    <section className="order-detail-card">
                        <div className="order-detail-heading">
                            <span className="order-detail-icon"><i className="fas fa-truck" aria-hidden="true"></i></span>
                            <div><span>{t('Delivery')}</span><h2>{t('Shipping details')}</h2></div>
                            <span className={'order-status ' + (order.isDelivered ? 'complete' : 'pending')}>
                                {t(order.isDelivered ? 'Delivered' : order.isPaid ? 'Preparing' : 'Awaiting payment')}
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
                            <div><span>{t('Payment')}</span><h2>{order.paymentMethod}</h2></div>
                            <span className={'order-status ' + (order.isPaid ? 'complete' : 'attention')}>
                                {t(order.isPaid ? 'Paid' : order.paymentStatus === 'processing' ? 'Under review' : 'Payment due')}
                            </span>
                        </div>
                        <p className="order-payment-copy">
                            {order.isPaid
                                ? 'Payment received on ' + new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(order.paidAt))
                                : order.paymentStatus === 'processing'
                                    ? `Payment was submitted successfully and is awaiting ${paymentProvider}’s final confirmation.`
                                    : `Complete your secure ${order.paymentMethod === 'Card' ? 'card' : 'PayPal'} payment from the order summary.`}
                        </p>
                    </section>

                    <section className="order-detail-card">
                        <div className="order-detail-heading">
                            <span className="order-detail-icon"><i className="fas fa-shopping-bag" aria-hidden="true"></i></span>
                            <div><span>{t('Your selection')}</span><h2>{t('Order items')}</h2></div>
                        </div>
                        <div className="order-items">
                            {order.orderItems.map((item) => {
                                const productUrl = '/product/' + item.product + '/' + item.slug;
                                return (
                                    <article className="order-item" key={item._id}>
                                        <Link to={productUrl}><img src={item.image} alt={item.name} /></Link>
                                        <div>
                                            <Link to={productUrl}><h3>{t(item.name)}</h3></Link><span>{t('Quantity {{count}}', { count: item.quantity })}</span>
                                        </div>
                                        <strong>{'$' + (item.price * item.quantity).toFixed(2)}</strong>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                </div>

                <aside className="order-summary-card">
                    <span>{t('Order summary')}</span><h2>{t(order.isPaid ? 'Payment complete' : order.paymentStatus === 'processing' ? 'Payment under review' : 'Complete payment')}</h2>
                    <div className="order-summary-row"><span>{t('Items')}</span><strong>{'$' + order.itemsPrice.toFixed(2)}</strong></div><div className="order-summary-row"><span>{t('Delivery')}</span><strong>{order.shippingPrice === 0 ? t('Free') : '$' + order.shippingPrice.toFixed(2)}</strong></div><div className="order-summary-row"><span>{t('Tax')}</span><strong>{'$' + order.taxPrice.toFixed(2)}</strong></div><div className="order-summary-total"><span>{t('Total')}</span><strong>{'$' + order.totalPrice.toFixed(2)}</strong></div>

                    {!order.isPaid && order.paymentMethod === 'PayPal' && (
                        <div className="order-paypal">
                            <p><i className="fas fa-lock" aria-hidden="true"></i> Secure payment powered by PayPal</p>
                            {order.paypalOrderId && ['processing', 'failed'].includes(order.paymentStatus) ? (
                                <div className="paypal-processing" role="status">
                                    <i className="far fa-clock" aria-hidden="true"></i>
                                    <div>
                                        <strong>Payment submitted</strong>
                                        <span>PayPal is reviewing the sandbox transaction. Do not pay again.</span>
                                        <button type="button" disabled={checkingPayment} onClick={syncPayPalStatus}>
                                            {checkingPayment ? 'Checking…' : 'Check payment status'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                            {paypalConfigError && <MessageComponent variant="warning">{paypalConfigError}</MessageComponent>}
                            {errorPay && <MessageComponent variant="danger">{errorPay}</MessageComponent>}
                            {isRejected && !paypalConfigError && (
                                <div className="paypal-load-error" role="alert">
                                    <i className="fas fa-exclamation-circle" aria-hidden="true"></i>
                                    <div>
                                        <strong>PayPal could not load</strong>
                                        <span>Allow PayPal in your browser’s privacy or shield settings, then try again.</span>
                                        <button type="button" onClick={() => setPaypalLoadAttempt((attempt) => attempt + 1)}>
                                            Retry PayPal
                                        </button>
                                    </div>
                                </div>
                            )}
                            {paypalConfigError || isRejected ? null : isPending || loadingPay ? (
                                <LoadingComponent />
                            ) : (
                                <PayPalButtons
                                    createOrder={createPayPalOrder}
                                    onApprove={approvePayPalOrder}
                                    onCancel={() => toast.info('Payment cancelled. You can complete it later from Order history.')}
                                    onError={(err) => {
                                        const message = getError(err) || 'PayPal could not start the payment. Please try again.';
                                        dispatch({ type: 'PAY_FAIL', payload: message });
                                        toast.error(message);
                                    }}
                                />
                            )}
                                </>
                            )}
                        </div>
                    )}

                    {!order.isPaid && order.paymentMethod === 'Card' && (
                        <div className="order-card-payment">
                            <p><i className="fas fa-lock" aria-hidden="true"></i> Secure card payment powered by Stripe</p>
                            {stripeReturnStatus === 'cancelled' && (
                                <MessageComponent variant="info">Card checkout was cancelled. Your order is saved and you can try again.</MessageComponent>
                            )}
                            <button type="button" disabled={startingCardPayment || checkingPayment} onClick={startCardCheckout}>
                                {checkingPayment ? 'Checking payment…' : startingCardPayment ? 'Opening secure checkout…' : 'Pay securely by card'}
                            </button>
                            <small>Visa and other supported debit or credit cards are processed on Stripe’s secure checkout page.</small>
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
                        <p><strong>Need help?</strong><a href="mailto:petar_vs@outlook.com">Contact the workshop</a></p>
                    </div>
                </aside>
            </div>
        </section>
    );
}

export default OrderFinalStep;
