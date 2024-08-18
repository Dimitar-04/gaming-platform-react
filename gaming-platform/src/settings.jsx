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
import {
  faHouse,
  faCirclePlus,
  faPeopleGroup,
  faGear,
  faUser,
  faPenToSquare,
} from '@fortawesome/free-solid-svg-icons';

import { upload } from './firebase';

export default function Settings() {
  const { currentUser, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [userexists, setUserExists] = useState(false);
  const [photoURL, setPhotoURL] = useState(
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFCzxivJXCZk0Kk8HsHujTO3Olx0ngytPrWw&s'
  );
  const [photo, setPhoto] = useState(null);
  const usernameRef = useRef(null);
  const nav = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(currentUser.username);
  const toggleEdit = () => setIsEditing(!isEditing);
  const db = getFirestore();

  const handleUsernameChange = (e) => {
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
      alert('error');
    }
  };

  async function handleLogout() {
    try {
      await logout();
      localStorage.removeItem('currentPhotoURL');
      localStorage.removeItem('currentUsername');
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
  }, [currentUser]);

  function handleChange(e) {
    if (e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  }
  console.log(currentUser);
  async function handleUpload() {
    await upload(photo, currentUser, setLoading);
    const db = getFirestore();
    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.photoURL) {
        setPhotoURL(userData.photoURL);
      }
    }
  }

  useEffect(() => {
    if (currentUser && currentUser.photoURL) {
      setPhotoURL(currentUser.photoURL);
    }
  }, [currentUser]);
  return (
    <div className="main-container-home">
      <div className="sidebar">
        <img src={logo} alt="" className="light-logo" />

        <div className="menu">
          <Link to="/home">
            <button>
              <FontAwesomeIcon icon={faHouse} />
              Home
            </button>
          </Link>

          <Link to="/connect">
            <button>
              <FontAwesomeIcon icon={faPeopleGroup} />
              Connect
            </button>
          </Link>
          <a href="">
            <button>
              <FontAwesomeIcon icon={faGear} />
              Settings
            </button>
          </a>
          <Link to="/profile">
            <button>
              <FontAwesomeIcon icon={faUser} />
              Profile
            </button>
          </Link>
        </div>
      </div>
      <div className="home-main">
        <h1 className="welcome-h1">Welcome, {username}!</h1>
        <div className="profile">
          <h1>Profile</h1>
          <div className="profile-info">
            <img className="user-image-large" src={photoURL} alt="priflePic" />
            <div className="profilepicture-div">
              <input
                type="file"
                id="file-input"
                className="choose-file"
                onChange={handleChange}
              />
              <button
                disabled={loading || !photo}
                className="upload-btn"
                onClick={handleUpload}
              >
                Upload
              </button>
            </div>
            <div className="edit-div">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={handleUsernameChange}
                    ref={usernameRef}
                    className={userexists ? 'invalid' : ''}
                  />
                  {userexists && (
                    <p className="error-message">Username already exists</p>
                  )}
                  <button onClick={saveUsername}>Save</button>
                </>
              ) : (
                <>
                  <h2>Username: {username}</h2>
                  <button className="edit-btn" onClick={toggleEdit}>
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </button>
                </>
              )}
            </div>

            <h2>Email: {currentUser && currentUser.email}</h2>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
