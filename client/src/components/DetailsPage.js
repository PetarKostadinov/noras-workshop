import React, { useContext, useEffect } from 'react'
import { Badge, Button, Card, Col, ListGroup, Row } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify';

import { Store } from '../helpersComponents/Store';
import { deleteProduct, fetchProduct } from '../service/productService';
import getError from '../util';
import LoadingComponent from '../helpersComponents/LoadingComponent';
import MessageComponent from '../helpersComponents/MessageComponent';
import Rating from '../helpersComponents/Rating';

function ProductScreen() {
    const navigate = useNavigate();

    const params = useParams();
    const { id } = params;

    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { cart, userInfo } = state;

    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [product, setProduct] = React.useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await fetchProduct(id);
                setProduct(result);
                setLoading(false);
                ctxDispatch({ type: 'FETCH_SUCCESS_DETAILS', payload: result })
            } catch (err) {
                setError(getError(err));
                setLoading(false);
            }
        };

        fetchData();

    }, [ctxDispatch, id]);

    const addToCartHandler = async () => {
        const exists = cart.cartItems.find((x) => x._id === product._id);
        const quantity = exists ? exists.quantity + 1 : 1;
        const data = await fetchProduct(product._id);

        if (data.countMany < quantity) {
            toast.error('Sorry. Product is out of stock')
            return;
        }

        ctxDispatch({ type: 'CART_ADD_ITEM', payload: { ...product, quantity } });
        navigate('/cart');
    };

    const deleteHandler = async () => {

        try {
            await deleteProduct(product._id, userInfo.token)

            ctxDispatch({ type: 'CART_REMOVE_ITEM', payload: product });
            toast.success('The Item has been deleted successfully')
            navigate('/');
        } catch (error) {
            toast.error(getError(error))
        }
    }

    return loading ? (<LoadingComponent />)
        : error ? (<MessageComponent variant="danger">{error}</MessageComponent>)
            : (<div>
                    <Row>
                        <Col md={6}><img className="img-large" src={product.image} alt={product.name} /></Col>
                        <Col md={3}>
                            <ListGroup variant="flush">
                                <ListGroup.Item>
                                    <Helmet>
                                        <title>{product.name}</title>
                                    </Helmet>
                                    <h1>{product.name}</h1></ListGroup.Item>
                                <ListGroup.Item><Rating rating={product.rating} numReviews={product.numReviews}></Rating></ListGroup.Item>
                                <ListGroup.Item>Price: ${product.price}</ListGroup.Item>
                                <ListGroup.Item>Description: <p>{product.description}</p></ListGroup.Item>
                                {userInfo && userInfo.isAdmin && (
                                    <ListGroup.Item className="align-center">
                                        <Link to={`/${product._id}/editItem/${product.slug}`}>Edit</Link>{' '} 

                                        <Button className="button-delete" onClick={deleteHandler}>Delete</Button>
                                    </ListGroup.Item>
                                )}
                            </ListGroup>

                        </Col>
                        <Col md={3}>
                            <Card>
                                <Card.Body>
                                    <ListGroup variant="flush">
                                        <ListGroup.Item>
                                            <Row>
                                                <Col>Price:</Col>
                                                <Col>${product.price}</Col>
                                            </Row>
                                        </ListGroup.Item>
                                        <ListGroup.Item>
                                            <Row>
                                                <Col>Status:</Col>
                                                <Col>
                                                    {product.countMany > 0 ?
                                                        (<Badge bg="success">In Stock</Badge>)
                                                        : (<Badge bg="danger">Unavailable</Badge>)}
                                                </Col>
                                            </Row>
                                        </ListGroup.Item>
                                        {product.countMany > 0
                                            && (<ListGroup.Item>
                                                <div className="d-grid">
                                                    <Button onClick={addToCartHandler} variant="primary">
                                                        AddTo Cart
                                                    </Button>
                                                </div>
                                            </ListGroup.Item>)}
                                    </ListGroup>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
               
            </div >);


}

export default ProductScreen;
