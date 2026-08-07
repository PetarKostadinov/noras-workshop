import React, { useContext, useEffect, useState } from 'react';
import { Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { Store } from '../helpersComponents/Store';
import { fetchProduct, updateItem, uploadProductImage } from '../service/productService';
import getError from '../util';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const EMPTY_FORM = {
    name: '', slug: '', image: '', brand: '', category: '', description: '',
    price: '', countMany: '', rating: '', numReviews: '',
};

const slugify = (value) => value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function EditItemPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const { state } = useContext(Store);
    const { userInfo } = state;
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const [validated, setValidated] = useState(false);

    useEffect(() => {
        let active = true;
        const loadProduct = async () => {
            setLoading(true);
            setLoadError('');
            try {
                const product = await fetchProduct(id);
                if (!active) return;
                setForm({
                    name: product.name ?? '', slug: product.slug ?? '', image: product.image ?? '',
                    brand: product.brand ?? '', category: product.category ?? '', description: product.description ?? '',
                    price: String(product.price ?? ''), countMany: String(product.countMany ?? ''),
                    rating: String(product.rating ?? ''), numReviews: String(product.numReviews ?? ''),
                });
            } catch (err) {
                if (active) setLoadError(getError(err));
            } finally {
                if (active) setLoading(false);
            }
        };
        loadProduct();
        return () => { active = false; };
    }, [id]);

    useEffect(() => () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

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

        const price = Number(form.price);
        const countMany = Number(form.countMany);
        const rating = Number(form.rating);
        const numReviews = Number(form.numReviews);
        if (!Number.isFinite(price) || price < 0) return toast.error('Price must be 0 or more.');
        if (!Number.isInteger(countMany) || countMany < 0) return toast.error('Inventory must be a whole number of 0 or more.');
        if (!Number.isFinite(rating) || rating < 0 || rating > 5) return toast.error('Rating must be between 0 and 5.');
        if (!Number.isInteger(numReviews) || numReviews < 0) return toast.error('Reviews must be a whole number of 0 or more.');

        setSubmitting(true);
        try {
            const payload = {
                ...form,
                name: form.name.trim(), slug: form.slug.trim().toLowerCase(), image: form.image.trim(),
                brand: form.brand.trim(), category: form.category.trim(), description: form.description.trim(),
                price, countMany, rating, numReviews,
            };
            const result = await updateItem(id, payload.slug, payload, userInfo.token);
            toast.success('Product updated successfully.');
            navigate(`/product/${result._id}/${result.slug}`);
        } catch (err) {
            toast.error(getError(err));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="admin-dashboard-loading"><Spinner animation="border" /><span>{t('Loading product…')}</span></div>;
    if (loadError) return <div className="admin-dashboard-empty"><h1>{t('Product unavailable')}</h1><p>{loadError}</p><Link className="product-editor-back" to="/admin/productlist">{t('Back to products')}</Link></div>;

    const displayedImage = previewUrl || form.image;
    const productUrl = `/product/${id}/${form.slug}`;

    return (
        <section className="product-editor-page">
            <Helmet><title>Edit {form.name} | Nora's Workshop</title></Helmet>
            <div className="product-editor-heading">
                <div><span>{t('Admin workspace')}</span><h1>{t('Edit product')}</h1><p>{t('Update the product details, availability, and storefront image.')}</p></div>
                <Link className="product-editor-back" to="/admin/productlist">{t('Back to products')}</Link>
            </div>

            <Form noValidate validated={validated} onSubmit={submitHandler}>
                <Row className="g-4 align-items-start">
                    <Col lg={8}>
                        <div className="product-editor-card">
                            <h2>{t('Product details')}</h2>
                            <Row className="g-3">
                                <Col md={7}><Form.Group controlId="edit-name"><Form.Label>{t('Name')}</Form.Label><Form.Control value={form.name} onChange={(e) => updateField('name', e.target.value)} required /><Form.Control.Feedback type="invalid">Enter a product name.</Form.Control.Feedback></Form.Group></Col>
                                <Col md={5}><Form.Group controlId="edit-slug"><Form.Label>{t('URL slug')}</Form.Label><Form.Control value={form.slug} onChange={(e) => updateField('slug', slugify(e.target.value))} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /><Form.Text>{t('Use lowercase letters, numbers, and hyphens.')}</Form.Text><Form.Control.Feedback type="invalid">Use lowercase letters, numbers, and single hyphens.</Form.Control.Feedback></Form.Group></Col>
                                <Col md={6}><Form.Group controlId="edit-brand"><Form.Label>{t('Brand')}</Form.Label><Form.Control value={form.brand} onChange={(e) => updateField('brand', e.target.value)} required /></Form.Group></Col>
                                <Col md={6}><Form.Group controlId="edit-category"><Form.Label>{t('Category')}</Form.Label><Form.Control value={form.category} onChange={(e) => updateField('category', e.target.value)} required /></Form.Group></Col>
                                <Col xs={12}><Form.Group controlId="edit-description"><Form.Label>{t('Description')}</Form.Label><Form.Control as="textarea" rows={5} value={form.description} onChange={(e) => updateField('description', e.target.value)} required /></Form.Group></Col>
                            </Row>
                        </div>
                        <div className="product-editor-card mt-4">
                            <h2>{t('Pricing and inventory')}</h2>
                            <Row className="g-3">
                                <Col sm={6} md={3}><Form.Group controlId="edit-price"><Form.Label>{t('Price (USD)')}</Form.Label><Form.Control type="number" min="0" step="0.01" value={form.price} onChange={(e) => updateField('price', e.target.value)} required /></Form.Group></Col>
                                <Col sm={6} md={3}><Form.Group controlId="edit-count"><Form.Label>{t('Inventory')}</Form.Label><Form.Control type="number" min="0" step="1" value={form.countMany} onChange={(e) => updateField('countMany', e.target.value)} required /></Form.Group></Col>
                                <Col sm={6} md={3}><Form.Group controlId="edit-rating"><Form.Label>{t('Rating')}</Form.Label><Form.Control type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => updateField('rating', e.target.value)} required /></Form.Group></Col>
                                <Col sm={6} md={3}><Form.Group controlId="edit-reviews"><Form.Label>{t('Reviews')}</Form.Label><Form.Control type="number" min="0" step="1" value={form.numReviews} onChange={(e) => updateField('numReviews', e.target.value)} required /></Form.Group></Col>
                            </Row>
                        </div>
                    </Col>
                    <Col lg={4}>
                        <div className="product-editor-card product-image-panel">
                            <h2>{t('Product image')}</h2>
                            <div className={`product-image-preview ${displayedImage ? 'has-image' : ''}`}>{displayedImage ? <img src={displayedImage} alt={t('Product preview')} /> : <span>{t('Choose an image to preview it')}</span>}</div>
                            <Form.Group controlId="edit-image"><Form.Label>{t('Replace image')}</Form.Label><Form.Control className="product-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={imageChangeHandler} disabled={uploading || submitting} /><Form.Text>JPG, PNG, WebP, or GIF. Maximum 5 MB.</Form.Text></Form.Group>
                            {uploading && <div className="product-upload-status"><Spinner size="sm" animation="border" /><span>{t('Uploading image…')}</span></div>}
                        </div>
                        <div className="product-editor-actions">
                            <Button type="submit" disabled={submitting || uploading}>{submitting && <Spinner size="sm" animation="border" aria-hidden="true" />}<span>{t(submitting ? 'Saving changes…' : 'Save changes')}</span></Button>
                            <Link to={productUrl}>{t('Cancel')}</Link>
                        </div>
                    </Col>
                </Row>
            </Form>
        </section>
    );
}

export default EditItemPage;
