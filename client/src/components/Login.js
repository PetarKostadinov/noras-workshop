import React, { useContext, useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Store } from '../helpersComponents/Store';
import { toast } from 'react-toastify';
import { loginUser } from '../service/userService';
import getError, { getSafeRedirect } from '../util';
import { useTranslation } from 'react-i18next';

function Login() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { search } = useLocation();
    const redirect = getSafeRedirect(search);
    const isCheckoutRedirect = ['/shipping', '/payment', '/order'].includes(redirect);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { state, dispatch: ctxDispatch } = useContext(Store);

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            const data = await loginUser(email, password);
            ctxDispatch({ type: 'USER_LOGIN', payload: data });
            navigate(redirect);
        } catch (error) {
            toast.error(getError(error, 'We couldn’t sign you in. Please try again.'));
        }
    };

    useEffect(() => {
        if (state.userInfo) navigate(redirect);
    }, [navigate, redirect, state.userInfo]);

    return (
        <section className="auth-page">
            <Helmet><title>Sign in | Nora’s Workshop</title></Helmet>
            <div className="auth-visual auth-visual-login" aria-hidden="true">
                <div className="auth-visual-copy">
                    <span>{t('Crafted with care')}</span><h2>{t('Welcome back to your collection of beautiful moments.')}</h2>
                </div>
            </div>
            <div className="auth-panel">
                <div className="auth-heading">
                    <img src="/images/noras-workshop-logo.png" alt="" />
                    <span>{t('Welcome back')}</span>
                    <h1>{t('Sign in to your account')}</h1>
                    <p>{isCheckoutRedirect
                        ? t('Sign in to continue securely with your checkout. Your cart is waiting for you.')
                        : t('Continue shopping handmade gifts and thoughtful décor.')}</p>
                </div>
                <Form onSubmit={submitHandler} className="auth-form">
                    <Form.Group controlId="login-email">
                        <Form.Label>{t('Email address')}</Form.Label>
                        <Form.Control type="email" autoComplete="email" placeholder="you@example.com" required onChange={(e) => setEmail(e.target.value)} />
                    </Form.Group>
                    <Form.Group controlId="login-password">
                        <Form.Label>{t('Password')}</Form.Label>
                        <Form.Control type="password" autoComplete="current-password" placeholder={t('Enter your password')} required onChange={(e) => setPassword(e.target.value)} />
                    </Form.Group>
                    <Button type="submit" className="auth-submit">{t('Sign in')}</Button>
                    <p className="auth-switch">{t('New to Nora’s Workshop?')} <Link to={'/register?redirect=' + encodeURIComponent(redirect)}>{t('Create an account')}</Link></p>
                </Form>
            </div>
        </section>
    );
}

export default Login;
