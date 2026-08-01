import React, { useEffect, useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import getError from '../util';
import LoadingComponent from '../helpersComponents/LoadingComponent';
import MessageComponent from '../helpersComponents/MessageComponent';
import Product from './Product';
import Rating from '../helpersComponents/Rating';
import { getCategories, getProducts } from '../service/searchService';

const prices = [
    { name: 'Under $50', value: '1-50' },
    { name: '$51 – $200', value: '51-200' },
    { name: '$201 and above', value: '201-1000' },
];

const ratings = [4, 3, 2, 1];

function SearchPage() {
    const navigate = useNavigate();
    const { search } = useLocation();
    const params = new URLSearchParams(search);
    const category = params.get('category') || 'all';
    const query = params.get('query') || 'all';
    const price = params.get('price') || 'all';
    const rating = params.get('rating') || 'all';
    const order = params.get('order') || 'newest';
    const page = params.get('page') || '1';

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [products, setProducts] = useState([]);
    const [pages, setPages] = useState(1);
    const [countProducts, setCountProducts] = useState(0);
    const [categories, setCategories] = useState([]);
    const [filtersOpen, setFiltersOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await getProducts({ page, category, query, price, rating, order });
                setProducts(data.products);
                setPages(data.pages || 1);
                setCountProducts(data.countProducts);
            } catch (err) {
                setError(getError(err));
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [category, order, page, price, query, rating]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setCategories(await getCategories());
            } catch (err) {
                toast.error(getError(err));
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        setFiltersOpen(false);
    }, [search]);

    const getFilterUrl = (changes) => {
        const next = new URLSearchParams({
            category,
            query,
            price,
            rating,
            order,
            page: '1',
        });
        Object.entries(changes).forEach(([key, value]) => next.set(key, value));
        return '/search?' + next.toString();
    };

    const hasFilters = query !== 'all' || category !== 'all' || price !== 'all' || rating !== 'all';

    const filterLink = (label, key, value, selected, content) => (
        <Link
            key={String(value)}
            to={getFilterUrl({ [key]: String(value) })}
            className={'catalog-filter-option' + (selected ? ' active' : '')}
            aria-current={selected ? 'true' : undefined}
        >
            <span className="catalog-filter-indicator" aria-hidden="true"></span>
            {content || label}
        </Link>
    );

    return (
        <section className="catalog-page">
            <Helmet><title>Shop all | Nora’s Atelier</title></Helmet>

            <header className="catalog-heading">
                <span>Explore the atelier</span>
                <h1>{category === 'all' ? 'Shop all creations' : category}</h1>
                <p>Handmade gifts and styling details for celebrations, events, and photography studios.</p>
            </header>

            <div className="catalog-toolbar">
                <div className="catalog-results">
                    <strong>{countProducts}</strong> {countProducts === 1 ? 'creation' : 'creations'}
                    {query !== 'all' && <span> matching “{query}”</span>}
                </div>
                <div className="catalog-toolbar-actions">
                    <Button className="catalog-filter-toggle" onClick={() => setFiltersOpen(true)}>
                        <i className="fas fa-sliders-h" aria-hidden="true"></i>
                        Filters
                    </Button>
                    <label className="catalog-sort">
                        <span>Sort by</span>
                        <select value={order} onChange={(e) => navigate(getFilterUrl({ order: e.target.value }))}>
                            <option value="newest">Newest</option>
                            <option value="lowest">Price: low to high</option>
                            <option value="highest">Price: high to low</option>
                            <option value="toprated">Top rated</option>
                        </select>
                    </label>
                </div>
            </div>

            {filtersOpen && <button className="catalog-filter-backdrop" aria-label="Close filters" onClick={() => setFiltersOpen(false)} />}

            <div className="catalog-layout">
                <aside className={'catalog-filters' + (filtersOpen ? ' open' : '')} aria-label="Product filters">
                    <div className="catalog-filters-header">
                        <div>
                            <span>Refine results</span>
                            <h2>Filters</h2>
                        </div>
                        <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">&times;</button>
                    </div>

                    <div className="catalog-filter-group">
                        <h3>Category</h3>
                        {filterLink('All categories', 'category', 'all', category === 'all')}
                        {categories.map((item) => filterLink(item, 'category', item, category === item))}
                    </div>

                    <div className="catalog-filter-group">
                        <h3>Price</h3>
                        {filterLink('Any price', 'price', 'all', price === 'all')}
                        {prices.map((item) => filterLink(item.name, 'price', item.value, price === item.value))}
                    </div>

                    <div className="catalog-filter-group">
                        <h3>Customer rating</h3>
                        {filterLink('Any rating', 'rating', 'all', rating === 'all')}
                        {ratings.map((value) => filterLink(
                            value + ' stars & up',
                            'rating',
                            value,
                            String(rating) === String(value),
                            <Rating rating={value} caption=" & up" />
                        ))}
                    </div>

                    {hasFilters && (
                        <Button variant="link" className="catalog-clear-filters" onClick={() => navigate('/search')}>
                            <i className="fas fa-times" aria-hidden="true"></i>
                            Clear all filters
                        </Button>
                    )}
                </aside>

                <div className="catalog-products">
                    {loading ? (
                        <LoadingComponent />
                    ) : error ? (
                        <MessageComponent variant="danger">{error}</MessageComponent>
                    ) : products.length === 0 ? (
                        <div className="catalog-empty">
                            <i className="fas fa-search" aria-hidden="true"></i>
                            <h2>No creations found</h2>
                            <p>Try removing a filter or browsing the full collection.</p>
                            <Button onClick={() => navigate('/search')}>Clear filters</Button>
                        </div>
                    ) : (
                        <Row className="g-4">
                            {products.map((product) => (
                                <Col sm={6} xl={4} key={product._id}>
                                    <Product product={product} />
                                </Col>
                            ))}
                        </Row>
                    )}

                    {pages > 1 && (
                        <nav className="catalog-pagination" aria-label="Catalog pages">
                            {[...Array(pages).keys()].map((index) => {
                                const pageNumber = index + 1;
                                return (
                                    <Link
                                        key={pageNumber}
                                        to={getFilterUrl({ page: String(pageNumber) })}
                                        className={Number(page) === pageNumber ? 'active' : ''}
                                        aria-current={Number(page) === pageNumber ? 'page' : undefined}
                                    >
                                        {pageNumber}
                                    </Link>
                                );
                            })}
                        </nav>
                    )}
                </div>
            </div>
        </section>
    );
}

export default SearchPage;
