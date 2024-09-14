import ps4 from './images/ps4.png';
import mouse from './images/mouse.png';
import keyboard from './images/keyboard.png';
import logo from './images/logo.png';
import { Link, useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import React from 'react';
import { useAuth } from './contexts/AuthContext';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googlProvider } from './firebase';
import { signInWithPopup } from 'firebase/auth';

const db = getFirestore();

function Sign_in() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const [incorectPassword, setIncorectPassword] = useState(false);
  const [incorrectEmail, setIncorrectEmail] = useState(false);
  const navigate = useNavigate();

  const { login } = useAuth();

  const [invalidPassword, setInvalidPassword] = useState(false);
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = () => {
    setIncorectPassword(false);
    setInvalidPassword(false);
  };
  const handleEmailChange = () => {
    if (emailRef.current.value.trim() !== '') {
      setIncorrectEmail(false);
      setInvalidEmail(false);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    let dali = 0;

    if (emailRef.current.value === '') {
      setInvalidEmail(true);
      dali = 1;
    }
    if (passwordRef.current.value === '') {
      setInvalidPassword(true);
      dali = 1;
    }
    if (dali == 0) {
      try {
        setLoading(true);
        handleButtonClick('home', null);
        await login(emailRef.current.value, passwordRef.current.value);
        navigate('/home', { replace: true });
      } catch (error) {
        handleFirebaseAuthError(error);
      }
      setLoading(false);
    }
  }
  function handleFirebaseAuthError(error) {
    const errorCode = error.code;
    switch (errorCode) {
      case 'auth/invalid-email':
        setInvalidEmail(true);
        alert('Invalid email format.');
        break;
      case 'auth/user-disabled':
        alert('User account is disabled.');
        break;
      case 'auth/user-not-found':
        setIncorrectEmail(true);

        break;
      case 'auth/wrong-password':
        setIncorectPassword(true);

        break;
      default:
        alert(`Failed to sign in: ${error.message}`);
    }
  }
  async function handlesignInWithGoogle() {
    try {
      setLoading(true);
      const userCredential = await signInWithPopup(auth, googlProvider);
      const user = userCredential.user;
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          name: '',
          username: '',
          phone: '',
        });
      }
      handleButtonClick('home', null);
      navigate('/home', { replace: true });
    } catch (error) {
      alert(`Failed to sign in ${error.message}`);
    }
    setLoading(false);
  }
  const handleButtonClick = (buttonId, callback) => {
    if (localStorage.getItem('activeButton')) {
      console.log(localStorage.getItem('activeButton'));
      localStorage.removeItem('activeButton');
      localStorage.setItem('activeButton', buttonId);
    } else {
      localStorage.setItem('activeButton', buttonId);
      console.log(localStorage.getItem('activeButton'));
    }
    if (callback) callback();
  };
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
                ref={emailRef}
                className={invalidEmail || incorrectEmail ? 'invalid' : ''}
                onChange={handleEmailChange}
              />
              {invalidEmail && (
                <p className="error-message">Cannot leave this field empty</p>
              )}
              {incorrectEmail && (
                <p className="error-message">Email doesn't exist</p>
              )}
            </div>
            <div className="password">
              <label htmlFor="password"></label>
              <input
                type="password"
                name="password"
                id="password"
                placeholder="Password"
                ref={passwordRef}
                className={invalidPassword || incorectPassword ? 'invalid' : ''}
                onChange={handlePasswordChange}
              />
              {invalidPassword && (
                <p className="error-message">Cannot leave this field empty</p>
              )}
              {incorectPassword && (
                <p className="error-message">Incorrect password</p>
              )}
            </div>
            <div className="buttons">
              <button
                className="login-btn"
                type="button"
                onClick={() => {
                  navigate('/signupPage', { replace: true });
                }}
              >
                Sign Up
              </button>

              <button className="signup-btn" type="submit" disabled={loading}>
                Log In
              </button>
            </div>
            <div className="forgot-google">
              <button
                className="log-in-google"
                onClick={handlesignInWithGoogle}
              >
                Log in with Google
              </button>
              <Link to="/resetPassword">
                <button className="reset-password">Forgot password?</button>
              </Link>
            </div>

            <img src={logo} alt="logo" width="30%" height="30%" />
          </div>
        </form>
      </div>
    </div>
  );
}

export default Sign_in;
