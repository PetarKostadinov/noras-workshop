import React, { useContext } from 'react';
import { Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Rating from '../helpersComponents/Rating';
import { Store } from '../helpersComponents/Store';
import { getProduct } from '../service/productService';
import { toast } from 'react-toastify';
import getError from '../util';
import { useTranslation } from 'react-i18next';

function Product({ product }) {
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { t } = useTranslation();
  const { cart: { cartItems } } = state;
  const productUrl = '/product/' + product._id + '/' + product.slug;

  const addToCartHandler = async (item) => {
    try {
      const exists = cartItems.find((x) => x._id === product._id);
      const quantity = exists ? exists.quantity + 1 : 1;
      const data = await getProduct(item._id);

      if (data.countMany < quantity) {
        toast.error(`Only ${data.countMany} of “${item.name}” ${data.countMany === 1 ? 'is' : 'are'} currently available.`);
        return;
      }

      ctxDispatch({ type: 'CART_ADD_ITEM', payload: { ...item, quantity } });
    } catch (error) {
      toast.error(getError(error, 'We couldn’t add this product to your cart. Please try again.'));
    }
  };

  return (
    <Card className="product-card h-100">
      <div className="product-card-media">
        <Link to={productUrl} aria-label={'View ' + product.name}>
          <img src={product.image} className="card-img-top" alt={product.name} />
        </Link>
          <span className="product-category">{t(product.category)}</span>
        {product.countMany > 0 && product.countMany <= 5 && (
          <span className="product-stock">{t('Only {{count}} left', { count: product.countMany })}</span>
        )}
      </div>
      <Card.Body className="product-card-body">
        <div className="product-card-content">
          <span className="product-brand">{product.brand}</span>
          <Link className="product-title-link" to={productUrl}>
            <Card.Title>{t(product.name)}</Card.Title>
          </Link>
          <Rating rating={product.rating} numReviews={product.numReviews} />
          <Card.Text className="product-card-description">{t(product.description)}</Card.Text>
        </div>
        <div className="product-card-footer">
          <Card.Text className="price">{'$' + product.price.toFixed(2)}</Card.Text>
          {product.countMany === 0
            ? <Button disabled variant="light" className="product-card-button">{t('Out of stock')}</Button>
            : (
              <Button onClick={() => addToCartHandler(product)} className="product-card-button" aria-label={'Add ' + product.name + ' to cart'}>
                <i className="fas fa-shopping-bag" aria-hidden="true"></i>
                <span>{t('Add to cart')}</span>
              </Button>
            )
          }
        </div>
      </Card.Body>
    </Card>
  );
}

export default Product;
