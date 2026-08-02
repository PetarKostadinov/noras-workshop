import React, { useContext, useEffect, useState } from 'react';
import { Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Store } from '../helpersComponents/Store';
import { createProduct, uploadProductImage } from '../service/productService';
import getError from '../util';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const slugify = (value) => value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function CreateItem() {
    const navigate = useNavigate();
    const { state, dispatch } = useContext(Store);
    const { userInfo } = state;

    const [form, setForm] = useState({
        name: '',
        slug: '',
        image: '',
        brand: "Nora's Atelier",
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
    const [previewUrl, setPreviewUrl] = useState('');
    const [validated, setValidated] = useState(false);

    useEffect(() => () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    const updateField = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
            ...(field === 'name' && !slugEdited ? { slug: slugify(value) } : {}),
        }));
    };

    const imageChangeHandler = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            toast.error('Choose a JPG, PNG, WebP, or GIF image.');
            event.target.value = '';
            return;
        }
        if (file.size > MAX_IMAGE_SIZE) {
            toast.error('The image must be 5 MB or smaller.');
            event.target.value = '';
            return;
        }

        const nextPreviewUrl = URL.createObjectURL(file);
        setPreviewUrl(nextPreviewUrl);
        updateField('image', '');
        setUploading(true);
        try {
            const data = await uploadProductImage(userInfo.token, file);
            updateField('image', data.image);
        } catch (err) {
            setPreviewUrl('');
            event.target.value = '';
            toast.error(getError(err));
        } finally {
            setUploading(false);
        }
    };

    const submitHandler = async (event) => {
        event.preventDefault();
        setValidated(true);

        if (!event.currentTarget.checkValidity()) return;
        if (!form.image) {
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
                image: form.image.trim(),
                brand: form.brand.trim(),
                category: form.category.trim(),
                description: form.description.trim(),
                price,
                countMany,
                rating,
                numReviews,
            };
            const data = await createProduct(userInfo, item);
            dispatch({ type: 'PRODUCT_CREATE', payload: data });
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
            <Helmet><title>Create Product | Nora's Atelier</title></Helmet>

            <div className="product-editor-heading">
                <div>
                    <span>Admin workspace</span>
                    <h1>Create a product</h1>
                    <p>Add the details customers need to discover and purchase this item.</p>
                </div>
                <Link className="product-editor-back" to="/">Back to shop</Link>
            </div>

            <Form noValidate validated={validated} onSubmit={submitHandler}>
                <Row className="g-4 align-items-start">
                    <Col lg={8}>
                        <div className="product-editor-card">
                            <h2>Product details</h2>
                            <Row className="g-3">
                                <Col md={7}>
                                    <Form.Group controlId="create-name">
                                        <Form.Label>Name</Form.Label>
                                        <Form.Control value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Personalized keepsake box" required />
                                        <Form.Control.Feedback type="invalid">Enter a product name.</Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={5}>
                                    <Form.Group controlId="create-slug">
                                        <Form.Label>URL slug</Form.Label>
                                        <Form.Control value={form.slug} onChange={(e) => { setSlugEdited(true); updateField('slug', slugify(e.target.value)); }} placeholder="personalized-keepsake-box" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required />
                                        <Form.Text>Generated from the name; you can edit it.</Form.Text>
                                        <Form.Control.Feedback type="invalid">Use lowercase letters, numbers, and single hyphens.</Form.Control.Feedback>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group controlId="create-brand">
                                        <Form.Label>Brand</Form.Label>
                                        <Form.Control value={form.brand} onChange={(e) => updateField('brand', e.target.value)} required />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group controlId="create-category">
                                        <Form.Label>Category</Form.Label>
                                        <Form.Control value={form.category} onChange={(e) => updateField('category', e.target.value)} placeholder="Handmade Gifts" required />
                                    </Form.Group>
                                </Col>
                                <Col xs={12}>
                                    <Form.Group controlId="create-description">
                                        <Form.Label>Description</Form.Label>
                                        <Form.Control as="textarea" rows={5} value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Describe the materials, finish, and what makes this item special." required />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>

                        <div className="product-editor-card mt-4">
                            <h2>Pricing and inventory</h2>
                            <Row className="g-3">
                                <Col sm={6} md={3}>
                                    <Form.Group controlId="create-price">
                                        <Form.Label>Price (USD)</Form.Label>
                                        <Form.Control type="number" min="0" step="0.01" value={form.price} onChange={(e) => updateField('price', e.target.value)} placeholder="0.00" required />
                                    </Form.Group>
                                </Col>
                                <Col sm={6} md={3}>
                                    <Form.Group controlId="create-count">
                                        <Form.Label>Inventory</Form.Label>
                                        <Form.Control type="number" min="0" step="1" value={form.countMany} onChange={(e) => updateField('countMany', e.target.value)} placeholder="0" required />
                                    </Form.Group>
                                </Col>
                                <Col sm={6} md={3}>
                                    <Form.Group controlId="create-rating">
                                        <Form.Label>Rating</Form.Label>
                                        <Form.Control type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => updateField('rating', e.target.value)} required />
                                    </Form.Group>
                                </Col>
                                <Col sm={6} md={3}>
                                    <Form.Group controlId="create-reviews">
                                        <Form.Label>Reviews</Form.Label>
                                        <Form.Control type="number" min="0" step="1" value={form.numReviews} onChange={(e) => updateField('numReviews', e.target.value)} required />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </div>
                    </Col>

                    <Col lg={4}>
                        <div className="product-editor-card product-image-panel">
                            <h2>Product image</h2>
                            <div className={`product-image-preview ${previewUrl ? 'has-image' : ''}`}>
                                {previewUrl ? <img src={previewUrl} alt="Selected product preview" /> : <span>Choose an image to preview it</span>}
                            </div>
                            <Form.Group controlId="create-image">
                                <Form.Label>Upload from your computer</Form.Label>
                                <Form.Control className="product-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={imageChangeHandler} disabled={uploading || submitting} required={!form.image} />
                                <Form.Text>JPG, PNG, WebP, or GIF. Maximum 5 MB.</Form.Text>
                            </Form.Group>
                            {uploading && <div className="product-upload-status"><Spinner size="sm" animation="border" /><span>Uploading image…</span></div>}
                        </div>

                        <div className="product-editor-actions">
                            <Button type="submit" disabled={submitting || uploading}>
                                {submitting && <Spinner size="sm" animation="border" aria-hidden="true" />}
                                <span>{submitting ? 'Creating…' : 'Create product'}</span>
                            </Button>
                            <Link to="/">Cancel</Link>
                        </div>
                    </Col>
                </Row>
            </Form>
        </section>
    );
}

export default CreateItem;
