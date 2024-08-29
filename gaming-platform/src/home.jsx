import logo from './images/logo-light.png';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './contexts/AuthContext';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  getFirestore,
  doc,
  getDoc,
  addDoc,
  where,
  collection,
  getDocs,
  query,
  writeBatch,
  deleteDoc,
  updateDoc,
  arrayUnion,
  or,
  arrayRemove,
} from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useAsyncError, useNavigate } from 'react-router-dom';
import {
  faHouse,
  faCirclePlus,
  faPeopleGroup,
  faGear,
  faUser,
  faTrash,
  faComment,
  faMagnifyingGlass,
  faCheck,
  faPen,
  faX,
} from '@fortawesome/free-solid-svg-icons';
import { auth } from './firebase';
import { UserContext } from './contexts/UserContext';
const db = getFirestore();
const postCollectionRef = collection(db, 'posts');

export default function Home() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [profilePic, setProfilePic] = useState(
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFCzxivJXCZk0Kk8HsHujTO3Olx0ngytPrWw&s'
  );
  const dialogRef = useRef(null);
  const imageDialogRef = useRef(null);
  const [gameTitle, setGameTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emptyTitle, setEmptyTitle] = useState(false);
  const [emptyDescription, setEmptyDescription] = useState(false);
  const { currentUser, logout } = useAuth();
  const [refreshingHome, setRefreshingHome] = useState(false);
  const deleteDialogRef = useRef(null);
  const [isDeletePost, setIsDeletePost] = useState(false);
  const [isLogOut, setIsLogOut] = useState(false);
  const [deletePostId, setDeletePostId] = useState(null);
  const [deletePostIndex, setDeletePostIndex] = useState(null);
  const [mediaURl, setMediaURL] = useState(null);
  const [mediatype, setMediaType] = useState(null);
  const [activePostIds, setActivePostIds] = useState({});
  const [postsList, setPostsList] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [filename, setFilename] = useState('');
  const [comments, setComments] = useState({});
  const [originalPostsList, setOriginalPostsList] = useState([]);
  const [currentComment, setCurrentComment] = useState('');
  const { setExportUsername } = useContext(UserContext);
  const [searchTitle, setSearchTitle] = useState('');
  const [showNoPosts, setShowNoPosts] = useState(false);
  const [addFavourites, setAddFavourites] = useState(false);
  const [favourites, setFavourites] = useState([]);
  const [newFavouriteGame, setNewFavouriteGame] = useState('');
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [hoveredPosts, setHoveredPosts] = useState([]);
  const feedRef = useRef(null);
  const { setExportName, setExportPhotoURl } = useContext(UserContext);
  const nav = useNavigate();
  useEffect(() => {
    const timer = setTimeout(() => {
      if (postsList.length === 0) {
        setShowNoPosts(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [postsList]);

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
        if (
          currentUser.photoURL
          // currentUser.photoURL.includes('googleusercontent.com')
        ) {
          const img = new Image();
          img.src = currentUser.photoURL;

          console.log(img.src);
          setProfilePic(img.src);
          // img.onload = () => {
          //   console.log(img.src);
          //   setProfilePic(img.src);
          // };
          // img.onerror = () => {
          //   console.log('image not loaded');
          // };
        }

        if (userSnap.exists()) {
          const userData = userSnap.data();

          if (userData.photoURL) {
            setProfilePic(userData.photoURL);
          }
          if (userSnap.data().username === '') {
            const nusername = currentUser.email.split('@')[0];
            await updateDoc(userRef, { username: nusername });
            setUsername(nusername);
          } else {
            setUsername(userSnap.data().username);
          }
          if (userSnap.data().name === '') {
            const newName = currentUser.displayName;
            await updateDoc(userRef, { name: newName });
          }
          if (!userSnap.data().photoURL) {
            await updateDoc(userRef, { photoURL: currentUser.photoURL });
          }
        } else {
          console.log('error');
        }
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      updatePosts(username, profilePic);
      updateComments(username, profilePic);
    }
  }, [currentUser, username, profilePic]);

  async function createPost(event) {
    event.preventDefault();
    setShowNoPosts(false);
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
      setOriginalPostsList(postsWithComments);
      setPostsList(postsWithComments);
    };

    getPosts();
  }, [refresh]);

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

  async function deletePost(id) {
    const postDoc = doc(db, 'posts', id);
    await deleteDoc(postDoc);
    setRefresh(!refresh);
  }
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
    if (feedRef.current) {
      feedRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async function postComment(postId) {
    if (currentComment.trim() === '') {
      return;
    }
    const newComment = {
      text: currentComment,
      author: {
        id: currentUser.uid,
        name: username,
        photo: profilePic,
      },
    };
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      comments: arrayUnion(newComment),
    });
    setRefresh(!refresh);
    setCurrentComment('');
  }
  const toggleCommentSection = (postId) => {
    setActivePostIds((prevState) => ({
      ...prevState,
      [postId]: !prevState[postId],
    }));
  };
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
  async function addFavouriteGame(e) {
    e.preventDefault();
    if (newFavouriteGame.trim() === '') {
      return;
    }

    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      favourites: arrayUnion(newFavouriteGame),
    });
    setNewFavouriteGame('');
    setAddFavourites(false);
  }
  useEffect(() => {
    const savedSearchTitle = localStorage.getItem('searchTitle');
    if (savedSearchTitle) {
      setSearchTitle(savedSearchTitle);
      const filteredPosts = originalPostsList.filter((post) =>
        post.title.toLowerCase().includes(savedSearchTitle.toLowerCase())
      );
      setPostsList(filteredPosts);
    } else {
      setPostsList(originalPostsList);
    }
  }, [originalPostsList]);
  useEffect(() => {
    const fetchFavourites = async () => {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setFavourites(userData.favourites || []);
      }
    };
    fetchFavourites();
  }, [favourites, currentUser]);

  const handleSearch = (e) => {
    e.preventDefault();
    localStorage.setItem('searchTitle', searchTitle);
    setGameTitle(searchTitle);

    const filteredPosts = originalPostsList.filter((post) =>
      post.title.toLowerCase().includes(searchTitle.toLowerCase())
    );
    setPostsList(filteredPosts);

    setShowNoPosts(filteredPosts.length === 0);
  };

  const handleEditClick = (index, value) => {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setEditIndex(null);
      }
    });
    setEditIndex(index);
    setEditValue(value);
  };
  const handleEditChange = (e) => {
    setEditValue(e.target.value);
  };

  const handleSaveClick = async (index) => {
    const userRef = doc(db, 'users', currentUser.uid);
    const updatedFavourties = [...favourites];
    const oldFavourite = updatedFavourties[index];
    updatedFavourties[index] = editValue;
    await updateDoc(userRef, { favourites: arrayRemove(oldFavourite) });
    await updateDoc(userRef, { favourites: updatedFavourties });
    setEditIndex(null);
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
  return (
    <div className="main-container-home">
      <div className="sidebar">
        <img src={logo} alt="" className="light-logo" onClick={scrollToTop} />

        <div className="menu">
          <Link to="/home" className="menu-home-link">
            <button
              className="menu-home-btn"
              onClick={() => {
                setRefreshingHome(true);
                setPostsList([...originalPostsList]);
                setShowNoPosts(false);
                setSearchTitle('');
                localStorage.removeItem('searchTitle');
              }}
            >
              <div className="menu-icon">
                <FontAwesomeIcon icon={faHouse} />
              </div>
              <div className="menu-text">
                <span>Home</span>
              </div>
            </button>
          </Link>
          <Link to="/connect" className="menu-home-link">
            <button
              className="menu-home-btn"
              onClick={() => {
                localStorage.removeItem('searchTitle');
              }}
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
            <button className="menu-home-btn">
              <div className="menu-icon">
                <FontAwesomeIcon icon={faGear} />
              </div>
              <div className="menu-text">
                <span>Settings</span>
              </div>
            </button>
          </Link>

          <Link to="/profile" className="menu-home-link">
            <button className="menu-home-btn">
              <div className="menu-icon">
                <img className="user-image2" src={profilePic} />
              </div>
              <div className="menu-text">
                <span>Profile</span>
              </div>
            </button>
          </Link>
        </div>
      </div>
      <div className="home-main">
        <form action="" method="get" id="form-home">
          <label htmlFor="search"></label>

          <input
            type="text"
            placeholder="Search..."
            id="searchbox"
            value={searchTitle}
            onChange={(e) => {
              setSearchTitle(e.target.value);
            }}
          />
          <button
            className="searchBtn"
            onClick={(e) => {
              handleSearch(e);
            }}
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
        </form>

        <div className="feed" ref={feedRef}>
          {postsList.length === 0 && !showNoPosts && (
            <div className="spinner"></div>
          )}
          {showNoPosts && <p className="noPosts">NO POSTS FOUND</p>}
          {postsList.map((post) => {
            return (
              <>
                <div
                  key={post.id}
                  className={
                    hoveredPosts.includes(post.id) ? 'post-hovers' : 'posts'
                  }
                  onClick={() => {
                    setExportUsername(post.author.name);
                    setExportPhotoURl(post.author.photo);
                    localStorage.removeItem('name');
                    localStorage.removeItem('username');
                    localStorage.removeItem('photoURL');
                  }}
                >
                  <div className="author">
                    <img
                      src={post.author.photo}
                      alt="profilePic"
                      className="user-image-small"
                    />
                    <Link to="/userProfile" className="customLink2">
                      <p>{post.author.name}</p>
                    </Link>

                    {post.author.id === currentUser.uid && (
                      <button
                        className="trash"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletePostId(post.id);
                          setIsDeletePost(true);
                          deleteDialogRef.current.showModal();
                        }}
                        title="Delete post"
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
                {activePostIds[post.id] && (
                  <div className="comment-section">
                    <div className="comment">
                      <img
                        src={profilePic}
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
                        Post
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
        </div>
        <div>
          <button
            className="createPost"
            title="Create Post"
            onClick={() => {
              setDescription('');
              if (searchTitle) {
                setGameTitle(searchTitle);
              } else {
                setGameTitle('');
              }

              setMediaURL(null);
              setFilename('');
              setEmptyTitle(false);
              setEmptyDescription(false);
              dialogRef.current.showModal();
            }}
          >
            <FontAwesomeIcon icon={faCirclePlus} />
          </button>
        </div>
      </div>
      <div className="favourites">
        <div className="user_now">
          <div className="user-image-div">
            <img className="user-image" src={profilePic} alt="priflePic" />
          </div>

          <p className="username-info">{username}</p>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: 'grey',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginLeft: 'auto',
              marginRight: '2%',
              cursor: 'pointer',
            }}
            onClick={() => {
              setIsLogOut(true);
              deleteDialogRef.current.showModal();
            }}
            title="Log out?"
          >
            Log out
          </button>
        </div>

        <div className="favourites-content">
          <div style={{ display: 'flex', width: '100%' }}>
            <h2>FAVOURITE GAMES</h2>
            <button
              className="addFavourites"
              title="Add a favourite game"
              onClick={() => {
                setAddFavourites(true);
              }}
            >
              <FontAwesomeIcon icon={faCirclePlus} />
            </button>
          </div>
          {addFavourites && (
            <form id="favouritesForm">
              <input
                type="text"
                id="addFavouriteTitle"
                placeholder="Game Title"
                onChange={(e) => {
                  setNewFavouriteGame(e.target.value);
                }}
              ></input>
              <button
                className="faCheck"
                title="Confirm"
                onClick={addFavouriteGame}
              >
                <FontAwesomeIcon icon={faCheck} />
              </button>
              <button
                className="faX"
                onClick={() => {
                  setAddFavourites(false);
                }}
              >
                <FontAwesomeIcon icon={faX} />
              </button>
            </form>
          )}

          <ul>
            {favourites.map((favourite, index) => (
              <li key={index} className="favouriteItems">
                <div className="spans">
                  {editIndex === index ? (
                    <input
                      type="text"
                      id="editFavourite"
                      value={editValue}
                      onChange={handleEditChange}
                    ></input>
                  ) : (
                    <span
                      onClick={() => {
                        setSearchTitle(favourite);
                        localStorage.setItem('searchTitle', favourite);
                        const filteredPosts = originalPostsList.filter((post) =>
                          post.title
                            .toLowerCase()
                            .includes(favourite.toLowerCase())
                        );
                        setPostsList(filteredPosts);
                        setShowNoPosts(false);
                        const postIds = filteredPosts.map((post) => post.id);
                        setHoveredPosts(postIds);

                        setTimeout(() => {
                          setHoveredPosts([]);
                        }, 1000);
                      }}
                    >
                      {favourite}
                    </span>
                  )}
                </div>
                <div style={{ padding: '2%' }}>
                  {editIndex === index ? (
                    <button
                      className="faCheck"
                      title="Confirm"
                      onClick={() => {
                        handleSaveClick(index);
                      }}
                    >
                      <FontAwesomeIcon icon={faCheck} />
                    </button>
                  ) : (
                    <>
                      <button
                        className="faPen"
                        title="Edit"
                        onClick={() => {
                          handleEditClick(index, favourite);
                        }}
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>
                      <button
                        className="trash2"
                        title="Remove"
                        onClick={() => {
                          const userRef = doc(db, 'users', currentUser.uid);
                          const updatedFavourties = [...favourites];
                          updatedFavourties.splice(index, 1);
                          updateDoc(userRef, { favourites: updatedFavourties });
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
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
      <dialog ref={deleteDialogRef} className="deleteDialog">
        <div className="deleteDialog-content">
          {isDeletePost && <h2>Are you sure you want to delete this post?</h2>}
          {isLogOut && <h2>Log out?</h2>}
          <button
            className="close3"
            onClick={() => {
              deleteDialogRef.current.close();
              setIsDeletePost(false);
              setIsLogOut(false);
            }}
          >
            X
          </button>

          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              gap: '10%',
            }}
          >
            <button
              className="yesbtn"
              onClick={() => {
                if (isDeletePost) {
                  deletePost(deletePostId);
                  setIsDeletePost(false);
                } else if (isLogOut) {
                  handleLogout();
                  setIsLogOut(false);
                }

                deleteDialogRef.current.close();
              }}
            >
              Yes
            </button>
            <button
              className="nobtn"
              onClick={() => {
                setIsDeletePost(false);
                setIsLogOut(false);
                deleteDialogRef.current.close();
              }}
            >
              No
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
