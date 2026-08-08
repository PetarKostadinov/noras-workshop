import React from 'react'
import { useTranslation } from 'react-i18next';

function Rating(props) {
  const { t } = useTranslation();
  const { rating, numReviews, caption } = props;
  const accessibleLabel = t('{{rating}} out of 5 stars', { rating: Number(rating || 0).toFixed(1) });
  return (
    <div className="rating">
      <span className="rating-stars" role="img" aria-label={accessibleLabel}>
      <span aria-hidden="true">
        <i className={rating >= 1 ? 'fas fa-star' : rating >= 0.5 ? 'fas fa-star-half-alt' : 'far fa-star'}></i>
      </span>
      <span aria-hidden="true">
        <i className={rating >= 2 ? 'fas fa-star' : rating >= 1.5 ? 'fas fa-star-half-alt' : 'far fa-star'}></i>
      </span>
      <span aria-hidden="true">
        <i className={rating >= 3 ? 'fas fa-star' : rating >= 2.5 ? 'fas fa-star-half-alt' : 'far fa-star'}></i>
      </span>
      <span aria-hidden="true">
        <i className={rating >= 4 ? 'fas fa-star' : rating >= 3.5 ? 'fas fa-star-half-alt' : 'far fa-star'}></i>
      </span>
      <span aria-hidden="true">
        <i className={rating >= 5 ? 'fas fa-star' : rating >= 4.5 ? 'fas fa-star-half-alt' : 'far fa-star'}></i>
      </span>
      </span>
      {caption ? (
        <span aria-hidden="true">{caption}</span>
      ) : numReviews !== undefined ? (
        <span>{' ' + t(numReviews === 1 ? '{{count}} review' : '{{count}} reviews', { count: numReviews })}</span>
      ) : null}
    </div>
  )
};

export default Rating;
