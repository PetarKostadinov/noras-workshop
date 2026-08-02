import React, { useContext, useEffect, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Store } from '../helpersComponents/Store';
import { getAdminCollection } from '../service/adminService';
import { deleteProduct } from '../service/productService';
import getError from '../util';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const date = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });
const statusLabel = (status) => status?.replaceAll('_', ' ') || 'Unknown';

const pageCopy = {
    products: { eyebrow: 'Catalog management', title: 'Products', description: 'Review inventory, pricing, and product availability.' },
    orders: { eyebrow: 'Sales management', title: 'Orders', description: 'Review purchases, payment state, and fulfillment progress.' },
    users: { eyebrow: 'Account management', title: 'Users', description: 'Review registered customer and administrator accounts.' },
};

function AdminManagementPage({ collection }) {
    const { state } = useContext(Store);
    const { userInfo } = state;
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedPage = Number.parseInt(searchParams.get('page'), 10);
    const page = Number.isFinite(requestedPage) ? Math.max(requestedPage, 1) : 1;
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState('');
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

    return (
        <section className="admin-management-page">
            <Helmet><title>{copy.title} | Nora's Atelier Admin</title></Helmet>
            <header className="admin-management-heading">
                <div><span>{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.description}</p></div>
                {collection === 'products' && <Link to="/create"><i className="fas fa-plus" aria-hidden="true"></i> Add product</Link>}
            </header>

            <nav className="admin-section-nav" aria-label="Admin sections">
                <Link to="/admin/dashboard">Overview</Link>
                <Link className={collection === 'products' ? 'active' : ''} to="/admin/productlist">Products</Link>
                <Link className={collection === 'orders' ? 'active' : ''} to="/admin/orderlist">Orders</Link>
                <Link className={collection === 'users' ? 'active' : ''} to="/admin/userlist">Users</Link>
            </nav>

            <div className="admin-table-card">
                {activeLoading ? (
                    <div className="admin-table-feedback"><Spinner animation="border" /><span>Loading {collection}…</span></div>
                ) : !activeResult ? (
                    <div className="admin-table-feedback">Unable to load this section.</div>
                ) : activeResult.items.length === 0 ? (
                    <div className="admin-table-feedback">No {collection} found.</div>
                ) : (
                    <div className="admin-table-scroll">
                        {collection === 'products' && <ProductsTable products={activeResult.items} deletingId={deletingId} onDelete={deleteHandler} />}
                        {collection === 'orders' && <OrdersTable orders={activeResult.items} />}
                        {collection === 'users' && <UsersTable users={activeResult.items} />}
                    </div>
                )}
            </div>

            {activeResult && activeResult.pages > 1 && (
                <div className="admin-pagination">
                    <Button variant="light" disabled={page === 1 || activeLoading} onClick={() => setPage(page - 1)}>Previous</Button>
                    <span>Page <strong>{activeResult.page}</strong> of {activeResult.pages} · {activeResult.count} total</span>
                    <Button variant="light" disabled={page === activeResult.pages || activeLoading} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
            )}
        </section>
    );
}

function ProductsTable({ products, deletingId, onDelete }) {
    return <table className="admin-data-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Inventory</th><th><span className="visually-hidden">Actions</span></th></tr></thead><tbody>{products.map((product) => <tr key={product._id}>
        <td><div className="admin-product-cell"><img src={product.image} alt="" /><div><strong>{product.name}</strong><span>{product.slug}</span></div></div></td>
        <td>{product.category}</td><td>{currency.format(product.price)}</td>
        <td><span className={`admin-stock-pill ${product.countMany === 0 ? 'empty' : product.countMany <= 5 ? 'low' : ''}`}>{product.countMany === 0 ? 'Out of stock' : product.countMany}</span></td>
        <td><div className="admin-row-actions"><Link to={`/product/${product._id}/${product.slug}`}>View / edit</Link><Button variant="link" disabled={deletingId === product._id} onClick={() => onDelete(product)}>{deletingId === product._id ? 'Deleting…' : 'Delete'}</Button></div></td>
    </tr>)}</tbody></table>;
}

function OrdersTable({ orders }) {
    return <table className="admin-data-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Fulfillment</th></tr></thead><tbody>{orders.map((order) => <tr key={order._id}>
        <td><Link className="admin-id-link" to={`/order/${order._id}`}>#{order._id.slice(-8).toUpperCase()}</Link><small>{order.orderItems.length} {order.orderItems.length === 1 ? 'item' : 'items'}</small></td>
        <td><strong>{order.user?.username || 'Deleted user'}</strong><small>{order.user?.email || 'Account unavailable'}</small></td>
        <td>{date.format(new Date(order.createdAt))}</td><td>{currency.format(order.totalPrice)}</td>
        <td><span className={`admin-status ${order.paymentStatus}`}>{statusLabel(order.paymentStatus)}</span></td>
        <td><span className={`admin-status fulfillment-${order.fulfillmentStatus}`}>{statusLabel(order.fulfillmentStatus)}</span></td>
    </tr>)}</tbody></table>;
}

function UsersTable({ users }) {
    return <table className="admin-data-table"><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Registered</th></tr></thead><tbody>{users.map((user) => <tr key={user._id}>
        <td><strong>{user.username}</strong><small>#{user._id.slice(-8).toUpperCase()}</small></td><td>{user.email}</td>
        <td><span className={`admin-role-pill ${user.isAdmin ? 'admin' : ''}`}>{user.isAdmin ? 'Administrator' : 'Customer'}</span></td>
        <td>{date.format(new Date(user.createdAt))}</td>
    </tr>)}</tbody></table>;
}

export default AdminManagementPage;
