import React, { useContext, useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Store } from '../helpersComponents/Store';
import { toast } from 'react-toastify';
import { register } from '../service/userService';

function Register() {
    const navigate = useNavigate();
    const { search } = useLocation();
    const redirect = new URLSearchParams(search).get('redirect') || '/';
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repass, setRepass] = useState('');
    const { state, dispatch: ctxDispatch } = useContext(Store);

    const submitHandler = async (e) => {
        e.preventDefault();
        if (password !== repass) {
            toast.error('Passwords do not match');
            return;
        }
        try {
            const data = await register(username, email, password);
            ctxDispatch({ type: 'USER_REGISTER', payload: data });
            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate(redirect);
        } catch (err) {
            toast.error(err.message || 'Unable to create your account');
        }
    };

    useEffect(() => {
        if (state.userInfo) navigate(redirect);
    }, [navigate, redirect, state.userInfo]);

    return (
        <section className="auth-page">
            <Helmet><title>Create account | Nora’s Atelier</title></Helmet>
            <div className="auth-visual auth-visual-register" aria-hidden="true">
                <div className="auth-visual-copy">
                    <span>Thoughtfully handmade</span>
                    <h2>Find the details that turn occasions into lasting memories.</h2>
                </div>
            </div>
            <div className="auth-panel">
                <div className="auth-heading">
                    <img src="/images/noras-atelier-logo.png" alt="" />
                    <span>Join Nora’s Atelier</span>
                    <h1>Create your account</h1>
                    <p>Save favorites and enjoy a smoother checkout experience.</p>
                </div>
                <Form onSubmit={submitHandler} className="auth-form">
                    <Form.Group controlId="register-username">
                        <Form.Label>Full name</Form.Label>
                        <Form.Control autoComplete="name" placeholder="Your name" minLength={2} required onChange={(e) => setUsername(e.target.value)} />
                    </Form.Group>
                    <Form.Group controlId="register-email">
                        <Form.Label>Email address</Form.Label>
                        <Form.Control type="email" autoComplete="email" placeholder="you@example.com" required onChange={(e) => setEmail(e.target.value)} />
                    </Form.Group>
                    <div className="auth-form-row">
                        <Form.Group controlId="register-password">
                            <Form.Label>Password</Form.Label>
                            <Form.Control type="password" autoComplete="new-password" placeholder="At least 6 characters" minLength={6} required onChange={(e) => setPassword(e.target.value)} />
                        </Form.Group>
                        <Form.Group controlId="register-repeat-password">
                            <Form.Label>Confirm password</Form.Label>
                            <Form.Control type="password" autoComplete="new-password" placeholder="Repeat password" minLength={6} required onChange={(e) => setRepass(e.target.value)} />
                        </Form.Group>
                    </div>
                    <Button type="submit" className="auth-submit">Create account</Button>
                    <p className="auth-switch">Already have an account? <Link to={'/login?redirect=' + redirect}>Sign in</Link></p>
                </Form>
            </div>
        </section>
    );
}

export default Register;
