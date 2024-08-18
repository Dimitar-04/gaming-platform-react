import ps4 from './images/ps4.png';
import mouse from './images/mouse.png';
import keyboard from './images/keyboard.png';
import logo from './images/logo.png';
import { Link } from 'react-router-dom';
import { useRef, useState } from 'react';
import React from 'react';
import { useAuth } from './contexts/AuthContext';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
const db = getFirestore();

function ResetPassword() {
  const emailRef = useRef();
  const passwordRef = useRef();

  const { resetPassword } = useAuth();
  const [invalidPassword, setInvalidPassword] = useState(false);
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(false);

  const handlePasswordChange = () => {
    if (passwordRef.current.value.trim() !== '') {
      setInvalidPassword(false);
    }
  };
  const handleEmailChange = () => {
    if (emailRef.current.value.trim() !== '') {
      setInvalidEmail(false);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (emailRef.current.value === '') {
      setInvalidEmail(true);
    } else {
      try {
        setLoading(true);
        setMessage(false);
        await resetPassword(emailRef.current.value);
        setMessage('Check your email for further instructions');
      } catch (error) {
        alert(`Failed to reset password ${error.message}`);
      }
      setLoading(false);
    }
  }
  function handleChange() {
    setInvalidEmail(false);
  }
  return (
    <div className="main-container">
      <img src={ps4} alt="" className="ps4" />
      <img src={mouse} alt="" className="mouse" />
      <img src={keyboard} alt="" className="keyboard" />
      <div className="login">
        <h1 className="welcome-h1">Welcome to Vault!</h1>
        <form action="" method="get" id="login-form" onSubmit={handleSubmit}>
          <div className="login-info">
            <div className="sign-in-email">
              <label htmlFor="sign-in-email"> </label>
              <input
                type="email"
                name="email"
                id="sign-in-email"
                placeholder="E-mail"
                className={invalidEmail ? 'invalid' : ''}
                ref={emailRef}
                onChange={handleChange}
              />
              {message && <p className="message">{message}</p>}
              {invalidEmail && (
                <p className="error-message">Cannot leave this field empty</p>
              )}
            </div>

            <div className="buttons">
              <button
                className="create-profile"
                type="submit"
                disabled={loading}
              >
                Reset Password
              </button>
            </div>
            <div className="forgot-google">
              <Link to="/">
                <button className="log-in-google">Log in </button>
              </Link>
              <Link to="/signupPage">
                <button className="reset-password">Sign up</button>
              </Link>
            </div>

            <img src={logo} alt="logo" width="30%" height="30%" />
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
