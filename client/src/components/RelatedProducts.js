import React, { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { fetchRelatedProducts } from '../service/productService';
import Product from './Product';

function RelatedProducts({ productId }) {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    fetchRelatedProducts(productId, controller.signal)
      .then(setProducts)
      .catch((error) => {
        if (error.name !== 'AbortError') setProducts([]);
      });

    return () => controller.abort();
  }, [productId]);

  if (!products.length) return null;

  return (
    <section className="related-products" aria-labelledby="related-products-title">
      <div className="collection-heading">
        <span>{t('More from the workshop')}</span>
        <h2 id="related-products-title">{t('You may also like')}</h2>
        <p>{t('Discover more handmade pieces from this collection.')}</p>
      </div>
      <Row className="pt-4 gy-4">
        {products.map((product) => (
          <Col key={product._id} sm={6} lg={4} className="product-column">
            <Product product={product} />
          </Col>
        ))}
      </Row>
    </section>
  );
}

export default RelatedProducts;
