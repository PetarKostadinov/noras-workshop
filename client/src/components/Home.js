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
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [products, setProducts] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
   

    const query = useQuery();
    const page = parseInt(query.get("page")) || 1;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await fetchProducts(currentPage, productsToShow);
                setProducts(data);
                setTotalPages(Math.ceil(data.length / productsToShow));
                setLoading(false);
            } catch (err) {
                setError(getError(err, 'We couldn’t load the collection. Please try again.'));
                setLoading(false);
            }
        };

        setCurrentPage(page);
        fetchData();
    }, [currentPage, page]);

    const indexOfLastProduct = currentPage * productsToShow;
    const indexOfFirstProduct = indexOfLastProduct - productsToShow;
    const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

    const paginationLinks = generatePaginationLinks(currentPage, totalPages);

    const handleNextPageClick = () => {
        setCurrentPage(currentPage + 1);
        window.scrollTo(0, 0); // Scroll to top of window
    }

    return (
        <>
            <div>
                <Helmet>
                    <title>Nora’s Atelier | Handmade Gifts &amp; Event Décor</title>
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
                                {currentProducts.map((x) => (
                                    <Col key={x._id} sm={6} lg={4} className="product-column">
                                        <Product product={x}></Product>
                                    </Col>
                                ))}
                            </Row>
                        </>
                    )}
                </div>
                <div className="d-flex justify-content-center mt-5">
                    <div className="btn-group" onClick={() => handleNextPageClick()}>{paginationLinks}</div>
                </div>
            </div>
        </>
    );
}

export default Home;
