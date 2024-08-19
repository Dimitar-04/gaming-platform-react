import logo from './images/logo-light.png';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './contexts/AuthContext';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  arrayUnion,
  deleteDoc,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useNavigate } from 'react-router-dom';
import {
  faHouse,
  faCirclePlus,
  faPeopleGroup,
  faGear,
  faUser,
  faPenToSquare,
  faComment,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';

import { upload } from './firebase';
const db = getFirestore();
const postCollectionRef = collection(db, 'posts');
const eventCollectionRef = collection(db, 'events');
import { UserContext } from './contexts/UserContext';
export default function UserProfile() {
  const { currentUser, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [userexists, setUserExists] = useState(false);
  const [photoURL, setPhotoURL] = useState(
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFCzxivJXCZk0Kk8HsHujTO3Olx0ngytPrWw&s'
  );
  const [currentPhotoURL, setCurrentPhotoURL] = useState(
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFCzxivJXCZk0Kk8HsHujTO3Olx0ngytPrWw&s'
  );
  // const [photoURL, setPhotoURL] = useState(
  //   localStorage.getItem('photoURL') || ''
  // );
  const [photo, setPhoto] = useState(null);
  const [filename, setFilename] = useState('');
  const [currentUsername, setCurrentUsername] = useState(
    localStorage.getItem('currentUsername') || ''
  );

  const [name, setName] = useState(localStorage.getItem('name') || '');
  const nav = useNavigate();
  const [refresh, setRefresh] = useState(false);
  const [postsList, setPostsList] = useState([]);
  const [activePostIds, setActivePostIds] = useState({});
  const [eventList, setEventList] = useState([]);
  const dialogRef = useRef(null);
  const top = useRef(null);
  const imageDialogRef = useRef(null);
  const eventDialogRef = useRef(null);
  const [mediaURl, setMediaURL] = useState(null);
  const [gameTitle, setGameTitle] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [emptyLocation, setEmptyLocation] = useState(false);
  const [emptyDate, setEmptyDate] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [emptyTitle, setEmptyTitle] = useState('false');
  const [description, setDescription] = useState('');
  const [emptyDescription, setEmptyDescription] = useState(false);
  const [focusedButton, setFocusedButton] = useState('posts');
  const [currentComment, setCurrentComment] = useState('');
  const [mediatype, setMediaType] = useState('');
  const [contextLoading, setContextLoading] = useState(true);
  const db = getFirestore();
  const postsButtonRef = useRef(null);
  const { exportUsername, exportName, exportPhotoURl } =
    useContext(UserContext);
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) {
        console.log('No user logged in');
        setLoading(false);
        return;
      }

      const db = getFirestore();
      if (currentUser && currentUser.uid) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        setCurrentUsername(userSnap.data().username);
        if (currentUser.photoURL) {
          setCurrentPhotoURL(currentUser.photoURL);
          localStorage.setItem('currentPhotoURL', currentUser.photoURL);
        } else if (userSnap.data().photoURL) {
          setCurrentPhotoURL(userSnap.data().photoURL);
          localStorage.setItem('currentPhotoURL', userSnap.data().photoURL);
        }
        localStorage.setItem('currentUsername', userSnap.data().username);

        if (userSnap.data().photoURL) {
          if (localStorage.getItem('photoURL')) {
            setPhotoURL(localStorage.getItem('photoURL'));
          } else {
            setPhotoURL(userSnap.data().photoURL);
          }
          if (!localStorage.getItem('photoURL')) {
            localStorage.setItem('photoURL', exportPhotoURl);
          }
        }
        try {
          const usersCollection = collection(db, 'users');
          const q = query(
            usersCollection,
            where('username', '==', exportUsername)
          );
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
              const userData = doc.data();
              console.log(userData);
              if (localStorage.getItem('username')) {
                setUsername(localStorage.getItem('username'));
              } else {
                setUsername(userData.username);
              }
              if (localStorage.getItem('name')) {
                setName(localStorage.getItem('name'));
              } else {
                setName(userData.name);
              }
              if (localStorage.getItem('photoURL')) {
                setPhotoURL(localStorage.getItem('photoURL'));
              } else {
                setPhotoURL(userData.photoURL);
              }

              // setPhotoURL(userData.photoURL);
              if (!localStorage.getItem('username')) {
                localStorage.setItem('username', exportUsername);
              }
              if (!localStorage.getItem('name')) {
                localStorage.setItem('name', userData.name);
              }
              if (!localStorage.getItem('photoURL')) {
                localStorage.setItem('photoURL', exportPhotoURl);
              }
            });
          } else {
            console.log('No user data found');
          }
        } catch (error) {
          console.error('Error fetching user data: ', error);
        }
      }
      setLoading(false);
    };
    fetchUserProfile();
  }, [currentUser]);

  useEffect(() => {
    if ((exportName || name) && exportUsername && exportPhotoURl) {
      setContextLoading(false);
    }
  }, [exportName, name, exportUsername, exportPhotoURl]);

  useEffect(() => {
    const getPosts = async () => {
      const data = await getDocs(postCollectionRef);
      const posts = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

      const postsWithComments = await Promise.all(
        posts.map(async (post) => {
          const postRef = doc(db, 'posts', post.id);

          const postSnap = await getDoc(postRef);

          const postData = postSnap.data();
          return { ...post, comments: postData?.comments || [] };
        })
      );
      setPostsList(postsWithComments);
    };

    getPosts();
  }, [refresh]);
  async function createPost(event) {
    event.preventDefault();
    try {
      setLoading(true);
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      let username = currentUser.email;
      if (userSnap.exists()) {
        const userData = userSnap.data();
        username = userData.username || currentUser.email;
      } else {
        console.log('User doc not exist');
      }
      if (gameTitle === '') {
        setEmptyTitle(true);
        setLoading(false);
      }
      if (description === '') {
        setEmptyDescription(true);
        setLoading(false);
      } else {
        let mediaDownloadURL = null;
        if (mediaURl) {
          const file = new File([mediaURl], filename, { type: mediatype });
          mediaDownloadURL = await uploadMedia(file);
        }

        await addDoc(postCollectionRef, {
          title: gameTitle,
          description: description,
          mediaURl: mediaDownloadURL,
          mediatype: mediatype,
          author: {
            name: username,
            id: currentUser.uid,
            photo: currentUser.photoURL,
          },
        });
        setLoading(false);

        dialogRef.current.close();

        setRefresh(!refresh);
      }
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  }
  const toggleCommentSection = (postId) => {
    setActivePostIds((prevState) => ({
      ...prevState,
      [postId]: !prevState[postId],
    }));
  };

  useEffect(() => {
    if (postsButtonRef.current) {
      postsButtonRef.current.focus();
    }
  }, []);
  async function postComment(postId) {
    if (currentComment.trim() === '') {
      return;
    }
    const newComment = {
      text: currentComment,
      author: {
        id: currentUser.uid,
        name: currentUsername,
        photo: currentPhotoURL,
      },
    };
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      comments: arrayUnion(newComment),
    });

    setRefresh(!refresh);
    setCurrentComment('');
  }
  async function deleteComment(postId, commentIndex) {
    const postDocRef = doc(db, 'posts', postId);

    const postDoc = await getDoc(postDocRef);
    if (postDoc.exists()) {
      const postData = postDoc.data();
      const comments = postData.comments || [];
      comments.splice(commentIndex, 1);
      await updateDoc(postDocRef, { comments: comments });
      setRefresh(!refresh);
    } else {
      alert('Not found');
    }
  }
  useEffect(() => {
    const getPosts = async () => {
      const data = await getDocs(eventCollectionRef);
      const posts = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

      setEventList(posts);
    };

    getPosts();
  }, [refresh]);
  const handlePostsClick = () => {
    setFocusedButton('posts');
  };
  const handleEventsClick = () => {
    setFocusedButton('events');
  };
  async function Post() {
    setEmptyTitle(false);
    setEmptyDescription(false);
    setEmptyLocation(false);
    setEmptyDate(false);
    eventDialogRef.current.showModal();
  }
  async function deleteEvent(id) {
    const postDoc = doc(db, 'events', id);
    await deleteDoc(postDoc);
    setRefresh(!refresh);
  }

  async function deletePost(id) {
    const postDoc = doc(db, 'posts', id);
    await deleteDoc(postDoc);
    setRefresh(!refresh);
  }
  async function createEvent(event) {
    event.preventDefault();
    let dali = 0;
    try {
      setLoading(true);
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      let username = currentUser.email;
      if (userSnap.exists()) {
        const userData = userSnap.data();
        username = userData.username || currentUser.email;
      } else {
        console.log('User doc not exist');
      }
      if (eventTitle === '') {
        setEmptyTitle(true);
        setLoading(false);
        dali = 1;
      }
      if (eventDescription === '') {
        setEmptyDescription(true);
        setLoading(false);
        dali = 1;
      }
      if (eventLocation === '') {
        setEmptyLocation(true);
        setLoading(false);
        dali = 1;
      }
      if (eventDate === '') {
        setEmptyDate(true);
        setLoading(false);
        dali = 1;
      }
      if (dali == 0) {
        await addDoc(eventCollectionRef, {
          title: eventTitle,
          description: eventDescription,
          location: eventLocation,
          date: eventDate,
          author: {
            name: username,
            id: currentUser.uid,
            photo: currentUser.photoURL || photoURL,
          },
        });
        setLoading(false);

        eventDialogRef.current.close();

        setRefresh(!refresh);
      }
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  }

  useEffect(() => {
    if (currentUser && currentUser.photoURL) {
      setPhotoURL(currentUser.photoURL);
    }
  }, [currentUser]);
  async function uploadMedia(file) {
    const storage = getStorage();
    const storageRef = ref(storage, `media/` + file.name);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  }

  const handleMediaUpload = (event) => {
    const file = event.target.files[0];

    if (file) {
      setFilename(file.name);
      setMediaURL(file);
      setMediaType(file.type.startsWith('image/') ? 'image' : 'video');
    }
  };
  function scrollToTop() {
    if (top.current) {
      top.current.scrollIntoView({ behavior: 'smooth' });
    }
  }
  return (
    <div className="main-container-home2">
      <div className="sidebar">
        <img src={logo} alt="" className="light-logo" onClick={scrollToTop} />

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
          <Link to="/settings">
            <button>
              <FontAwesomeIcon icon={faGear} />
              Settings
            </button>
          </Link>
          <Link to="/profile">
            <button>
              <FontAwesomeIcon icon={faUser} />
              Profile
            </button>
          </Link>
        </div>
      </div>

      <div className="home-main">
        <div className="profile-basic-info" ref={top}>
          <img src={photoURL} alt="" />
          <div>
            <h1>{name || exportName}</h1>
            <p>{username}</p>
          </div>
          <Link to="/settings">
            {username === currentUsername && (
              <button className="updateProfile">UPDATE PROFILE</button>
            )}
          </Link>
        </div>
        <div className="profile-main">
          <div className="profile-posts">
            {focusedButton === 'posts' &&
              postsList.map((post) => {
                return (
                  <>
                    {post.author.name === username && (
                      <div key={post.id} className="posts2">
                        <div className="author">
                          <img
                            src={post.author.photo}
                            alt="profilePic"
                            className="user-image-small"
                          />

                          <p>{post.author.name}</p>
                          {post.author.name === currentUsername && (
                            <button
                              className="trash"
                              onClick={() => {
                                deletePost(post.id);
                              }}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          )}
                        </div>
                        <h2>{post.title}</h2>
                        <div className="post-content">{post.description}</div>

                        {post.mediaURl && post.mediatype === 'image' && (
                          <img
                            src={post.mediaURl}
                            alt="postImage"
                            className="post-image"
                            onClick={() => {
                              setMediaURL(post.mediaURl);
                              imageDialogRef.current.showModal();
                            }}
                          />
                        )}
                        {post.mediaURl && post.mediatype === 'video' && (
                          <video
                            src={post.mediaURl}
                            controls
                            className="post-image"
                          ></video>
                        )}
                        <button
                          className="comment-btn"
                          onClick={() => {
                            toggleCommentSection(post.id);
                          }}
                        >
                          <span>{post.comments.length} Comments</span>
                          <FontAwesomeIcon icon={faComment} />
                        </button>
                      </div>
                    )}

                    {activePostIds[post.id] && (
                      <div className="comment-section">
                        <div className="comment">
                          {/* {console.log(currentUser.photoURL)}
                          {console.log(photoURL)}
                          {console.log(exportPhotoURl)} */}
                          <img
                            src={
                              // currentUser.photoURL || photoURL || exportPhotoURl
                              currentPhotoURL
                            }
                            alt="profilePic"
                            className="comment-profile-pic"
                          />
                          <textarea
                            placeholder="Add a comment..."
                            value={currentComment}
                            onChange={(e) => setCurrentComment(e.target.value)}
                          ></textarea>
                          <button
                            onClick={() => postComment(post.id)}
                            className="post-comment-btn"
                          >
                            Submit
                          </button>
                        </div>
                        <div className="comments-list">
                          {(post.comments || []).map((comment, index) => (
                            <div key={index} className="comment-child">
                              <div className="comment-author">
                                <img
                                  src={comment.author.photo}
                                  alt="profilePic"
                                  className="comment-profile-pic"
                                />
                                <p>{comment.author.name}</p>
                                {comment.author.id === currentUser.uid && (
                                  <button
                                    className="trash"
                                    title="Delete comment"
                                    onClick={() => {
                                      deleteComment(post.id, index);
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </button>
                                )}
                              </div>
                              <p className="comment-text">{comment.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })}
            {focusedButton === 'events' &&
              eventList.map((post) => {
                return (
                  <>
                    {post.author.name === username && (
                      <div className="events">
                        <div className="title-delete">
                          <h1>{post.title}</h1>
                          {post.author.id === currentUser.uid && (
                            <button
                              className="trash"
                              onClick={() => {
                                deleteEvent(post.id);
                              }}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          )}
                        </div>

                        <div className="post-content">{post.description}</div>
                        <div className="post-info">
                          <div className="post-date">
                            Date:
                            {post.location !== '' && post.link === '' && (
                              <>Location:</>
                            )}
                            {post.location === '' && post.link !== '' && (
                              <p>Link:</p>
                            )}
                            {post.location !== '' && post.link !== '' && (
                              <p>Location:</p>
                            )}
                            {post.location !== '' && post.link !== '' && (
                              <>Link:</>
                            )}
                          </div>
                          <div className="post-location">
                            <div>
                              {post.date}
                              {'  '}

                              <span
                                style={{ color: 'grey', fontSize: '0.9rem' }}
                              >
                                at
                              </span>
                              {'  '}
                              {post.time}
                            </div>
                            <div>{post.location !== '' && post.location}</div>
                            <div>
                              {post.location !== '' && post.link !== '' && (
                                <a href={post.link}>{post.link}</a>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="author2">
                          <h3>{post.author.name}</h3>
                          <img
                            src={post.author.photo}
                            alt="profilePic"
                            className="user-image-smaller"
                          />
                        </div>
                      </div>
                    )}
                  </>
                );
              })}
          </div>
          <div className="posts-events-btns">
            <button
              ref={postsButtonRef}
              onClick={handlePostsClick}
              className={focusedButton === 'posts' ? 'focused' : ''}
            >
              Posts
            </button>
            <button
              onClick={handleEventsClick}
              className={focusedButton === 'events' ? 'focused' : ''}
            >
              Events
            </button>
          </div>
          {focusedButton === 'posts' && username === currentUsername && (
            <button
              className="createPost2"
              title="Create Post"
              onClick={() => {
                setDescription('');
                setGameTitle('');
                setMediaURL(null);
                setFilename('');
                setEmptyTitle(false);
                setEmptyDescription(false);
                dialogRef.current.showModal();
              }}
            >
              <FontAwesomeIcon icon={faCirclePlus} />
            </button>
          )}
          {focusedButton === 'events' && exportUsername === currentUsername && (
            <button
              className="createPost2"
              title="Create Event"
              onClick={() => {
                setEventDescription('');
                setEventTitle('');
                setEventLocation('');
                setEventDate('');
                Post();
              }}
            >
              <FontAwesomeIcon icon={faCirclePlus} />
            </button>
          )}
        </div>
      </div>

      <dialog className="post-dialog" ref={dialogRef}>
        <div className="dialog-content">
          <button
            className="close"
            onClick={() => {
              setLoading(false);
              dialogRef.current.close();
            }}
          >
            X
          </button>

          <form action="" method="post" id="post-form">
            <label htmlFor="post-title"></label>
            <input
              type="text"
              id="post-title"
              placeholder="Game title"
              value={gameTitle}
              disabled={loading}
              className={emptyTitle ? 'invalid' : ''}
              onChange={(e) => {
                setGameTitle(e.target.value);
                setEmptyTitle(false);
              }}
            />
            {emptyTitle && <p className="empty-title">Title cannot be empty</p>}

            <textarea
              name="post-content"
              id="description-area"
              placeholder="Describe your post..."
              value={description}
              disabled={loading}
              className={emptyDescription ? 'invalid' : ''}
              onChange={(e) => {
                setDescription(e.target.value);
                setEmptyDescription(false);
              }}
            ></textarea>
            {emptyDescription && (
              <p className="empty-description">Description cannot be empty</p>
            )}
            <div className="post-choose-media">
              <div className="elements">
                <div className="choose-media">
                  <input
                    type="file"
                    id="choose-pic"
                    onChange={handleMediaUpload}
                    disabled={loading}
                  />
                  <label htmlFor="choose-pic">Upload Media</label>
                </div>
                {mediaURl && <p style={{ color: 'whitesmoke' }}>{filename}</p>}
                {mediaURl && (
                  <button
                    type="button"
                    onClick={() => {
                      setMediaURL('');
                    }}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'grey',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}
                  >
                    remove file
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={createPost}
                id="post-button"
                className="login-btn"
                disabled={loading || emptyTitle || emptyDescription}
              >
                Post
              </button>
            </div>
          </form>
        </div>
      </dialog>
      <dialog ref={eventDialogRef} className="eventDialog">
        <button
          className="close"
          onClick={() => {
            eventDialogRef.current.close();
          }}
        >
          X
        </button>
        <div className="newEventDialog">
          <div className="inputFieldTitle">
            <input
              type="text"
              placeholder="Name of event"
              className={emptyTitle ? 'invalid' : ''}
              value={eventTitle}
              onChange={(e) => {
                setEmptyTitle(false);
                setEventTitle(e.target.value);
              }}
            />
            {emptyTitle && (
              <p className="emptyField">Cannot leave this field empty</p>
            )}
          </div>
          <div className="inputFieldDescription">
            <textarea
              value={eventDescription}
              placeholder="Describe your event..."
              className={
                emptyDescription ? 'invalidDescription' : 'eventDescription'
              }
              onChange={(e) => {
                setEmptyDescription(false);
                setEventDescription(e.target.value);
              }}
            />
            {emptyDescription && (
              <p className="emptyField">Cannot leave this field empty</p>
            )}
          </div>

          <div className="date-create">
            <div className="inputFieldLocation">
              <input
                type="text"
                value={eventLocation}
                placeholder="Location"
                id="location"
                className={emptyLocation ? 'invalid' : ''}
                onChange={(e) => {
                  setEmptyLocation(false);
                  setEventLocation(e.target.value);
                }}
              />
              {emptyLocation && (
                <p className="emptyField">Cannot leave this field empty</p>
              )}
            </div>
            <div className="inputFieldDate">
              <input
                type="date"
                value={eventDate}
                className={emptyDate ? 'invalidDate' : 'eventDate'}
                onChange={(e) => {
                  setEmptyDate(false);
                  setEventDate(e.target.value);
                }}
              />
              {emptyDate && (
                <p className="emptyField">Cannot leave this field empty</p>
              )}
            </div>
          </div>

          <div>
            <button className="login-btn" onClick={createEvent}>
              Create Event
            </button>
          </div>
        </div>
      </dialog>
      <dialog ref={imageDialogRef} className="imageDialog">
        <button
          className="close2"
          onClick={() => imageDialogRef.current.close()}
        >
          X
        </button>
        <div className="dialog-content">
          <img src={mediaURl} alt="postImage" />
        </div>
      </dialog>
    </div>
  );
}
