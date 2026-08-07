import React, { useContext, useEffect, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { Store } from '../helpersComponents/Store';
import { deleteProduct, fetchProduct } from '../service/productService';
import getError from '../util';
import LoadingComponent from '../helpersComponents/LoadingComponent';
import MessageComponent from '../helpersComponents/MessageComponent';
import Rating from '../helpersComponents/Rating';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function ProductScreen() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const { state, dispatch } = useContext(Store);
    const { cart, userInfo } = state;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [product, setProduct] = useState(null);
    const [adding, setAdding] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        let active = true;
        const loadProduct = async () => {
            setLoading(true);
            setError('');
            try {
                const result = await fetchProduct(id);
                if (!active) return;
                setProduct(result);
            } catch (err) {
                if (active) setError(getError(err));
            } finally {
                if (active) setLoading(false);
            }
        };
        loadProduct();
        return () => { active = false; };
    }, [id]);

    const addToCartHandler = async () => {
        setAdding(true);
        try {
            const exists = cart.cartItems.find((item) => item._id === product._id);
            const quantity = exists ? exists.quantity + 1 : 1;
            const latestProduct = await fetchProduct(product._id);
            if (latestProduct.countMany < quantity) {
                toast.error(`Only ${latestProduct.countMany} of “${product.name}” ${latestProduct.countMany === 1 ? 'is' : 'are'} currently available.`);
                return;
            }
            dispatch({ type: 'CART_ADD_ITEM', payload: { ...latestProduct, quantity } });
            navigate('/cart');
        } catch (err) {
            toast.error(getError(err, 'We couldn’t add this product to your cart. Please try again.'));
        } finally {
            setAdding(false);
        }
    };

    const deleteHandler = async () => {
        if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) return;
        setDeleting(true);
        try {
            await deleteProduct(product._id, userInfo.token);
            dispatch({ type: 'CART_REMOVE_ITEM', payload: product });
            toast.success('Product deleted successfully.');
            navigate('/admin/productlist');
        } catch (err) {
            toast.error(getError(err));
            setDeleting(false);
        }
    };

    if (loading) return <LoadingComponent />;
    if (error) return <MessageComponent variant="danger">{error}</MessageComponent>;
    if (!product) return null;

    const isAdmin = Boolean(userInfo?.isAdmin);
    const inStock = product.countMany > 0;
    const lowStock = inStock && product.countMany <= 5;

    return (
        <section className="product-detail-page">
            <Helmet><title>{t(product.name)} | Nora's Workshop</title></Helmet>

            <nav className="product-detail-breadcrumb" aria-label={t('Breadcrumb')}>
                <Link to="/">{t('Shop')}</Link><i className="fas fa-chevron-right" aria-hidden="true"></i><span>{t(product.name)}</span>
            </nav>

            {isAdmin && (
                <aside className="product-admin-bar">
                    <div><span className="product-admin-icon"><i className="fas fa-tools" aria-hidden="true"></i></span><div><strong>{t('Admin product view')}</strong><small>{t('Manage this listing without leaving the product page.')}</small></div></div>
                    <div className="product-admin-actions">
                        <Link to={`/${product._id}/editItem/${product.slug}`}><i className="fas fa-pen" aria-hidden="true"></i>{t('Edit product')}</Link>
                        <Button type="button" onClick={deleteHandler} disabled={deleting}>
                            {deleting ? <Spinner size="sm" animation="border" aria-hidden="true" /> : <i className="far fa-trash-alt" aria-hidden="true"></i>}{t(deleting ? 'Deleting…' : 'Delete product')}
                        </Button>
                    </div>
                </aside>
            )}

            <div className="product-detail-layout">
                <div className="product-detail-media"><img src={product.image} alt={t(product.name)} /></div>
                <div className="product-detail-content">
                    <span className="product-detail-category">{t(product.category)}</span>
                    <h1>{t(product.name)}</h1>
                    <div className="product-detail-rating"><Rating rating={product.rating} numReviews={product.numReviews} /></div>
                    <p className="product-detail-price">{currency.format(product.price)}</p>
                    <div className="product-detail-description"><h2>{t('About this piece')}</h2><p>{t(product.description)}</p></div>
                    <dl className="product-detail-meta">
                        <div><dt>{t('Crafted by')}</dt><dd>{product.brand}</dd></div>
                        <div><dt>{t('Availability')}</dt><dd className={!inStock ? 'unavailable' : lowStock ? 'low' : ''}><span></span>{!inStock ? t('Out of stock') : lowStock ? t('Only {{count}} left', { count: product.countMany }) : t('In stock')}</dd></div>
                    </dl>
                    <div className="product-detail-purchase">
                        <Button onClick={addToCartHandler} disabled={!inStock || adding}>
                            {adding ? <Spinner size="sm" animation="border" aria-hidden="true" /> : <i className="fas fa-shopping-bag" aria-hidden="true"></i>}
                            <span>{t(adding ? 'Adding…' : inStock ? 'Add to cart' : 'Out of stock')}</span>
                        </Button>
                        <p><i className="fas fa-lock" aria-hidden="true"></i>{t('Secure checkout with protected payments')}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default ProductScreen;
