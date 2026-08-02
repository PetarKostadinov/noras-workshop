import React, { useContext, useEffect, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Store } from '../helpersComponents/Store';
import { getDashboardSummary } from '../service/adminService';
import getError from '../util';
import { useTranslation } from 'react-i18next';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const date = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

const statusLabel = (status) => status?.replaceAll('_', ' ') || 'Unknown';

function DashboardPage() {
    const { t } = useTranslation();
    const { state } = useContext(Store);
    const { userInfo } = state;
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        const loadDashboard = async () => {
            try {
                setDashboard(await getDashboardSummary(userInfo.token, controller.signal));
            } catch (error) {
                if (error.name !== 'AbortError') toast.error(getError(error));
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        loadDashboard();
        return () => controller.abort();
    }, [userInfo.token]);

    if (loading) {
        return <div className="admin-dashboard-loading"><Spinner animation="border" /><span>{t('Preparing your dashboard…')}</span></div>;
    }

    if (!dashboard) {
        return (
            <div className="admin-dashboard-empty">
                <h1>{t('Dashboard unavailable')}</h1><p>{t('The store summary could not be loaded. Check that the server is running and try again.')}</p><Button onClick={() => window.location.reload()}>{t('Try again')}</Button>
            </div>
        );
    }

    const { summary, lowStockProducts, recentOrders } = dashboard;
    const cards = [
        { label: 'Products', value: summary.productCount, icon: 'fa-box-open', tone: 'clay' },
        { label: 'Orders', value: summary.orderCount, icon: 'fa-receipt', tone: 'gold' },
        { label: 'Customers', value: summary.userCount, icon: 'fa-users', tone: 'blue' },
        { label: 'Paid revenue', value: currency.format(summary.paidRevenue), icon: 'fa-dollar-sign', tone: 'green' },
    ];

    return (
        <section className="admin-dashboard-page">
            <Helmet><title>Admin Dashboard | Nora's Atelier</title></Helmet>
            <div className="admin-dashboard-hero">
                <div>
                    <span>{t('Store overview')}</span><h1>{t('Welcome back, {{name}}', { name: userInfo.username })}</h1><p>{t('Here is what is happening at Nora’s Atelier.')}</p>
                </div>
                <Link className="admin-dashboard-primary-action" to="/create">
                    <i className="fas fa-plus" aria-hidden="true"></i> {t('Add product')}
                </Link>
            </div>

            <div className="admin-metric-grid">
                {cards.map((card) => (
                    <article className="admin-metric-card" key={card.label}>
                        <span className={`admin-metric-icon ${card.tone}`}><i className={`fas ${card.icon}`} aria-hidden="true"></i></span>
                        <div><span>{t(card.label)}</span><strong>{card.value}</strong></div>
                    </article>
                ))}
            </div>

            <div className="admin-attention-bar">
                <div><i className="far fa-clock" aria-hidden="true"></i><span><strong>{summary.pendingPaymentCount}</strong> {t('awaiting payment')}</span></div>
                <div><i className="fas fa-shipping-fast" aria-hidden="true"></i><span><strong>{summary.activeFulfillmentCount}</strong> {t('active fulfillments')}</span></div>
                <Link to="/search">{t('View storefront')} <i className="fas fa-arrow-right" aria-hidden="true"></i></Link>
            </div>

            <div className="admin-dashboard-grid">
                <section className="admin-dashboard-panel">
                    <div className="admin-panel-heading">
                        <div><span>{t('Inventory watch')}</span><h2>{t('Low-stock products')}</h2></div><Link to="/create">{t('Add new')}</Link>
                    </div>
                    {lowStockProducts.length ? (
                        <div className="admin-stock-list">
                            {lowStockProducts.map((product) => (
                                <Link to={`/product/${product._id}/${product.slug}`} className="admin-stock-row" key={product._id}>
                                    <img src={product.image} alt="" />
                                    <div><strong>{product.name}</strong><span>{currency.format(product.price)}</span></div>
                                    <span className={product.countMany === 0 ? 'sold-out' : ''}>{product.countMany === 0 ? 'Out of stock' : `${product.countMany} left`}</span>
                                </Link>
                            ))}
                        </div>
                    ) : <p className="admin-panel-empty">All products have more than five items in stock.</p>}
                </section>

                <section className="admin-dashboard-panel">
                    <div className="admin-panel-heading"><div><span>{t('Latest activity')}</span><h2>{t('Recent orders')}</h2></div></div>
                    {recentOrders.length ? (
                        <div className="admin-order-list">
                            {recentOrders.map((order) => (
                                <Link to={`/order/${order._id}`} className="admin-order-row" key={order._id}>
                                    <div className="admin-order-main">
                                        <strong>{order.user?.username || 'Deleted customer'}</strong>
                                        <span>{order.orderItems.length} {order.orderItems.length === 1 ? 'item' : 'items'} · {date.format(new Date(order.createdAt))}</span>
                                    </div>
                                    <div className="admin-order-meta">
                                        <strong>{currency.format(order.totalPrice)}</strong>
                                        <span className={`admin-status ${order.paymentStatus}`}>{statusLabel(order.paymentStatus)}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : <p className="admin-panel-empty">No orders have been placed yet.</p>}
                </section>
            </div>
        </section>
    );
}

export default DashboardPage;
