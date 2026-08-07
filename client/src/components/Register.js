import React, { useContext, useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Store } from '../helpersComponents/Store';
import { toast } from 'react-toastify';
import { register } from '../service/userService';
import getError, { getSafeRedirect } from '../util';
import { useTranslation } from 'react-i18next';

function Register() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { search } = useLocation();
    const redirect = getSafeRedirect(search);
    const isCheckoutRedirect = ['/shipping', '/payment', '/order'].includes(redirect);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repass, setRepass] = useState('');
    const { state, dispatch: ctxDispatch } = useContext(Store);

    const submitHandler = async (e) => {
        e.preventDefault();
        if (password !== repass) {
            toast.error('The passwords don’t match. Please enter them again.');
            return;
        }
        try {
            const data = await register(username, email, password);
            ctxDispatch({ type: 'USER_REGISTER', payload: data });
            navigate(redirect);
        } catch (err) {
            toast.error(getError(err, 'We couldn’t create your account. Please try again.'));
        }
    };

    useEffect(() => {
        if (state.userInfo) navigate(redirect);
    }, [navigate, redirect, state.userInfo]);

    return (
        <section className="auth-page">
            <Helmet><title>Create account | Nora’s Workshop</title></Helmet>
            <div className="auth-visual auth-visual-register" aria-hidden="true">
                <div className="auth-visual-copy">
                    <span>{t('Thoughtfully handmade')}</span><h2>{t('Find the details that turn occasions into lasting memories.')}</h2>
                </div>
            </div>
            <div className="auth-panel">
                <div className="auth-heading">
                    <img src="/images/noras-workshop-logo.png" alt="" />
                    <span>{t('Join Nora’s Workshop')}</span>
                    <h1>{t('Create your account')}</h1>
                    <p>{isCheckoutRedirect
                        ? t('Create your account to continue checkout. Everything in your cart will stay in place.')
                        : t('Create an account for secure checkout and easy access to your orders.')}</p>
                </div>
                <Form onSubmit={submitHandler} className="auth-form">
                    <Form.Group controlId="register-username">
                            <Form.Label>{t('Full name')}</Form.Label>
                            <Form.Control autoComplete="name" placeholder={t('Your name')} minLength={2} required onChange={(e) => setUsername(e.target.value)} />
                    </Form.Group>
                    <Form.Group controlId="register-email">
                        <Form.Label>{t('Email address')}</Form.Label>
                        <Form.Control type="email" autoComplete="email" placeholder="you@example.com" required onChange={(e) => setEmail(e.target.value)} />
                    </Form.Group>
                    <div className="auth-form-row">
                        <Form.Group controlId="register-password">
                            <Form.Label>{t('Password')}</Form.Label>
                            <Form.Control type="password" autoComplete="new-password" placeholder={t('At least 6 characters')} minLength={6} required onChange={(e) => setPassword(e.target.value)} />
                        </Form.Group>
                        <Form.Group controlId="register-repeat-password">
                            <Form.Label>{t('Confirm password')}</Form.Label>
                            <Form.Control type="password" autoComplete="new-password" placeholder={t('Repeat password')} minLength={6} required onChange={(e) => setRepass(e.target.value)} />
                        </Form.Group>
                    </div>
                    <Button type="submit" className="auth-submit">{t('Create account')}</Button>
                    <p className="auth-switch">{t('Already have an account?')} <Link to={'/login?redirect=' + encodeURIComponent(redirect)}>{t('Sign in')}</Link></p>
                </Form>
            </div>
        </section>
    );
}

export default Register;
