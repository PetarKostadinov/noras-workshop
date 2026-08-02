import React, { useContext, useEffect, useState } from 'react';
import { Button, Container, Form } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Store } from '../helpersComponents/Store';

import { createProduct } from '../service/productService';
import { toast } from 'react-toastify';
import getError from '../util';

const IMAGE_URL_PATTERN = /^https?:\/\/.+/i;

function CreateItem() {
    const navigate = useNavigate();
    const { search } = useLocation();
    const redirectInUrl = new URLSearchParams(search).get('redirect');
    const redirect = redirectInUrl ? redirectInUrl : '/';

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
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { productsOnList, userInfo } = state;
    const [isValidUrl, setIsValidUrl] = useState(false);

    useEffect(() => {
        setIsValidUrl(IMAGE_URL_PATTERN.test(image));
      
    },[image])
    const submitHandler = async (e) => {
        e.preventDefault();
      
        try {
            
            if (!isValidUrl) {
                throw new Error('Please enter a valid URL starting with http:// or https://');
            }

            if (isNaN(price) === true || price < 1) {
                throw new Error('Price should be a Positive Number')
            } else if (isNaN(countMany) === true || countMany < 0) {
                throw new Error('Count should be a Positive Number or 0')
            } else if (isNaN(rating) === true || rating < 0) {
                throw new Error('Rating should be a Positive Number or 0')
            } else if (isNaN(numReviews) === true || numReviews < 0) {
                throw new Error('Number of Reviews should be a Positive Number or 0')
            }

            const item = {
                name,
                slug,
                image,
                brand,
                category,
                description,
                price,
                countMany,
                rating,
                numReviews
            };
            const data = await createProduct(userInfo, item);
           
            ctxDispatch({ type: 'PRODUCT_CREATE', payload: data });
            navigate(redirect);

        } catch (err) {
        
            toast.error(getError(err));
        } 
     
    }

    useEffect(() => {
        if (!productsOnList) {
            navigate('/create');
        }
    }, [navigate, redirect, productsOnList]);


    return (
        <Container className="small-container">
            <Helmet>
                <title>Create Item</title>
            </Helmet>
            <h1 className="my-3">Create Item</h1>
            <Form onSubmit={submitHandler}>
                <Form.Group className="mb-3" controlid="name">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                        placeholder="Name of the product"
                        value={name}
                        required
                        onChange={(e) => setName(e.target.value)}
                    ></Form.Control>
                </Form.Group>
                <Form.Group className="mb-3" controlid="slug">
                    <Form.Label>Slug</Form.Label>
                    <Form.Control
                        placeholder="Short name of the product, which will be included at the end of the URL"
                        required
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                    ></Form.Control>
                </Form.Group>
                <Form.Group className="mb-3" controlid="image">
                    <Form.Label>Image</Form.Label>
                    <Form.Control
                        placeholder="Image URL address, should starts with http/https"
                        required
                        type="text"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                    ></Form.Control>
                </Form.Group>
                <Form.Group className="mb-3" controlid="brand">
                    <Form.Label>Brand</Form.Label>
                    <Form.Control
                        placeholder="Brand name"
                        required
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                    ></Form.Control>
                </Form.Group>
                <Form.Group className="mb-3" controlid="category">
                    <Form.Label>Category</Form.Label>
                    <Form.Control
                        placeholder="Category"
                        required
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    ></Form.Control>
                </Form.Group>
                <Form.Group className="mb-3" controlid="description">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                        placeholder="Description"
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    ></Form.Control>
                </Form.Group>
                <Form.Group className="mb-3" controlid="price">
                    <Form.Label>Price</Form.Label>
                    <Form.Control
                        placeholder="Price"
                        type="number"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    ></Form.Control>
                </Form.Group>
                <Form.Group className="mb-3" controlid="countMany">
                    <Form.Label>Count</Form.Label>
                    <Form.Control
                        placeholder="Count"
                        type="number"
                        value={countMany}
                        required
                        onChange={(e) => setCountMany(e.target.value)}
                    ></Form.Control>
                </Form.Group>
                <Form.Group className="mb-3" controlid="rating">
                    <Form.Label>Rating</Form.Label>
                    <Form.Control
                        placeholder="Rating"
                        type="number"
                        required
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                    ></Form.Control>
                </Form.Group>
                <Form.Group className="mb-3" controlid="numReviews">
                    <Form.Label>Number of Reviews</Form.Label>
                    <Form.Control
                        placeholder="Number of reviews"
                        type="number"
                        required
                        value={numReviews}
                        onChange={(e) => setNumReviews(e.target.value)}
                    ></Form.Control>
                </Form.Group>
                <div className="mb-3">
                    <Button type="submit">Create</Button>
                </div>
                <div className="mb-3">
                    Changed your mind ?{' '}
                    <Link to={`/?redirect=${redirect}`}>Cansel</Link>
                </div>
            </Form>
        </Container>
    )
}
export default CreateItem
