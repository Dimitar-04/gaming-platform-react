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
  faX,
} from '@fortawesome/free-solid-svg-icons';

import { upload } from './firebase';
const db = getFirestore();
const postCollectionRef = collection(db, 'posts');
const eventCollectionRef = collection(db, 'events');
import { UserContext } from './contexts/UserContext';

export default function Profile() {
  const { currentUser, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [userexists, setUserExists] = useState(false);
  const [photoURL, setPhotoURL] = useState(
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFCzxivJXCZk0Kk8HsHujTO3Olx0ngytPrWw&s'
  );
  const [photo, setPhoto] = useState(null);
  const [filename, setFilename] = useState('');
  const usernameRef = useRef(null);
  const [name, setName] = useState('');
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
  const [eventTime, setEventTime] = useState('17:00');
  const [eventDescription, setEventDescription] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [emptyLocation, setEmptyLocation] = useState(false);
  const [emptyDate, setEmptyDate] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [emptyTitle, setEmptyTitle] = useState('false');
  const [emptyLink, setEmptyLink] = useState('false');
  const [falseDate, setFalseDate] = useState(false);
  const [description, setDescription] = useState('');
  const [emptyDescription, setEmptyDescription] = useState(false);
  const [focusedButton, setFocusedButton] = useState('posts');
  const [currentComment, setCurrentComment] = useState('');
  const [backgroundPhoto, setBackgroundPhoto] = useState('');
  const { activeButton, setActiveButton } = useContext(UserContext);
  const [mediatype, setMediaType] = useState('');
  const db = getFirestore();
  const [goingList, setGoingList] = useState([]);
  const goingDialog = useRef(null);
  const postsButtonRef = useRef(null);
  const [eventLink, setEventLink] = useState('');

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
          if (userData.backgroundPhoto) {
            setBackgroundPhoto(userData.backgroundPhoto);
          }

          if (currentUser.displayName) {
            setName(currentUser.displayName);
          }
          if (userData.name) {
            setName(userData.name);
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
  async function updatePosts(newUsername, newPhoto) {
    const userPostsQuery = query(
      postCollectionRef,
      where('author.id', '==', currentUser.uid)
    );
    const userPosts = await getDocs(userPostsQuery);
    const batch = writeBatch(db);

    userPosts.forEach((doc) => {
      const postRef = doc.ref;
      batch.update(postRef, {
        'author.name': newUsername,
        'author.photo': newPhoto,
      });
    });

    await batch.commit();
    setRefresh(!refresh);
  }
  useEffect(() => {
    if (currentUser) {
      updatePosts(username, photoURL);
      updateComments(username, photoURL);
      updateEvents(username, photoURL);
      updateGoingList();
    }
  }, [currentUser, username, photoURL]);
  async function updateComments(newUsername, newPhoto) {
    const allPostsQuery = query(postCollectionRef);
    const allPosts = await getDocs(allPostsQuery);
    const batch = writeBatch(db);
    allPosts.forEach((doc) => {
      const postRef = doc.ref;
      const comments = doc.data().comments || [];
      const updatedComments = comments.map((comment) => {
        if (comment.author.id === currentUser.uid) {
          return {
            ...comment,
            author: { id: currentUser.uid, name: newUsername, photo: newPhoto },
          };
        }

        return comment;
      });
      batch.update(postRef, { comments: updatedComments });
    });
    await batch.commit();
    setRefresh(!refresh);
  }
  async function updateEvents(newUsername, newPhoto) {
    const userEventsQuery = query(
      eventCollectionRef,
      where('author.id', '==', currentUser.uid)
    );
    const userEvents = await getDocs(userEventsQuery);
    const batch = writeBatch(db);

    userEvents.forEach((doc) => {
      const postRef = doc.ref;
      batch.update(postRef, {
        'author.name': newUsername,
        'author.photo': newPhoto,
      });
    });
    await batch.commit();
    setRefresh(!refresh);
  }
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
        name: username,
        photo: photoURL,
      },
    };
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      comments: arrayUnion(newComment),
    });

    setRefresh(!refresh);
    setCurrentComment('');
  }
  async function updateGoingList() {
    const events = collection(db, 'events');
    const eventsSnapshot = await getDocs(events);
    const eventsList = eventsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    await Promise.all(
      eventsList.map(async (event) => {
        const going = event.going;
        const eventRef = doc(db, 'events', event.id);
        const updatedGoing = await Promise.all(
          going.map(async (user) => {
            const userRef = doc(db, 'users', user.id);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data();
            return {
              id: user.id,
              name: userData.username,
              photo: userData.photoURL,
            };
          })
        );

        await updateDoc(eventRef, { going: updatedGoing });
      })
    );
    setRefresh(!refresh);
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
      if (eventLocation === '' && eventLink === '') {
        setEmptyLocation(true);
        setEmptyLink(true);
        setLoading(false);
        dali = 1;
      }
      if (eventDate === '') {
        setEmptyDate(true);
        setLoading(false);
        dali = 1;
      }
      if (new Date(eventDate) < new Date()) {
        console.log(new Date(eventDate));
        console.log(new Date());
        setFalseDate(true);
        setLoading(false);
        dali = 1;
      }
      if (dali == 0) {
        const newEvent = {
          title: eventTitle,
          description: eventDescription,
          location: eventLocation,
          date: eventDate,
          link: eventLink,
          time: eventTime,
          author: {
            name: username,
            id: currentUser.uid,
            photo: currentUser.photoURL || photoURL,
          },
          going: [
            {
              id: currentUser.uid,
              name: username,
              photo: currentUser.photoURL || photoURL,
            },
          ],
        };
        const docref = await addDoc(eventCollectionRef, newEvent);
        const eventid = docref.id;
        newEvent.id = eventid;

        await updateDoc(userRef, {
          upcomingEvents: arrayUnion(newEvent),
        });
        setRefresh(!refresh);
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
    <div className="main-container-home2">
      <div className="sidebar">
        <img src={logo} alt="" className="light-logo2" onClick={scrollToTop} />

        <div className="menu">
          <Link to="/home" className="menu-home-link">
            <button
              className="menu-home-btn"
              onClick={() =>
                handleButtonClick('home', () => {
                  setRefreshingHome(true);
                  setPostsList([...originalPostsList]);
                  setShowNoPosts(false);
                  setSearchTitle('');
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
              className="menu-home-btn"
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
              className={`menu-home-btn ${
                (localStorage.getItem('activeButton') || activeButton) ===
                'profile'
                  ? 'active'
                  : ''
              }`}
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
          {backgroundPhoto && (
            <img
              src={backgroundPhoto}
              alt="background"
              className="background-image-settings"
            />
          )}
        </div>
        <div className="profile-basic-info" ref={top}>
          <img src={photoURL} />
        </div>
        <div className="name-username-profile">
          <div>
            <h1>{name}</h1>
            <p>{username}</p>
          </div>

          <Link to="/settings">
            <button className="updateProfile">UPDATE PROFILE</button>
          </Link>
        </div>
        <div className="profile-main">
          <div className="profile-posts">
            {focusedButton === 'posts' &&
              postsList.map((post) => {
                return (
                  <>
                    {post.author.id === currentUser.uid && (
                      <div key={post.id} className="posts2">
                        <div className="author">
                          <img
                            src={post.author.photo}
                            alt="profilePic"
                            className="user-image-small"
                          />

                          <p>{post.author.name}</p>
                          {post.author.id === currentUser.uid && (
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
                          <span>
                            {post.comments.length}{' '}
                            {post.comments.length === 1 ? (
                              <span>Comment</span>
                            ) : (
                              <span>Comments</span>
                            )}{' '}
                          </span>
                          <FontAwesomeIcon icon={faComment} />
                        </button>
                      </div>
                    )}

                    {activePostIds[post.id] && (
                      <div className="comment-section">
                        <div className="comment">
                          <img
                            src={photoURL}
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
              eventList.map((post, index) => {
                return (
                  <>
                    {post.author.id === currentUser.uid && (
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
                              <p>Location:</p>
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
                            <div>
                              {post.location !== '' && post.location}
                              {post.location === '' && post.link !== '' && (
                                <a
                                  href={post.link}
                                  className="post-link"
                                  target="blank"
                                >
                                  {post.link}{' '}
                                </a>
                              )}
                            </div>
                            <div className="post-link">
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
                          <div className="attending-going-info">
                            <p
                              className="attending"
                              onClick={async () => {
                                const postRef = doc(
                                  db,
                                  'events',
                                  eventList[index].id
                                );
                                const postSnap = await getDoc(postRef);

                                setGoingList(postSnap.data().going);
                                goingDialog.current.showModal();
                                console.log(goingList);
                              }}
                            >
                              {post.going.length}
                              {'   '} Attending
                            </p>
                          </div>
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
          {focusedButton === 'posts' && (
            <button
              className="createPost2"
              title="Create Post"
              onClick={() => {
                setDescription('');
                setGameTitle('');
                setMediaURL(null);
                setFilename('');

                setEmptyTitle(false);
                setEmptyLink(false);
                setEmptyDescription(false);
                dialogRef.current.showModal();
              }}
            >
              <FontAwesomeIcon icon={faCirclePlus} />
            </button>
          )}
          {focusedButton === 'events' && (
            <button
              className="createPost2"
              title="Create Event"
              onClick={() => {
                setEventDescription('');
                setEmptyLink(false);
                setEventLink('');
                setEventTime('17:00');
                setEventTitle('');
                setEventLocation('');
                setEventDate('');
                eventDialogRef.current.showModal();
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
              disabled={loading}
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
              disabled={loading}
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
          <div className="inputs">
            <div className="date-create">
              <div className="inputFieldLocation">
                <input
                  type="text"
                  disabled={loading}
                  value={eventLocation}
                  placeholder="Location"
                  id="location"
                  className={emptyLocation ? 'invalid' : ''}
                  onChange={(e) => {
                    setEmptyLocation(false);
                    setEmptyLink(false);
                    setEventLocation(e.target.value);
                  }}
                />
                {emptyLocation && (
                  <p className="emptyField">
                    At least one field should be filled
                  </p>
                )}
              </div>
              <div className="inputFieldLink">
                <input
                  type="url"
                  placeholder="Link"
                  id="link"
                  disabled={loading}
                  value={eventLink}
                  className={emptyLink ? 'invalid' : ''}
                  onChange={(e) => {
                    setEmptyLink(false);
                    setEmptyLocation(false);
                    setEventLink(e.target.value);
                  }}
                ></input>
                {emptyLink && (
                  <p className="emptyField">
                    At least one field should be filled
                  </p>
                )}
              </div>
            </div>
            <div className="LinkTime">
              <div className="inputFieldDate">
                <input
                  type="date"
                  disabled={loading}
                  value={eventDate}
                  className={emptyDate ? 'invalidDate' : 'eventDate'}
                  onChange={(e) => {
                    setEmptyDate(false);
                    setFalseDate(false);
                    setEventDate(e.target.value);
                  }}
                />
                {emptyDate && <p className="emptyField">Cannot leave empty</p>}
                {falseDate && (
                  <p className="emptyField">Please enter a future date</p>
                )}
              </div>

              <div>
                <input
                  type="time"
                  defaultValue="17:00"
                  className="time"
                  disabled={loading}
                  onChange={(e) => {
                    setEventTime(e.target.value);
                  }}
                ></input>
              </div>
            </div>
          </div>
          <div>
            <button
              className="login-btn"
              onClick={createEvent}
              disabled={loading}
            >
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
      <dialog ref={goingDialog} id="goingDialog">
        <div>
          <button
            className="close2"
            onClick={() => {
              goingDialog.current.close();
            }}
          >
            <FontAwesomeIcon icon={faX} />
          </button>
        </div>
        {goingList.map((user) => {
          return (
            <div className="goingList">
              <div
                className="goingChild"
                onClick={() => {
                  console.log(user.name + username);
                  if (user.name == username) {
                    nav('/profile');
                  } else {
                    setExportUsername(user.name);
                    setExportPhotoURl(user.photo);
                    localStorage.removeItem('name');
                    localStorage.removeItem('username');
                    localStorage.removeItem('photoURL');
                  }
                }}
              >
                <img
                  src={user.photo}
                  alt="profilePic"
                  className="going-user-img"
                />
                {
                  <Link to="/userProfile" className="customLink2">
                    <h3>{user.name}</h3>
                  </Link>
                }
              </div>
            </div>
          );
        })}
      </dialog>
    </div>
  );
}
