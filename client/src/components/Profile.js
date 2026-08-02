import React, { useContext, useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import getError from '../util';
import { Store } from '../helpersComponents/Store';
import { updateProfile } from '../service/userService';

function Profile() {
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { userInfo } = state;
  const [username, setUsername] = useState(userInfo.username);
  const [email, setEmail] = useState(userInfo.email);
  const [password, setPassword] = useState('');
  const [repass, setRepass] = useState('');
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const initials = (username || 'Nora')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      if (password !== repass) {
        throw new Error('The passwords don’t match. Please enter them again.');
      }
      setLoadingUpdate(true);

      const data = await updateProfile(
        userInfo,
        username,
        email,
        password,
        repass
      );

      setLoadingUpdate(false);
      ctxDispatch({ type: 'USER_LOGIN', payload: data });
      toast.success('Your profile has been updated.');
    } catch (err) {
      setLoadingUpdate(false);
      toast.error(getError(err) || err);
    }
  };

  useEffect(() => {
    localStorage.setItem('userInfo', JSON.stringify(state.userInfo));
  }, [state.userInfo]);

  return (
    <section className="profile-page">
      <Helmet>
        <title>My profile | Nora’s Atelier</title>
      </Helmet>

      <div className="profile-shell">
        <aside className="profile-summary">
          <span className="profile-eyebrow">Your account</span>
          <div className="profile-avatar" aria-hidden="true">{initials}</div>
          <h1>{username}</h1>
          <p>{email}</p>
          <div className="profile-summary-note">
            <i className="fas fa-shield-alt" aria-hidden="true"></i>
            <div>
              <strong>Your details are private</strong>
              <span>We use them only to manage your account and orders.</span>
            </div>
          </div>
        </aside>

        <div className="profile-card">
          <header className="profile-heading">
            <span>Account details</span>
            <h2>Keep your profile up to date</h2>
            <p>Update your contact information or choose a new password.</p>
          </header>

          <Form onSubmit={submitHandler} className="profile-form">
            <div className="profile-form-grid">
              <Form.Group controlId="profile-username">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  autoComplete="username"
                  required
                  onChange={(e) => setUsername(e.target.value)}
                  value={username}
                />
              </Form.Group>
              <Form.Group controlId="profile-email">
                <Form.Label>Email address</Form.Label>
                <Form.Control
                  type="email"
                  autoComplete="email"
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                />
              </Form.Group>
            </div>

            <div className="profile-password-section">
              <div className="profile-section-heading">
                <div>
                  <h3>Change password</h3>
                  <p>Leave both fields blank to keep your current password.</p>
                </div>
                <i className="fas fa-key" aria-hidden="true"></i>
              </div>
              <div className="profile-form-grid">
                <Form.Group controlId="profile-password">
                  <Form.Label>New password</Form.Label>
                  <Form.Control
                    type="password"
                    autoComplete="new-password"
                    placeholder="Enter a new password"
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                  />
                </Form.Group>
                <Form.Group controlId="profile-password-confirmation">
                  <Form.Label>Confirm new password</Form.Label>
                  <Form.Control
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repeat the new password"
                    onChange={(e) => setRepass(e.target.value)}
                    value={repass}
                  />
                </Form.Group>
              </div>
            </div>

            <div className="profile-actions">
              <span><i className="fas fa-lock" aria-hidden="true"></i> Secure account update</span>
              <Button type="submit" className="profile-submit" disabled={loadingUpdate}>
                {loadingUpdate ? (
                  <><span className="profile-button-spinner" aria-hidden="true"></span> Saving changes…</>
                ) : (
                  <>Save changes <i className="fas fa-arrow-right" aria-hidden="true"></i></>
                )}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </section>
  );
}

export default Profile;
