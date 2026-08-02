import React, { useContext, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import getError from '../util';
import { Store } from '../helpersComponents/Store';
import { updateItem } from '../service/productService';
import { useTranslation } from 'react-i18next';

function EditItemPage() {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [image, setImage] = useState('');
    const [brand, setBrand] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [countMany, setCountMany] = useState('');
    const [rating, setRating] = useState('');
    const [numReviews, setNumReviews] = useState('');

    const navigate = useNavigate();
    const { id } = useParams();

    const { state, dispatch } = useContext(Store);
    const { userInfo, currItem } = state;

    const submitHandler = async (e) => {
        e.preventDefault();
        dispatch({ type: 'UPDATE_ITEM_REQUEST' });

        try {
            if (isNaN(e.target.price.value) === true || e.target.price.value < 1) {
                throw new Error('Price must be greater than zero.');
            } else if (
                isNaN(e.target.countMany.value) === true ||
                e.target.countMany.value < 0
            ) {
                throw new Error('Inventory must be a whole number of zero or more.');
            } else if (
                isNaN(e.target.rating.value) === true ||
                e.target.rating.value < 0
            ) {
                throw new Error('Rating must be between zero and five.');
            } else if (isNaN(e.target.numReviews.value) === true || e.target.numReviews.value < 0) {
                throw new Error('Reviews must be a whole number of zero or more.');
            }

            const data = {
                name,
                slug,
                image,
                brand,
                category,
                description,
                price,
                countMany,
                rating,
                numReviews,
            };

            const result = await updateItem(id, e.target.slug.value, data, userInfo.token);
            dispatch({ type: 'UPDATE_ITEM_SUCCESS', payload: result });
            navigate(`/product/${result._id}/${result.slug}`);
            toast.success('The Item has been updated successfully');

        } catch (err) {

            dispatch({ type: 'UPDATE_ITEM_FAIL', payload: err.message });
            toast.error(getError(err));
        }
    };

    return (
        <div className="container small-container">
            <Helmet>
                <title>Edit Item</title>
            </Helmet>
            <h1 className="my-3">{t('Edit product')}</h1>
            <form onSubmit={submitHandler}>
                <Form.Group className="mb-3" controlId="name">
                    <Form.Label>{t('Name')}</Form.Label>
                    <Form.Control
                        defaultValue={currItem.name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </Form.Group>
                <Form.Group className="mb-3" controlId="slug">
                    <Form.Label>{t('URL slug')}</Form.Label>
                    <Form.Control
                        defaultValue={currItem.slug}
                        onChange={(e) => setSlug(e.target.value)}
                        required
                    />
                </Form.Group>
                <Form.Group className="mb-3" controlId="image">
                    <Form.Label>{t('Product image')}</Form.Label>
                    <Form.Control
                        defaultValue={currItem.image}
                        onChange={(e) => setImage(e.target.value)}
                        required
                    />
                </Form.Group>
                <Form.Group className="mb-3" controlId="brand">
                    <Form.Label>{t('Brand')}</Form.Label>
                    <Form.Control
                        defaultValue={currItem.brand}
                        onChange={(e) => setBrand(e.target.value)}
                        required
                    />
                </Form.Group>
                <Form.Group className="mb-3" controlId="category">
                    <Form.Label>{t('Category')}</Form.Label>
                    <Form.Control
                        defaultValue={currItem.category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    />
                </Form.Group>
                <Form.Group className="mb-3" controlId="description">
                    <Form.Label>{t('Description')}</Form.Label>
                    <Form.Control
                        defaultValue={currItem.description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </Form.Group>
                <Form.Group className="mb-3" controlId="price">
                    <Form.Label>{t('Price')}</Form.Label>
                    <Form.Control
                        defaultValue={currItem.price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                        type="number"
                    />
                </Form.Group>
                <Form.Group className="mb-3" controlId="countMany">
                    <Form.Label>{t('Inventory')}</Form.Label>
                    <Form.Control
                        defaultValue={currItem.countMany}
                        onChange={(e) => setCountMany(e.target.value)}
                        required
                        type="number"
                    />
                </Form.Group>
                <Form.Group className="mb-3" controlId="rating">
                    <Form.Label>{t('Rating')}</Form.Label>
                    <Form.Control
                        defaultValue={currItem.rating}
                        onChange={(e) => setRating(e.target.value)}
                        required
                        type="number"
                    />
                </Form.Group>
                <Form.Group className="mb-3" controlId="numReviews">
                    <Form.Label>{t('Reviews')}</Form.Label>
                    <Form.Control
                        defaultValue={currItem.numReviews}
                        onChange={(e) => setNumReviews(e.target.value)}
                        required
                        type="number"
                    />
                </Form.Group>
                <div className="mb-3">
                    <Button type="submit">
                        {t('Save changes')}
                    </Button>{' '}
                </div>
                <div>
                    {t('Changed your mind?')}{' '}
                    <Link type="button"
                        to={`/product/${currItem._id}`}>
                        {t('Cancel')}
                    </Link>
                </div>
            </form>
        </div>
    )
}

export default EditItemPage;
