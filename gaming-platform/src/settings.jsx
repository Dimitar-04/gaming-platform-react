import logo from './images/logo-light.png';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './contexts/AuthContext';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from './contexts/UserContext';
import {
  faHouse,
  faCirclePlus,
  faPeopleGroup,
  faGear,
  faUser,
  faPenToSquare,
  faPen,
} from '@fortawesome/free-solid-svg-icons';

import { upload, uploadBackground } from './firebase';

export default function Settings() {
  const { currentUser, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [userexists, setUserExists] = useState(false);
  const [photoURL, setPhotoURL] = useState(
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFCzxivJXCZk0Kk8HsHujTO3Olx0ngytPrWw&s'
  );
  const [photo, setPhoto] = useState(null);
  const [name, setName] = useState('');
  const [backgroundPhoto, setBackgroundPhoto] = useState(null);
  const usernameRef = useRef(null);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const nav = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const { activeButton, setActiveButton } = useContext(UserContext);
  const [loadingBackground, setLoadingBackground] = useState(false);
  const [loadingProfilePic, setLoadingProfilePic] = useState(false);
  const [editUsername, setEditUsername] = useState(currentUser.username);
  const toggleEdit = () => setIsEditing(!isEditing);
  const db = getFirestore();

  const handleUsernameChange = (e) => {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setIsEditing(false);
      }
    });
    setUserExists(false);
    setEditUsername(e.target.value);
  };

  const saveUsername = async () => {
    if (editUsername !== '') {
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
          const userRef = doc(db, 'users', currentUser.uid);

          await updateDoc(userRef, {
            username: editUsername,
          });
          setIsEditing(false);

          setUsername(editUsername);
        } catch (error) {
          console.error('Error updating username', error);
        }
      }
    } else {
      setIsEditing(false);
      return;
    }
  };

  async function handleLogout() {
    try {
      localStorage.removeItem('currentPhotoURL');
      localStorage.removeItem('currentUsername');
      await logout();

      nav('/');
    } catch (error) {
      alert('Failed to log out', error.message);
    }
  }

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) {
        console.log('No user logged in');
        setLoading(false);
        return;
      }
      const db = getFirestore();
      if (currentUser && currentUser.uid) {
        const useRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(useRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();

          if (userData.photoURL) {
            setPhotoURL(userData.photoURL);
          }
          if (userData.name) {
            setName(userData.name);
          }
          if (userData.backgroundPhoto) {
            setBackgroundPhoto(userData.backgroundPhoto);
          }

          if (userSnap.data().username == '') {
            setUsername(currentUser.email);
          } else {
            setUsername(userSnap.data().username);
          }
        } else {
          console.log('No user data found');
        }
      }
      setLoading(false);
    };
    fetchUserProfile();
  }, [currentUser, setPhotoURL, setPhoto, setBackgroundPhoto]);

  async function handleChange(e) {
    if (e.target.files[0]) {
      setPhoto(e.target.files[0]);
      setUploadStatus('uploading');
      await handleUpload(e.target.files[0]);
      setUploadStatus('uploaded');
      setTimeout(() => setUploadStatus('idle'), 1000);
    }
  }
  async function handleBackgroundChange(e) {
    if (e.target.files[0]) {
      setBackgroundPhoto(e.target.files[0]);

      await handleBackgroundUpload(e.target.files[0]);
    }
  }
  async function handleBackgroundUpload(file) {
    setLoadingBackground(true);
    try {
      await uploadBackground(file, currentUser, setLoadingBackground);
      const db = getFirestore();
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.backgroundPhoto) {
          setBackgroundPhoto(userData.backgroundPhoto);
        }
      }
    } catch (error) {
      console.error('Error uploading photo', error);
    } finally {
      setLoadingBackground(false);
    }
  }

  async function handleUpload(file) {
    setLoadingProfilePic(true);
    try {
      await upload(file, currentUser, setLoadingProfilePic);
      const db = getFirestore();
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.photoURL) {
          setPhotoURL(userData.photoURL);
        }
      }
    } catch (error) {
      console.error('Error uploading photo', error);
    } finally {
      setLoadingProfilePic(false);
    }
  }

  useEffect(() => {
    if (currentUser && currentUser.photoURL && currentUser.backgroundPhoto) {
      setPhotoURL(currentUser.photoURL);
      setBackgroundPhoto(currentUser.backgroundPhoto);
    }
  }, [currentUser]);
  const handleButtonClick = (buttonId, callback) => {
    if (localStorage.getItem('activeButton')) {
      console.log(localStorage.getItem('activeButton'));
      console.log(buttonId);
      localStorage.removeItem('activeButton');
      localStorage.setItem('activeButton', buttonId);
    } else {
      localStorage.setItem('activeButton', buttonId);
    }
    if (callback) callback();
  };
  return (
    <div className="main-container-home2">
      <div className="sidebar">
        <img src={logo} alt="" className="light-logo2" />

        <div className="menu">
          <Link to="/home" className="menu-home-link">
            <button
              className="menu-home-btn"
              onClick={() =>
                handleButtonClick('home', () => {
                  localStorage.removeItem('searchTitle');
                })
              }
            >
              <div className="menu-icon2">
                <FontAwesomeIcon icon={faHouse} />
              </div>
              <div className="menu-text2">
                <span>Home</span>
              </div>
            </button>
          </Link>
          <Link to="/connect" className="menu-home-link">
            <button
              className="menu-home-btn"
              onClick={() =>
                handleButtonClick('connect', () => {
                  localStorage.removeItem('searchTitle');
                })
              }
            >
              <div className="menu-icon">
                <FontAwesomeIcon icon={faPeopleGroup} />
              </div>
              <div className="menu-text">
                <span>Connect</span>
              </div>
            </button>
          </Link>
          <Link to="/settings" className="menu-home-link">
            <button
              className={`menu-home-btn ${
                (localStorage.getItem('activeButton') || activeButton) ===
                'settings'
                  ? 'active'
                  : ''
              }`}
              onClick={() => {
                handleButtonClick('settings', null);
              }}
            >
              <div className="menu-icon">
                <FontAwesomeIcon icon={faGear} />
              </div>
              <div className="menu-text">
                <span>Settings</span>
              </div>
            </button>
          </Link>

          <Link to="/profile" className="menu-home-link">
            <button
              className="menu-home-btn"
              onClick={() => {
                handleButtonClick('profile', null);
              }}
            >
              <div className="menu-icon">
                <img className="user-image2" src={photoURL} />
              </div>
              <div className="menu-text">
                <span>Profile</span>
              </div>
            </button>
          </Link>
        </div>
      </div>
      <div className="home-main">
        <div className="user-background-image">
          {loadingBackground ? (
            <div className="spinner"></div>
          ) : (
            backgroundPhoto && (
              <img
                src={backgroundPhoto}
                alt="background"
                className="background-image-settings"
              />
            )
          )}
        </div>
        <div className="user-background">
          <button
            className="faPen2"
            onClick={() => document.getElementById('file-input2').click()}
          >
            <FontAwesomeIcon icon={faPen} />
          </button>
          <div className="user-img-large-div">
            <div className="image-container">
              <img
                className="user-image-large"
                src={photoURL}
                alt="priflePic"
              />
              <div
                className={`${
                  uploadStatus == 'uploaded' || loadingProfilePic
                    ? 'overlay-visible'
                    : 'overlay'
                }`}
                onClick={() => document.getElementById('file-input').click()}
                style={{
                  cursor:
                    loadingProfilePic || uploadStatus == 'uploaded'
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {uploadStatus === 'uploading'
                  ? 'Uploading...'
                  : uploadStatus === 'uploaded'
                  ? 'Uploaded'
                  : 'Change Photo'}
              </div>
            </div>
          </div>
        </div>

        <div className="profile">
          <div className="profile-info">
            <div className="profilepicture-div">
              <input
                type="file"
                id="file-input"
                className="choose-file"
                onChange={handleChange}
                style={{ display: 'none' }}
              />
              <input
                type="file"
                id="file-input2"
                className="choose-file"
                onChange={handleBackgroundChange}
                style={{ display: 'none' }}
              />
            </div>
            <div className="info-edit-div">
              <h1>Name: </h1>
              <h2>Username: </h2>
              <h2>Email: </h2>
              <button
                className="change-pass-btn"
                onClick={() => {
                  nav('/resetPassword');
                }}
                style={{ marginRight: '2%' }}
              >
                Change Password?
              </button>
            </div>
            <div className="edit-div">
              <h1> {name}</h1>
              {isEditing ? (
                <>
                  {document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                      setIsEditing(false);
                    }
                  })}

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      height: '100%',
                      width: '100%',
                    }}
                  >
                    <input
                      type="text"
                      value={editUsername}
                      onChange={handleUsernameChange}
                      ref={usernameRef}
                      placeholder="Enter new username"
                      id="change-username"
                      className={userexists ? 'invalid' : ''}
                    />
                    {userexists && (
                      <p className="error-message2">Username already exists</p>
                    )}

                    <button onClick={saveUsername}>Save</button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      display: 'flex',
                      gap: '15px',
                      alignItems: 'center',
                      height: '100%',
                      width: '100%',
                    }}
                  >
                    <h2> {username}</h2>
                    <button
                      className="edit-btn"
                      onClick={() => {
                        setEditUsername('');
                        toggleEdit();
                      }}
                    >
                      <FontAwesomeIcon icon={faPenToSquare} />
                    </button>
                  </div>
                </>
              )}
              <h2>{currentUser && currentUser.email}</h2>
              <button className="logout-btn2" onClick={handleLogout}>
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
