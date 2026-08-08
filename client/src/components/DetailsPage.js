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
import { trackCartEvent, trackEvent, toAnalyticsItem } from '../service/analyticsService';
import ProductReviews from './ProductReviews';
import RelatedProducts from './RelatedProducts';

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
    const [selectedImage, setSelectedImage] = useState('');
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
                setSelectedImage(result.image);
            } catch (err) {
                if (active) setError(getError(err));
            } finally {
                if (active) setLoading(false);
            }
        };
        loadProduct();
        return () => { active = false; };
    }, [id]);

    useEffect(() => {
        if (product) {
            trackEvent('view_item', {
                currency: 'USD',
                value: Number(product.price),
                items: [toAnalyticsItem(product)],
            });
        }
    }, [product]);

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
            trackCartEvent('add_to_cart', [{ ...latestProduct, quantity: 1 }]);
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
    const productImages = product.images?.length ? product.images : [product.image];
    const productDescription = t(product.description);
    const canonicalUrl = `${window.location.origin}/product/${product._id}/${product.slug}`;
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: t(product.name),
        image: productImages,
        description: productDescription,
        brand: { '@type': 'Brand', name: product.brand },
        category: t(product.category),
        ...(product.materials ? { material: product.materials } : {}),
        ...(product.dimensions ? { size: product.dimensions } : {}),
        offers: {
            '@type': 'Offer',
            priceCurrency: 'USD',
            price: Number(product.price).toFixed(2),
            availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
        ...(product.numReviews > 0 ? {
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: product.rating,
                reviewCount: product.numReviews,
            },
        } : {}),
    };

    return (
        <section className="product-detail-page">
            <Helmet>
                <title>{t(product.name)} | Nora's Workshop</title>
                <meta name="description" content={productDescription} />
                <link rel="canonical" href={canonicalUrl} />
                <meta property="og:type" content="product" />
                <meta property="og:title" content={`${t(product.name)} | Nora's Workshop`} />
                <meta property="og:description" content={productDescription} />
                <meta property="og:url" content={canonicalUrl} />
                <meta property="og:image" content={product.image} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${t(product.name)} | Nora's Workshop`} />
                <meta name="twitter:description" content={productDescription} />
                <meta name="twitter:image" content={product.image} />
                <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
            </Helmet>

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
                <div className="product-detail-gallery">
                    <div className="product-detail-media"><img src={selectedImage || product.image} alt={t(product.name)} loading="eager" decoding="async" /></div>
                    {productImages.length > 1 && (
                        <div className="product-detail-thumbnails" aria-label={t('Product images')}>
                            {productImages.map((image, index) => (
                                <button key={image} type="button" className={image === selectedImage ? 'active' : ''} onClick={() => setSelectedImage(image)} aria-label={t('View product image {{count}}', { count: index + 1 })} aria-pressed={image === selectedImage}>
                                    <img src={image} alt="" loading="lazy" decoding="async" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="product-detail-content">
                    <span className="product-detail-category">{t(product.category)}</span>
                    <h1>{t(product.name)}</h1>
                    <div className="product-detail-rating"><Rating rating={product.rating} numReviews={product.numReviews} /></div>
                    <p className="product-detail-price">{currency.format(product.price)}</p>
                    <div className="product-detail-description"><h2>{t('About this piece')}</h2><p>{t(product.description)}</p></div>
                    <dl className="product-detail-meta">
                        <div><dt>{t('Crafted by')}</dt><dd>{product.brand}</dd></div>
                        <div><dt>{t('Availability')}</dt><dd className={!inStock ? 'unavailable' : lowStock ? 'low' : ''}><span></span>{!inStock ? t('Out of stock') : lowStock ? t('Only {{count}} left', { count: product.countMany }) : t('In stock')}</dd></div>
                        {product.materials && <div><dt>{t('Materials')}</dt><dd>{product.materials}</dd></div>}
                        {product.dimensions && <div><dt>{t('Dimensions')}</dt><dd>{product.dimensions}</dd></div>}
                        {product.preparationTime && <div><dt>{t('Preparation time')}</dt><dd>{product.preparationTime}</dd></div>}
                    </dl>
                    <div className="product-detail-purchase">
                        <Button onClick={addToCartHandler} disabled={!inStock || adding}>
                            {adding ? <Spinner size="sm" animation="border" aria-hidden="true" /> : <i className="fas fa-shopping-bag" aria-hidden="true"></i>}
                            <span>{t(adding ? 'Adding…' : inStock ? 'Add to cart' : 'Out of stock')}</span>
                        </Button>
                        <p><i className="fas fa-lock" aria-hidden="true"></i>{t('Secure checkout with protected payments')}</p>
                        <div className="product-detail-policies"><Link to="/help/shipping">{t('Shipping information')}</Link><Link to="/help/returns">{t('Return policy')}</Link></div>
                    </div>
                </div>
            </div>

            <div className="product-detail-assurances" aria-label={t('Shopping reassurance')}>
                <article>
                    <span><i className="fas fa-box-open" aria-hidden="true"></i></span>
                    <div><h2>{t('Carefully packaged')}</h2><p>{t('Prepared with care for its journey to you.')}</p></div>
                </article>
                <article>
                    <span><i className="fas fa-truck" aria-hidden="true"></i></span>
                    <div><h2>{t('Free shipping over $100')}</h2><p><Link to="/help/shipping">{t('See delivery information')}</Link></p></div>
                </article>
                <article>
                    <span><i className="fas fa-shield-alt" aria-hidden="true"></i></span>
                    <div><h2>{t('Protected payment')}</h2><p>{t('Pay securely with PayPal or card.')}</p></div>
                </article>
            </div>

            <ProductReviews product={product} userInfo={userInfo} onProductChange={setProduct} />

            <RelatedProducts productId={product._id} />

            <aside className="product-detail-custom">
                <div>
                    <span>{t('Made for your moment')}</span>
                    <h2>{t('Looking for something personal?')}</h2>
                    <p>{t('Tell us about your gift, celebration, or studio idea and we’ll discuss what is possible.')}</p>
                </div>
                <div className="product-detail-custom-actions">
                    <a href={`mailto:petar_vs@outlook.com?subject=${encodeURIComponent(`Custom enquiry: ${product.name}`)}`}>{t('Ask about this piece')}</a>
                    <Link to="/about">{t('Discover our story')}</Link>
                </div>
            </aside>
        </section>
    );
}

export default ProductScreen;
