import React, { useEffect, useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Product from './Product';
import { Helmet } from 'react-helmet-async';
import LoadingComponent from '../helpersComponents/LoadingComponent';
import MessageComponent from '../helpersComponents/MessageComponent';
import { fetchProducts } from '../service/productService';
import { useLocation } from 'react-router-dom';
import { generatePaginationLinks } from '../service/paginationService';
import getError from '../util';
import { useTranslation } from 'react-i18next';

const productsToShow = 6;

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

function Home() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [products, setProducts] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
   

    const query = useQuery();
    const requestedPage = Number.parseInt(query.get('page'), 10);
    const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

    useEffect(() => {
        const controller = new AbortController();
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await fetchProducts(currentPage, productsToShow, controller.signal);
                setProducts(data.products);
                setTotalPages(data.pages);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setError(getError(err, 'We couldn’t load the collection. Please try again.'));
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        fetchData();
        return () => controller.abort();
    }, [currentPage]);

    const paginationLinks = generatePaginationLinks(currentPage, totalPages);

    return (
        <>
            <div>
                <Helmet>
                    <title>Nora’s Workshop | Handmade Gifts &amp; Event Décor</title>
                </Helmet>

                <div className="collection-heading">
                    <span>{t('Made with intention')}</span>
                    <h2>{t('Shop the collection')}</h2>
                    <p>{t('Handcrafted pieces for gifting, gathering, and creating beautiful photographs.')}</p>
                </div>
                <div className="products">
                    {loading ? (
                        <LoadingComponent />
                    ) : error ? (
                        <MessageComponent variant="danger">{error}</MessageComponent>
                    ) : (
                        <>
                            <Row className="row pt-4 gy-4">
                                {products.map((x) => (
                                    <Col key={x._id} sm={6} lg={4} className="product-column">
                                        <Product product={x}></Product>
                                    </Col>
                                ))}
                            </Row>
                        </>
                    )}
                </div>
                <div className="d-flex justify-content-center mt-5">
                    <div className="btn-group">{paginationLinks}</div>
                </div>
            </div>
        </>
    );
}

export default Home;
