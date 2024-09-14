import ps4 from './images/ps4.png';
import mouse from './images/mouse.png';
import keyboard from './images/keyboard.png';
import logo from './images/logo.png';
import { Link, useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import React from 'react';
import { useAuth } from './contexts/AuthContext';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
const db = getFirestore();

function Signup() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const nameRef = useRef();
  const usernameRef = useRef();
  const phoneRef = useRef();
  const confirmRef = useRef();
  const { signup } = useAuth();
  const nav = useNavigate();
  const [invalidPassword, setInvalidPassword] = useState(false);
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [invalidName, setInvalidName] = useState(false);
  const [invalidMatch, setInvalidMatch] = useState(false);
  const [invalidConfirm, setInvalidConfirm] = useState(false);
  const [invalidUsername, setInvalidUsername] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [shortUsername, setShortUsername] = useState(false);
  const [shortPassword, setShortPassword] = useState(false);

  const handleUsernameChange = () => {
    if (usernameRef.current.value.trim() !== '') {
      setInvalidUsername(false);
      setShortUsername(false);
    }
  };
  const handlePasswordChange = () => {
    setInvalidMatch(false);
    setInvalidPassword(false);
    setInvalidConfirm(false);
    setShortPassword(false);
  };
  const handleEmailChange = () => {
    if (emailRef.current.value.trim() !== '') {
      setInvalidEmail(false);
    }
  };
  const handleNameChange = () => {
    if (nameRef.current.value.trim() !== '') {
      setInvalidName(false);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    let dali = 0;

    if (emailRef.current.value === '') {
      setInvalidEmail(true);
      dali = 1;
    }
    if (nameRef.current.value === '') {
      setInvalidName(true);
      dali = 1;
    }
    if (usernameRef.current.value === '') {
      setInvalidUsername(true);
      dali = 1;
    }
    if (passwordRef.current.value === '' && !invalidMatch) {
      setInvalidPassword(true);
      dali = 1;
    }
    if (
      passwordRef.current.value.length < 7 &&
      passwordRef.current.value !== ''
    ) {
      setShortPassword(true);
      dali = 1;
    }
    if (confirmRef.current.value === '') {
      setInvalidConfirm(true);
      dali = 1;
    }
    if (
      (usernameRef.current.value.length < 5 ||
        usernameRef.current.value.length > 21) &&
      usernameRef.current.value !== ''
    ) {
      setShortUsername(true);
    }

    if (dali == 0) {
      if (passwordRef.current.value !== confirmRef.current.value) {
        setInvalidMatch(true);
        return;
      } else {
        setLoading(true);
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          where('username', '==', usernameRef.current.value)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setUserExists(true);

          setLoading(false);
        } else {
          try {
            const userCredential = await signup(
              emailRef.current.value,
              passwordRef.current.value
            );
            const user = userCredential.user;
            await setDoc(doc(db, 'users', user.uid), {
              name: nameRef.current.value,
              username: usernameRef.current.value,
              phone: phoneRef.current.value,
            });
            handleButtonClick('home', null);
            nav('/home', { replace: true });
          } catch (error) {
            alert(`Failed to create an account ${error.message}`);
          }
        }
      }
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
    }
    if (callback) callback();
  };

  return (
    <div className="main-container">
      <img src={ps4} alt="" className="ps4" />
      <img src={mouse} alt="" className="mouse" />
      <img src={keyboard} alt="" className="keyboard" />
      <div className="signup-container">
        <img src={logo} alt="logo" className="logo" />
        <h1 className="signup-h1">Join the Vault Gaming Community!</h1>

        <form action="" method="post" id="signup-form" onSubmit={handleSubmit}>
          <div className="signup-info">
            <div className="name-email-password">
              <div className="input-container">
                <label htmlFor="name"> NAME</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  ref={nameRef}
                  className={invalidName ? 'invalid' : ''}
                  onChange={handleNameChange}
                />

                {invalidName && (
                  <p className="error-message">Cannot leave this field empty</p>
                )}
              </div>
              <div className="input-container">
                <label htmlFor="email">E-MAIL</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="e.g dimiarsov@gmail.com"
                  ref={emailRef}
                  className={invalidEmail ? 'invalid' : ''}
                  onChange={handleEmailChange}
                />
                {invalidEmail && (
                  <p className="error-message">Cannot leave this field empty</p>
                )}
              </div>

              <div className="input-container">
                <label htmlFor="password">PASSWORD</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  ref={passwordRef}
                  className={invalidPassword || shortPassword ? 'invalid' : ''}
                  onChange={handlePasswordChange}
                />
                {invalidMatch && (
                  <p className="error-message">Passwords do not match</p>
                )}
                {invalidPassword && (
                  <p className="error-message">Cannot leave this field empty</p>
                )}
                {shortPassword && (
                  <p className="error-message">
                    Password must be at least 7 characters
                  </p>
                )}
              </div>
            </div>

            <div className="last-phone-confirm">
              <div className="input-container">
                <label htmlFor="username">USERNAME </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  ref={usernameRef}
                  className={invalidUsername || userExists ? 'invalid' : ''}
                  onChange={handleUsernameChange}
                />
                {invalidUsername && (
                  <p className="error-message">Cannot leave this field empty</p>
                )}
                {userExists && (
                  <p className="error-message">Username already exists</p>
                )}
                {shortUsername && (
                  <p className="error-message">
                    Username must be 5-15 characters
                  </p>
                )}
              </div>

              <div className="input-container">
                <label htmlFor="phone">PHONE NUMBER (OPTIONAL)</label>
                <input type="number" id="phone" name="phone" ref={phoneRef} />
              </div>

              <div className="input-container">
                <label htmlFor="confirm">CONFIRM PASSWORD</label>
                <input
                  type="password"
                  id="confirm"
                  name="confirm"
                  ref={confirmRef}
                  className={invalidConfirm ? 'invalid' : ''}
                  onChange={handlePasswordChange}
                />
                {invalidMatch && (
                  <p className="error-message">Passwords do not match</p>
                )}
                {invalidConfirm && (
                  <p className="error-message">Cannot leave this field empty</p>
                )}
              </div>
            </div>
          </div>

          <button type="submit" className="create-profile" disabled={loading}>
            CREATE PROFILE
          </button>

          <p>
            Already have an account?{' '}
            <span
              style={{
                color: 'blue',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
              onClick={() => {
                nav('/', { replace: true });
              }}
            >
              Log in
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Signup;
