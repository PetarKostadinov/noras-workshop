import React, { useContext, useEffect, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Store } from '../helpersComponents/Store';
import { getAdminCollection, updateOrderLifecycle } from '../service/adminService';
import { deleteProduct } from '../service/productService';
import getError from '../util';
import { useTranslation } from 'react-i18next';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const date = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });
const statusLabel = (status) => status?.replaceAll('_', ' ') || 'Unknown';

const pageCopy = {
    products: { eyebrow: 'Catalog management', title: 'Products', description: 'Review inventory, pricing, and product availability.' },
    orders: { eyebrow: 'Sales management', title: 'Orders', description: 'Review purchases, payment state, and fulfillment progress.' },
    users: { eyebrow: 'Account management', title: 'Users', description: 'Review registered customer and administrator accounts.' },
};

function AdminManagementPage({ collection }) {
    const { t } = useTranslation();
    const { state } = useContext(Store);
    const { userInfo } = state;
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedPage = Number.parseInt(searchParams.get('page'), 10);
    const page = Number.isFinite(requestedPage) ? Math.max(requestedPage, 1) : 1;
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState('');
    const [updatingId, setUpdatingId] = useState('');
    const copy = pageCopy[collection];
    const activeResult = result?.collection === collection ? result : null;
    const activeLoading = loading;

    const load = async (signal) => {
        setLoading(true);
        try {
            const data = await getAdminCollection(collection, page, userInfo.token, signal);
            setResult({ ...data, collection });
        } catch (error) {
            if (error.name !== 'AbortError') toast.error(getError(error));
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        load(controller.signal);
        return () => controller.abort();
        // load is intentionally scoped to the active collection and page.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collection, page, userInfo.token]);

    const deleteHandler = async (product) => {
        if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) return;
        setDeletingId(product._id);
        try {
            await deleteProduct(product._id, userInfo.token);
            toast.success('Product deleted successfully.');
            await load();
        } catch (error) {
            toast.error(getError(error));
        } finally {
            setDeletingId('');
        }
    };

    const setPage = (nextPage) => setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) });

    const updateOrder = async (order, action) => {
        let change = { action };
        if (action === 'ship') {
            const carrier = window.prompt('Shipping carrier (for example DHL or Speedy):');
            if (carrier === null) return;
            const trackingNumber = window.prompt('Tracking number:');
            if (trackingNumber === null) return;
            const trackingUrl = window.prompt('Tracking URL (optional):') || '';
            change = { action, carrier, trackingNumber, trackingUrl };
        } else if (action === 'cancel') {
            if (!window.confirm('Cancel this unpaid order and return its items to inventory?')) return;
            const reason = window.prompt('Cancellation reason (optional):') || '';
            change = { action, reason };
        } else if (action === 'record_refund') {
            if (!window.confirm('Continue only after the full refund has succeeded in Stripe or PayPal. This action only records that external refund.')) return;
            const providerRefundId = window.prompt('Stripe or PayPal refund reference:');
            if (providerRefundId === null) return;
            const reason = window.prompt('Refund reason (optional):') || '';
            change = { action, providerRefundId, reason };
        } else if (action === 'deliver' && !window.confirm('Mark this shipment as delivered?')) {
            return;
        }

        setUpdatingId(order._id);
        try {
            await updateOrderLifecycle(order._id, change, userInfo.token);
            toast.success('Order updated successfully.');
            await load();
        } catch (error) {
            toast.error(getError(error));
        } finally {
            setUpdatingId('');
        }
    };

    return (
        <section className="admin-management-page">
            <Helmet><title>{copy.title} | Nora's Workshop Admin</title></Helmet>
            <header className="admin-management-heading">
                <div><span>{t(copy.eyebrow)}</span><h1>{t(copy.title)}</h1><p>{t(copy.description)}</p></div>
                {collection === 'products' && <Link to="/create"><i className="fas fa-plus" aria-hidden="true"></i> {t('Add product')}</Link>}
            </header>

            <nav className="admin-section-nav" aria-label="Admin sections">
                <Link to="/admin/dashboard">{t('Overview')}</Link>
                <Link className={collection === 'products' ? 'active' : ''} to="/admin/productlist">{t('Products')}</Link>
                <Link className={collection === 'orders' ? 'active' : ''} to="/admin/orderlist">{t('Orders')}</Link>
                <Link className={collection === 'users' ? 'active' : ''} to="/admin/userlist">{t('Users')}</Link>
            </nav>

            <div className="admin-table-card">
                {activeLoading ? (
                    <div className="admin-table-feedback"><Spinner animation="border" /><span>{t('Loading {{name}}…', { name: t(copy.title).toLowerCase() })}</span></div>
                ) : !activeResult ? (
                    <div className="admin-table-feedback">{t('Unable to load this section.')}</div>
                ) : activeResult.items.length === 0 ? (
                    <div className="admin-table-feedback">{t('No {{name}} found.', { name: t(copy.title).toLowerCase() })}</div>
                ) : (
                    <div className="admin-table-scroll">
                        {collection === 'products' && <ProductsTable products={activeResult.items} deletingId={deletingId} onDelete={deleteHandler} t={t} />}
                        {collection === 'orders' && <OrdersTable orders={activeResult.items} updatingId={updatingId} onUpdate={updateOrder} t={t} />}
                        {collection === 'users' && <UsersTable users={activeResult.items} t={t} />}
                    </div>
                )}
            </div>

            {activeResult && activeResult.pages > 1 && (
                <div className="admin-pagination">
                    <Button variant="light" disabled={page === 1 || activeLoading} onClick={() => setPage(page - 1)}>{t('Previous')}</Button>
                    <span>{t('Page')} <strong>{activeResult.page}</strong> {t('of')} {activeResult.pages} · {activeResult.count} {t('total')}</span>
                    <Button variant="light" disabled={page === activeResult.pages || activeLoading} onClick={() => setPage(page + 1)}>{t('Next')}</Button>
                </div>
            )}
        </section>
    );
}

function ProductsTable({ products, deletingId, onDelete, t }) {
    return <table className="admin-data-table"><thead><tr><th>{t('Product')}</th><th>{t('Category')}</th><th>{t('Price')}</th><th>{t('Inventory')}</th><th><span className="visually-hidden">{t('Actions')}</span></th></tr></thead><tbody>{products.map((product) => <tr key={product._id}>
        <td><div className="admin-product-cell"><img src={product.image} alt="" loading="lazy" decoding="async" /><div><strong>{product.name}</strong><span>{product.slug}</span></div></div></td>
        <td>{product.category}</td><td>{currency.format(product.price)}</td>
        <td><span className={`admin-stock-pill ${product.countMany === 0 ? 'empty' : product.countMany <= 5 ? 'low' : ''}`}>{product.countMany === 0 ? 'Out of stock' : product.countMany}</span></td>
        <td><div className="admin-row-actions"><Link to={`/product/${product._id}/${product.slug}`}>{t('View / edit')}</Link><Button variant="link" disabled={deletingId === product._id} onClick={() => onDelete(product)}>{t(deletingId === product._id ? 'Deleting…' : 'Delete')}</Button></div></td>
    </tr>)}</tbody></table>;
}

function OrdersTable({ orders, updatingId, onUpdate, t }) {
    return <table className="admin-data-table"><thead><tr><th>{t('Order')}</th><th>{t('Customer')}</th><th>{t('Date')}</th><th>{t('Total')}</th><th>{t('Payment')}</th><th>{t('Fulfillment')}</th><th>{t('Actions')}</th></tr></thead><tbody>{orders.map((order) => <tr key={order._id}>
        <td><Link className="admin-id-link" to={`/order/${order._id}`}>#{order._id.slice(-8).toUpperCase()}</Link><small>{order.orderItems.length} {order.orderItems.length === 1 ? 'item' : 'items'}</small></td>
        <td><strong>{order.user?.username || 'Guest customer'}</strong><small>{order.user?.email || order.contactEmail}</small></td>
        <td>{date.format(new Date(order.createdAt))}</td><td>{currency.format(order.totalPrice)}</td>
        <td><span className={`admin-status ${order.paymentStatus}`}>{statusLabel(order.paymentStatus)}</span></td>
        <td><span className={`admin-status fulfillment-${order.fulfillmentStatus}`}>{statusLabel(order.fulfillmentStatus)}</span>{order.tracking?.trackingNumber && <small>{order.tracking.carrier}: {order.tracking.trackingNumber}</small>}</td>
        <td><OrderActions order={order} busy={updatingId === order._id} onUpdate={onUpdate} /></td>
    </tr>)}</tbody></table>;
}

function OrderActions({ order, busy, onUpdate }) {
    if (busy) return <Spinner size="sm" animation="border" aria-label="Updating order" />;
    if (!order.isPaid && order.fulfillmentStatus === 'awaiting_payment' && ['pending', 'failed'].includes(order.paymentStatus)) {
        return <Button size="sm" variant="outline-danger" onClick={() => onUpdate(order, 'cancel')}>Cancel</Button>;
    }
    if (order.paymentStatus === 'paid' && order.fulfillmentStatus === 'processing') {
        return <div className="admin-order-actions"><Button size="sm" variant="outline-primary" onClick={() => onUpdate(order, 'ship')}>Ship</Button><Button size="sm" variant="outline-danger" onClick={() => onUpdate(order, 'record_refund')}>Record refund</Button></div>;
    }
    if (order.fulfillmentStatus === 'shipped') {
        return <Button size="sm" variant="outline-success" onClick={() => onUpdate(order, 'deliver')}>Mark delivered</Button>;
    }
    return <span className="admin-no-action">—</span>;
}

function UsersTable({ users, t }) {
    return <table className="admin-data-table"><thead><tr><th>{t('User')}</th><th>{t('Email address')}</th><th>{t('Role')}</th><th>{t('Registered')}</th></tr></thead><tbody>{users.map((user) => <tr key={user._id}>
        <td><strong>{user.username}</strong><small>#{user._id.slice(-8).toUpperCase()}</small></td><td>{user.email}</td>
        <td><span className={`admin-role-pill ${user.isAdmin ? 'admin' : ''}`}>{t(user.isAdmin ? 'Administrator' : 'Customer account')}</span></td>
        <td>{date.format(new Date(user.createdAt))}</td>
    </tr>)}</tbody></table>;
}

export default AdminManagementPage;
