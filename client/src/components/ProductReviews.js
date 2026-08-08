import React, { useState } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { createProductReview, deleteProductReview, fetchProduct } from '../service/productService';
import getError, { getLoginUrl } from '../util';
import Rating from '../helpersComponents/Rating';

function ProductReviews({ product, userInfo, onProductChange }) {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState('');
    const reviews = product.reviews || [];

    const refreshProduct = async () => onProductChange(await fetchProduct(product._id));

    const submitReview = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        try {
            await createProductReview(product._id, { rating, comment: comment.trim() }, userInfo.token);
            await refreshProduct();
            setComment('');
            setRating(5);
            toast.success(t('Thank you. Your review is now published.'));
        } catch (err) {
            toast.error(getError(err));
        } finally {
            setSubmitting(false);
        }
    };

    const removeReview = async (review) => {
        if (!window.confirm(t('Remove this review?'))) return;
        setDeletingId(review._id);
        try {
            await deleteProductReview(product._id, review._id, userInfo.token);
            await refreshProduct();
            toast.success(t('Review removed.'));
        } catch (err) {
            toast.error(getError(err));
        } finally {
            setDeletingId('');
        }
    };

    const date = new Intl.DateTimeFormat(i18n.language === 'bg' ? 'bg-BG' : 'en-US', { dateStyle: 'medium' });

    return (
        <section className="product-reviews" aria-labelledby="product-reviews-title">
            <div className="product-reviews-heading">
                <div><span>{t('Customer stories')}</span><h2 id="product-reviews-title">{t('Reviews')}</h2></div>
                <div className="product-reviews-summary"><strong>{product.numReviews ? product.rating.toFixed(1) : '—'}</strong><div><Rating rating={product.rating} /><span>{t('{{count}} published reviews', { count: product.numReviews })}</span></div></div>
            </div>

            <div className="product-reviews-layout">
                <div className="product-review-list">
                    {reviews.length ? reviews.map((review) => (
                        <article className="product-review" key={review._id}>
                            <div className="product-review-top">
                                <div><strong>{review.username}</strong>{review.verifiedPurchase && <span className="verified-review"><i className="fas fa-check-circle" aria-hidden="true" />{t('Verified purchase')}</span>}</div>
                                <time dateTime={review.createdAt}>{date.format(new Date(review.createdAt))}</time>
                            </div>
                            <Rating rating={review.rating} />
                            <p>{review.comment}</p>
                            {userInfo?.isAdmin && <Button type="button" variant="link" onClick={() => removeReview(review)} disabled={deletingId === review._id}>{deletingId === review._id ? <Spinner size="sm" animation="border" /> : <i className="far fa-trash-alt" aria-hidden="true" />}{t('Remove review')}</Button>}
                        </article>
                    )) : <div className="product-reviews-empty"><i className="far fa-comment-alt" aria-hidden="true" /><h3>{t('No reviews yet')}</h3><p>{t('Be the first customer to share an honest experience with this piece.')}</p></div>}
                </div>

                <aside className="product-review-form-card">
                    <span>{t('Share your experience')}</span><h2>{t('Write a review')}</h2>
                    {userInfo ? (
                        <Form onSubmit={submitReview}>
                            <Form.Group>
                                <Form.Label>{t('Your rating')}</Form.Label>
                                <div className="review-star-picker" role="radiogroup" aria-label={t('Your rating')}>
                                    {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" role="radio" aria-checked={rating === value} onClick={() => setRating(value)} aria-label={t('{{count}} stars', { count: value })}><i className={value <= rating ? 'fas fa-star' : 'far fa-star'} /></button>)}
                                </div>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>{t('Your review')}</Form.Label>
                                <Form.Control as="textarea" rows={5} minLength={10} maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} required />
                                <Form.Text>{t('Write at least 10 characters. One review is allowed per product.')}</Form.Text>
                            </Form.Group>
                            <Button type="submit" disabled={submitting}>{submitting && <Spinner size="sm" animation="border" />}{t(submitting ? 'Publishing…' : 'Publish review')}</Button>
                        </Form>
                    ) : <div className="review-signin"><p>{t('Sign in to leave a genuine product review.')}</p><Link to={getLoginUrl(`${location.pathname}${location.search}`)}>{t('Sign in to review')}</Link></div>}
                </aside>
            </div>
        </section>
    );
}

export default ProductReviews;
