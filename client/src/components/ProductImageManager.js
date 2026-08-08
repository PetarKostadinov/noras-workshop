import React, { useRef, useState } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { uploadProductImage } from '../service/productService';
import getError from '../util';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 6;

function ProductImageManager({ images, onChange, token, uploading, setUploading, disabled, autoSave = false }) {
    const { t } = useTranslation();
    const inputRef = useRef(null);
    const [uploadProgress, setUploadProgress] = useState(null);

    const uploadHandler = async (event) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;
        const remainingSlots = MAX_IMAGES - images.length;
        if (files.length > remainingSlots) {
            toast.error(t('You can add up to {{count}} product images.', { count: MAX_IMAGES }));
            event.target.value = '';
            return;
        }
        if (files.some((file) => !ACCEPTED_IMAGE_TYPES.includes(file.type))) {
            toast.error('Choose JPG, PNG, WebP, or GIF images.');
            event.target.value = '';
            return;
        }
        if (files.some((file) => file.size > MAX_IMAGE_SIZE)) {
            toast.error('Each image must be 5 MB or smaller.');
            event.target.value = '';
            return;
        }

        setUploading(true);
        setUploadProgress({ completed: 0, total: files.length });
        let nextImages = [...images];
        const failedFiles = [];
        try {
            for (const file of files) {
                try {
                    const data = await uploadProductImage(token, file);
                    nextImages = [...nextImages, data.image];
                    await onChange(nextImages);
                } catch (err) {
                    failedFiles.push(file.name);
                    toast.error(`${file.name}: ${getError(err)}`);
                } finally {
                    setUploadProgress((current) => ({ ...current, completed: current.completed + 1 }));
                }
            }
            if (failedFiles.length && nextImages.length > images.length) {
                toast.warning(t('{{count}} image(s) uploaded; some files could not be uploaded.', { count: nextImages.length - images.length }));
            }
        } finally {
            setUploading(false);
            setUploadProgress(null);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const moveImage = async (index, direction) => {
        const target = index + direction;
        if (target < 0 || target >= images.length) return;
        const next = [...images];
        [next[index], next[target]] = [next[target], next[index]];
        try {
            await onChange(next);
        } catch {
            // The parent restores the last persisted gallery and reports the error.
        }
    };

    const removeImage = async (index) => {
        if (images.length === 1) {
            toast.error(t('A product must keep at least one image.'));
            return;
        }
        try {
            await onChange(images.filter((_, itemIndex) => itemIndex !== index));
        } catch {
            // The parent restores the last persisted gallery and reports the error.
        }
    };

    return (
        <div className="product-image-manager">
            <h2>{t('Product gallery')}</h2>
            <p className="product-image-help">{t('The first image is the storefront cover. Add up to six images and arrange their order.')}</p>
            {autoSave && <p className="product-image-help">{t('Gallery changes to existing products save automatically.')}</p>}
            {images.length ? (
                <div className="product-image-list">
                    {images.map((image, index) => (
                        <article key={image} className="product-image-item">
                            <img src={image} alt={t('Product image {{count}}', { count: index + 1 })} loading="lazy" decoding="async" />
                            {index === 0 && <span>{t('Cover')}</span>}
                            <div>
                                <Button type="button" variant="light" onClick={() => moveImage(index, -1)} disabled={disabled || uploading || index === 0} aria-label={t('Move image left')}><i className="fas fa-arrow-left" /></Button>
                                <Button type="button" variant="light" onClick={() => moveImage(index, 1)} disabled={disabled || uploading || index === images.length - 1} aria-label={t('Move image right')}><i className="fas fa-arrow-right" /></Button>
                                <Button type="button" variant="light" onClick={() => removeImage(index)} disabled={disabled || uploading} aria-label={t('Remove image')}><i className="far fa-trash-alt" /></Button>
                            </div>
                        </article>
                    ))}
                </div>
            ) : <div className="product-image-empty">{t('Add at least one product image.')}</div>}
            <Form.Group controlId="product-images">
                <Form.Label>{t('Upload from your computer')}</Form.Label>
                <Form.Control ref={inputRef} className="product-file-input" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadHandler} disabled={disabled || uploading || images.length >= MAX_IMAGES} />
                <Form.Text>{t('JPG, PNG, WebP, or GIF. Maximum 5 MB each.')}</Form.Text>
            </Form.Group>
            {uploading && <div className="product-upload-status"><Spinner size="sm" animation="border" /><span>{t('Uploading image {{completed}} of {{total}}…', { completed: Math.min((uploadProgress?.completed || 0) + 1, uploadProgress?.total || 1), total: uploadProgress?.total || 1 })}</span></div>}
        </div>
    );
}

export default ProductImageManager;
