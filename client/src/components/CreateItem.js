import React, { useContext, useState } from 'react';
import { Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Store } from '../helpersComponents/Store';
import { createProduct } from '../service/productService';
import getError from '../util';
import { useTranslation } from 'react-i18next';
import ProductImageManager from './ProductImageManager';

const slugify = (value) => value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function CreateItem() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { state } = useContext(Store);
    const { userInfo } = state;

    const [form, setForm] = useState({
        name: '',
        slug: '',
        image: '',
        images: [],
        brand: "Nora's Workshop",
        category: '',
        description: '',
        price: '',
        countMany: '',
        rating: '0',
        numReviews: '0',
    });
    const [slugEdited, setSlugEdited] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [validated, setValidated] = useState(false);

    const updateField = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
            ...(field === 'name' && !slugEdited ? { slug: slugify(value) } : {}),
        }));
    };

    const submitHandler = async (event) => {
        event.preventDefault();
        setValidated(true);

        if (!event.currentTarget.checkValidity()) return;
        if (!form.images.length) {
            toast.error('Upload a product image before creating the product.');
            return;
        }

        const price = Number(form.price);
        const countMany = Number(form.countMany);
        const rating = Number(form.rating);
        const numReviews = Number(form.numReviews);

        if (price < 0) return toast.error('Price cannot be negative.');
        if (!Number.isInteger(countMany) || countMany < 0) return toast.error('Inventory must be a whole number of 0 or more.');
        if (rating < 0 || rating > 5) return toast.error('Rating must be between 0 and 5.');
        if (!Number.isInteger(numReviews) || numReviews < 0) return toast.error('Reviews must be a whole number of 0 or more.');

        setSubmitting(true);
        try {
            const item = {
                ...form,
                name: form.name.trim(),
                slug: form.slug.trim().toLowerCase(),
                image: form.images[0],
                brand: form.brand.trim(),
                category: form.category.trim(),
                description: form.description.trim(),
                price,
                countMany,
                rating,
                numReviews,
            };
            const data = await createProduct(userInfo, item);
            toast.success('Product created successfully.');
            navigate(`/product/${data._id}/${data.slug}`);
        } catch (err) {
            toast.error(getError(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="product-editor-page">
            <Helmet><title>Create Product | Nora's Workshop</title></Helmet>

            <div className="product-editor-heading">
                <div>
                    <span>{t('Admin workspace')}</span><h1>{t('Create a product')}</h1><p>{t('Add the details customers need to discover and purchase this item.')}</p>
                </div>
                <Link className="product-editor-back" to="/">{t('Back to shop')}</Link>
            </div>

            <Form noValidate validated={validated} onSubmit={submitHandler}>
                <Row className="g-4 align-items-start">
                    <Col lg={8}>
                        <div className="product-editor-card">
                            <h2>{t('Product details')}</h2>
                            <Row className="g-3">
                                <Col md={7}>
                                    <Form.Group controlId="create-name">
                                        <Form.Label>{t('Name')}</Form.Label>
                                        <Form.Control value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Personalized keepsake box" required />
                                        <Form.Control.Feedback type="invalid">Enter a product name.</Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={5}>
                                    <Form.Group controlId="create-slug">
                                        <Form.Label>{t('URL slug')}</Form.Label>
                                        <Form.Control value={form.slug} onChange={(e) => { setSlugEdited(true); updateField('slug', slugify(e.target.value)); }} placeholder="personalized-keepsake-box" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required />
                                        <Form.Text>{t('Generated from the name; you can edit it.')}</Form.Text>
                                        <Form.Control.Feedback type="invalid">Use lowercase letters, numbers, and single hyphens.</Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group controlId="create-brand">
                                        <Form.Label>{t('Brand')}</Form.Label>
                                        <Form.Control value={form.brand} onChange={(e) => updateField('brand', e.target.value)} required />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group controlId="create-category">
                                        <Form.Label>{t('Category')}</Form.Label>
                                        <Form.Control value={form.category} onChange={(e) => updateField('category', e.target.value)} placeholder="Handmade Gifts" required />
                                    </Form.Group>
                                </Col>
                                <Col xs={12}>
                                    <Form.Group controlId="create-description">
                                        <Form.Label>{t('Description')}</Form.Label>
                                        <Form.Control as="textarea" rows={5} value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Describe the materials, finish, and what makes this item special." required />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>

                        <div className="product-editor-card mt-4">
                            <h2>{t('Pricing and inventory')}</h2>
                            <Row className="g-3">
                                <Col sm={6} md={3}>
                                    <Form.Group controlId="create-price">
                                        <Form.Label>{t('Price (USD)')}</Form.Label>
                                        <Form.Control type="number" min="0" step="0.01" value={form.price} onChange={(e) => updateField('price', e.target.value)} placeholder="0.00" required />
                                    </Form.Group>
                                </Col>
                                <Col sm={6} md={3}>
                                    <Form.Group controlId="create-count">
                                        <Form.Label>{t('Inventory')}</Form.Label>
                                        <Form.Control type="number" min="0" step="1" value={form.countMany} onChange={(e) => updateField('countMany', e.target.value)} placeholder="0" required />
                                    </Form.Group>
                                </Col>
                                <Col sm={6} md={3}>
                                    <Form.Group controlId="create-rating">
                                        <Form.Label>{t('Rating')}</Form.Label>
                                        <Form.Control type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => updateField('rating', e.target.value)} required />
                                    </Form.Group>
                                </Col>
                                <Col sm={6} md={3}>
                                    <Form.Group controlId="create-reviews">
                                        <Form.Label>{t('Reviews')}</Form.Label>
                                        <Form.Control type="number" min="0" step="1" value={form.numReviews} onChange={(e) => updateField('numReviews', e.target.value)} required />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>
                    </Col>

                    <Col lg={4}>
                        <div className="product-editor-card product-image-panel">
                            <ProductImageManager images={form.images} onChange={(images) => setForm((current) => ({ ...current, images, image: images[0] || '' }))} token={userInfo.token} uploading={uploading} setUploading={setUploading} disabled={submitting} />
                        </div>

                        <div className="product-editor-actions">
                            <Button type="submit" disabled={submitting || uploading}>
                                {submitting && <Spinner size="sm" animation="border" aria-hidden="true" />}
                                <span>{t(submitting ? 'Creating…' : 'Create product')}</span>
                            </Button>
                            <Link to="/">{t('Cancel')}</Link>
                        </div>
                    </Col>
                </Row>
            </Form>
        </section>
    );
}

export default CreateItem;
