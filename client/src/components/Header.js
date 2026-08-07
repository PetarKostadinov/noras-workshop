import React, { useContext, useEffect, useState } from 'react';
import { Badge, Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { Store } from '../helpersComponents/Store';
import SearchInput from './SearchInput';
import { toast } from 'react-toastify';
import getError from '../util';
import { getCategories } from '../service/productService';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../helpersComponents/LanguageSwitcher';

function Header() {
    const [categories, setCategories] = useState([]);
    const { state, dispatch: ctxDispatch } = useContext(Store);
    const { cart, userInfo } = state;
    const navigate = useNavigate();
    const { t } = useTranslation();

    const logoutHandler = () => {
        ctxDispatch({ type: 'USER_LOGOUT' });
        navigate('/');
    };

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

    return (
        <header className="site-header">
            <Navbar variant="dark" expand="lg" className="main-navbar">
                <Container className="header-container">
                    <LinkContainer to="/">
                        <Navbar.Brand className="brand-lockup">
                            <img src="/images/noras-workshop-logo.png" alt="" className="brand-mark" />
                            <span className="brand-copy">
                                <span className="brand-name">Nora’s Workshop</span>
                                <span className="brand-tagline">{t('Handmade gifts & décor')}</span>
                            </span>
                        </Navbar.Brand>
                    </LinkContainer>
                    <Navbar.Collapse id="main-navbar-nav" className="desktop-navigation">
                        <SearchInput />
                        <Nav className="header-actions ms-auto">
                            <Link to="/cart" className="nav-link header-action-link">
                                <i className="fas fa-shopping-bag" aria-hidden="true"></i>
                                <span>{t('Cart')}</span>
                                {cart.cartItems.length > 0 && (
                                    <Badge pill className="cart-badge">
                                        {cart.cartItems.reduce((total, item) => total + item.quantity, 0)}
                                    </Badge>
                                )}
                            </Link>
                            {userInfo ? (
                                <NavDropdown title={userInfo.username} id="account-nav-dropdown" className="header-dropdown">
                                    <LinkContainer to="/profile"><NavDropdown.Item>{t('Profile')}</NavDropdown.Item></LinkContainer>
                                    <LinkContainer to="/orderhistory"><NavDropdown.Item>{t('Order history')}</NavDropdown.Item></LinkContainer>
                                    <NavDropdown.Divider />
                                    <Link className="dropdown-item" to="#logout" onClick={logoutHandler}>{t('Logout')}</Link>
                                </NavDropdown>
                            ) : (
                                <>
                                    <Link className="nav-link header-action-link" to="/login">
                                        <i className="far fa-user" aria-hidden="true"></i>
                                        {t('Sign in')}
                                    </Link>
                                    <Link className="nav-link header-register-link" to="/register">{t('Register')}</Link>
                                </>
                            )}
                            {userInfo && userInfo.isAdmin && (
                                <NavDropdown title={t('Admin')} id="admin-nav-dropdown" className="header-dropdown">
                                    <LinkContainer to="/create"><NavDropdown.Item>{t('Add product')}</NavDropdown.Item></LinkContainer>
                                    <LinkContainer to="/admin/dashboard"><NavDropdown.Item>{t('Dashboard')}</NavDropdown.Item></LinkContainer>
                                    <LinkContainer to="/admin/productlist"><NavDropdown.Item>{t('Products')}</NavDropdown.Item></LinkContainer>
                                    <LinkContainer to="/admin/orderlist"><NavDropdown.Item>{t('Orders')}</NavDropdown.Item></LinkContainer>
                                    <LinkContainer to="/admin/userlist"><NavDropdown.Item>{t('Users')}</NavDropdown.Item></LinkContainer>
                                </NavDropdown>
                            )}
                            <LanguageSwitcher />
                        </Nav>
                    </Navbar.Collapse>
                    <div className="mobile-header-actions">
                        <Nav className="mobile-quick-links">
                            {userInfo && userInfo.isAdmin && (
                                <NavDropdown
                                    title={<><i className="fas fa-tools" aria-hidden="true"></i><span>{t('Admin')}</span></>}
                                    id="mobile-admin-nav-dropdown"
                                    className="header-dropdown mobile-account-menu"
                                >
                                    <LinkContainer to="/create"><NavDropdown.Item>{t('Add product')}</NavDropdown.Item></LinkContainer>
                                    <LinkContainer to="/admin/dashboard"><NavDropdown.Item>{t('Dashboard')}</NavDropdown.Item></LinkContainer>
                                    <LinkContainer to="/admin/productlist"><NavDropdown.Item>{t('Products')}</NavDropdown.Item></LinkContainer>
                                    <LinkContainer to="/admin/orderlist"><NavDropdown.Item>{t('Orders')}</NavDropdown.Item></LinkContainer>
                                    <LinkContainer to="/admin/userlist"><NavDropdown.Item>{t('Users')}</NavDropdown.Item></LinkContainer>
                                </NavDropdown>
                            )}
                            {userInfo ? (
                                <NavDropdown
                                    title={<><i className="far fa-user" aria-hidden="true"></i><span>{t('Profile')}</span></>}
                                    id="mobile-account-nav-dropdown"
                                    className="header-dropdown mobile-account-menu"
                                >
                                    <LinkContainer to="/profile"><NavDropdown.Item>{t('Profile')}</NavDropdown.Item></LinkContainer>
                                    <LinkContainer to="/orderhistory"><NavDropdown.Item>{t('Order history')}</NavDropdown.Item></LinkContainer>
                                    {userInfo.isAdmin && (
                                        <>
                                            <NavDropdown.Divider />
                                            <LinkContainer to="/admin/dashboard"><NavDropdown.Item>{t('Admin')}</NavDropdown.Item></LinkContainer>
                                            <LinkContainer to="/create"><NavDropdown.Item>{t('Add product')}</NavDropdown.Item></LinkContainer>
                                        </>
                                    )}
                                    <NavDropdown.Divider />
                                    <Link className="dropdown-item" to="#logout" onClick={logoutHandler}>{t('Logout')}</Link>
                                </NavDropdown>
                            ) : (
                                <Link className="nav-link mobile-quick-link" to="/login">
                                    <i className="far fa-user" aria-hidden="true"></i>
                                    <span>{t('Sign in')}</span>
                                </Link>
                            )}
                            <Link to="/cart" className="nav-link mobile-quick-link mobile-cart-link">
                                <span className="mobile-icon-wrap">
                                    <i className="fas fa-shopping-bag" aria-hidden="true"></i>
                                    {cart.cartItems.length > 0 && (
                                        <Badge pill className="cart-badge mobile-cart-badge">
                                            {cart.cartItems.reduce((total, item) => total + item.quantity, 0)}
                                        </Badge>
                                    )}
                                </span>
                                <span>{t('Cart')}</span>
                            </Link>
                        </Nav>
                    </div>
                    <div className="mobile-search-row">
                        <SearchInput />
                        <LanguageSwitcher />
                    </div>
                </Container>
            </Navbar>
            <nav className="category-bar" aria-label="Product categories">
                <Container className="category-bar-inner">
                    <Link to="/search" className="category-bar-link category-bar-all">{t('Shop all')}</Link>
                    {categories.map((category) => (
                        <Link
                            key={category}
                            to={'/search?category=' + encodeURIComponent(category)}
                            className="category-bar-link"
                        >
                            {t(category)}
                        </Link>
                    ))}
                    <span className="category-bar-note">
                        <i className="fas fa-heart" aria-hidden="true"></i>
                        {t('Handmade with care')}
                    </span>
                </Container>
            </nav>
        </header>
    );
}

export default Header;
