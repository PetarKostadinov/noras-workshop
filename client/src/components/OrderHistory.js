import React, { useContext, useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import getError from '../util';
import LoadingComponent from '../helpersComponents/LoadingComponent';
import MessageComponent from '../helpersComponents/MessageComponent';
import { Store } from '../helpersComponents/Store';
import { fetchOrderHistory } from '../service/orderService';

const formatDate = (date) => date
    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
    : 'Not yet';

const formatPrice = (price) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
}).format(Number(price) || 0);

function OrderHistory() {
    const { state } = useContext(Store);
    const { userInfo } = state;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await fetchOrderHistory(userInfo.token);
                setOrders(data);
                setLoading(false);
            } catch (err) {
                setError(getError(err));
                setLoading(false);
            }
        };
        fetchData();
    }, [userInfo]);

    return (
        <section className="order-history-page">
            <Helmet>
                <title>Order history | Nora’s Atelier</title>
            </Helmet>

            <div className="order-history-shell">
                <header className="order-history-heading">
                    <div>
                        <span>Your account</span>
                        <h1>Order history</h1>
                        <p>Review your purchases and follow their payment and delivery status.</p>
                    </div>
                    {!loading && !error && orders.length > 0 && (
                        <div className="order-history-count">
                            <strong>{orders.length}</strong>
                            <span>{orders.length === 1 ? 'order' : 'orders'}</span>
                        </div>
                    )}
                </header>

                {loading ? (
                    <div className="order-history-feedback"><LoadingComponent /></div>
                ) : error ? (
                    <div className="order-history-feedback"><MessageComponent variant="danger">{error}</MessageComponent></div>
                ) : orders.length === 0 ? (
                    <div className="order-history-empty">
                        <div className="order-history-empty-icon"><i className="fas fa-shopping-bag" aria-hidden="true"></i></div>
                        <span>Your collection starts here</span>
                        <h2>No orders yet</h2>
                        <p>Explore handcrafted gifts and décor made for beautiful moments.</p>
                        <Button onClick={() => navigate('/search')}>
                            Browse the collection <i className="fas fa-arrow-right" aria-hidden="true"></i>
                        </Button>
                    </div>
                ) : (
                    <div className="order-history-list">
                        {orders.map((order) => (
                            <article className="order-history-card" key={order._id}>
                                <div className="order-history-main">
                                    <div className="order-history-icon" aria-hidden="true">
                                        <i className="fas fa-box-open"></i>
                                    </div>
                                    <div>
                                        <span className="order-history-label">Order</span>
                                        <h2>#{order._id.slice(-8).toUpperCase()}</h2>
                                        <p>Placed on {formatDate(order.createdAt)}</p>
                                    </div>
                                </div>

                                <div className="order-history-price">
                                    <span>Total</span>
                                    <strong>{formatPrice(order.totalPrice)}</strong>
                                </div>

                                <div className="order-history-statuses">
                                    <div>
                                        <span>Payment</span>
                                        <strong className={`order-status ${order.isPaid ? 'complete' : 'pending'}`}>
                                            <i className={order.isPaid ? 'fas fa-check-circle' : 'far fa-clock'} aria-hidden="true"></i>
                                            {order.isPaid ? `Paid · ${formatDate(order.paidAt)}` : 'Awaiting payment'}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Delivery</span>
                                        <strong className={`order-status ${order.isDelivered ? 'complete' : 'pending'}`}>
                                            <i className={order.isDelivered ? 'fas fa-check-circle' : 'fas fa-truck'} aria-hidden="true"></i>
                                            {order.isDelivered ? `Delivered · ${formatDate(order.deliveredAt)}` : 'In progress'}
                                        </strong>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    className="order-history-details"
                                    onClick={() => navigate(`/order/${order._id}`)}
                                    aria-label={`View details for order ${order._id}`}
                                >
                                    View details <i className="fas fa-arrow-right" aria-hidden="true"></i>
                                </Button>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default OrderHistory;
