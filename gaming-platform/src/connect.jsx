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
  addDoc,
  deleteDoc,
  arrayUnion,
} from 'firebase/firestore';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useNavigate } from 'react-router-dom';
import {
  faHouse,
  faCirclePlus,
  faPeopleGroup,
  faGear,
  faUser,
  faMagnifyingGlass,
  faTrash,
  faCheck,
  faX,
} from '@fortawesome/free-solid-svg-icons';
import { UserContext } from './contexts/UserContext';

export default function Connect() {
  const { currentUser, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [userexists, setUserExists] = useState(false);
  const [photoURL, setPhotoURL] = useState(
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFCzxivJXCZk0Kk8HsHujTO3Olx0ngytPrWw&s'
  );
  const [photo, setPhoto] = useState(null);
  const [goingStatus, setGoingStatus] = useState({});
  const dialogRef = useRef(null);
  const usernameRef = useRef(null);
  const nav = useNavigate();
  const [eventList, setEventList] = useState([]);
  const [goingList, setGoingList] = useState([]);
  const [falseDate, setFalseDate] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [originalEventList, setOriginalEventList] = useState([]);
  const [eventDescription, setEventDescription] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventTime, setEventTime] = useState('17:00');
  const [eventDate, setEventDate] = useState('');
  const [eventLink, setEventLink] = useState('');
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [emptyTitle, setEmptyTitle] = useState(false);
  const [emptyLink, setEmptyLink] = useState(false);

  const [emptyDescription, setEmptyDescription] = useState(false);
  const [emptyLocation, setEmptyLocation] = useState(false);
  const [emptyDate, setEmptyDate] = useState(false);
  const db = getFirestore();
  const eventCollectionRef = collection(db, 'events');
  const feedRef = useRef(null);
  const [search, setSearch] = useState('');
  const goingDialog = useRef(null);
  const [showNoPosts, setShowNoPosts] = useState(false);
  const { setExportName, setExportPhotoURl, setExportUsername } =
    useContext(UserContext);

  const [refresh, setRefresh] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (eventList.length === 0) {
        setShowNoPosts(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [eventList]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUsername(userData.username);
          if (userData.photoURL) {
            setPhotoURL(userData.photoURL);
          }
          setLoading(false);
        } else {
          console.log('User doc not exist');
        }
      }
    };
    fetchUserData();
  }, [currentUser]);

  async function Post() {
    setEmptyTitle(false);
    setEmptyDescription(false);
    setEmptyLocation(false);
    setEmptyDate(false);
    dialogRef.current.showModal();
  }

  async function createPost(event) {
    event.preventDefault();
    let dali = 0;
    try {
      setShowNoPosts(false);
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

        dialogRef.current.close();

        setRefresh(!refresh);
      }
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  }
  useEffect(() => {
    const getPosts = async () => {
      const data = await getDocs(eventCollectionRef);
      const posts = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setOriginalEventList(posts);
      setEventList(posts);
    };

    getPosts();
  }, [refresh]);

  useEffect(() => {
    if (currentUser) {
      updateEvents(username, currentUser.photoURL || photoURL);
    }
  }, [username, currentUser.photoURL]);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUpcomingEvents(userData.upcomingEvents || []);
          } else {
            console.log('User doc not exist');
          }
        } catch (error) {
          console.error('Error fetching upcoming events', error);
        }
      }
    };
    fetchUpcomingEvents();
  }, [currentUser, upcomingEvents]);

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
  async function deletePost(id) {
    const postDoc = doc(db, 'events', id);
    setUpcomingEvents((prevEvents) => {
      return prevEvents.filter((event) => event.id !== id);
    });
    await deleteDoc(postDoc);
    setRefresh(!refresh);
  }
  function scrollToTop() {
    if (feedRef.current) {
      feedRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async function isGoing(post) {
    const postRef = doc(db, 'events', post.id);
    const postSnap = await getDoc(postRef);
    const currentUserGoing = postSnap.data().going;
    const isUserGoing = currentUserGoing.some(
      (user) => user.id === currentUser.uid
    );
    setGoingStatus((prevStatus) => ({ ...prevStatus, [post.id]: isUserGoing }));
  }
  useEffect(() => {
    eventList.forEach((post) => {
      isGoing(post);
    });
  }, [eventList]);
  async function handleGoing(post) {
    const postRef = doc(db, 'events', post.id);

    const updatedGoing = [
      ...post.going,
      {
        id: currentUser.uid,
        name: username,
        photo: currentUser.photoURL || photoURL,
      },
    ];
    await updateDoc(postRef, {
      going: updatedGoing,
    });
    setRefresh(!refresh);

    setUpcomingEvents((prevEvents) => {
      const updatedEvents = [...prevEvents, post];
      updateUserUpcomingEvents(updatedEvents);
      return updatedEvents;
    });
  }
  async function updateUserUpcomingEvents(updatedEvents) {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        upcomingEvents: updatedEvents,
      });
    } catch (error) {
      console.error('Error updating user upcoming events', error);
    }
  }
  async function handleNotGoing(id) {
    const postRef = doc(db, 'events', id);
    const postSnap = await getDoc(postRef);
    const updatedGoing = postSnap
      .data()
      .going.filter((user) => user.id !== currentUser.uid);
    await updateDoc(postRef, {
      going: updatedGoing,
    });

    setRefresh(!refresh);
    setUpcomingEvents((prevEvents) => {
      const updatedEvents = prevEvents.filter((event) => event.id !== id);
      updateUserUpcomingEvents(updatedEvents);
      return updatedEvents;
    });
  }
  function handleSearch(e) {
    e.preventDefault();
    if (e.target.value === '') {
      setEventList(originalEventList);
      return;
    }

    localStorage.setItem('searchTitle', search);

    const searchQuery = search.toLowerCase();
    const filteredEvents = originalEventList.filter((post) => {
      return (
        post.title.toLowerCase().includes(searchQuery) ||
        post.description.toLowerCase().includes(searchQuery) ||
        post.location.toLowerCase().includes(searchQuery)
      );
    });
    setEventList(filteredEvents);
  }
  useEffect(() => {
    const savedSearchTitle = localStorage.getItem('searchTitle');
    if (savedSearchTitle) {
      setSearch(savedSearchTitle);
      const filteredPosts = originalEventList.filter(
        (post) =>
          post.title.toLowerCase().includes(savedSearchTitle.toLowerCase()) ||
          post.description
            .toLowerCase()
            .includes(savedSearchTitle.toLocaleLowerCase()) ||
          post.location.toLowerCase().includes(savedSearchTitle.toLowerCase())
      );
      setEventList(filteredPosts);
    } else {
      setEventList(originalEventList);
    }
  }, [originalEventList]);

  useEffect(() => {
    const checkUserEvents = async () => {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userUpcomingEvents = userSnap.data().upcomingEvents;
      const filteredEvents = await Promise.all(
        userUpcomingEvents.map(async (event) => {
          const eventRef = doc(db, 'events', event.id);
          const eventSnap = await getDoc(eventRef);
          return eventSnap.exists() ? event : null;
        })
      );

      const validEvents = filteredEvents.filter(
        (event) => event !== null && new Date(event.date) >= new Date()
      );
      setUpcomingEvents(validEvents);

      await updateDoc(userRef, { upcomingEvents: validEvents });
    };
    if (currentUser) {
      checkUserEvents();
    }
  }, [currentUser, originalEventList]);
  return (
    <div className="main-container-home">
      <div className="sidebar">
        <img src={logo} alt="" className="light-logo" onClick={scrollToTop} />

        <div className="menu">
          <Link to="/home">
            <button
              onClick={() => {
                localStorage.removeItem('searchTitle');
              }}
            >
              <FontAwesomeIcon icon={faHouse} />
              Home
            </button>
          </Link>

          <Link to="/connect">
            <button
              onClick={() => {
                setEventList(originalEventList);
                setShowNoPosts(false);
                setSearch('');
                localStorage.removeItem('searchTitle');
              }}
            >
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
        <h1 className="events-title">Organized events:</h1>
        <form action="" method="get" id="form-home">
          <label htmlFor="search"></label>

          <input
            type="text"
            placeholder="Search..."
            value={search}
            id="searchbox"
            onChange={(e) => {
              setSearch(e.target.value);
              setShowNoPosts(false);
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
          {eventList.length === 0 && !showNoPosts && (
            <div className="spinner"></div>
          )}
          {showNoPosts && <p className="noPosts">NO EVENTS FOUND</p>}
          {eventList.map((post, index) => {
            const isGoing = goingStatus[post.id] || false;
            return (
              new Date(post.date) >= new Date() && (
                <div
                  className="events"
                  onClick={() => {
                    setExportUsername(post.author.name);
                    setExportPhotoURl(post.author.photo);
                    localStorage.removeItem('name');
                    localStorage.removeItem('username');
                    localStorage.removeItem('photoURL');
                  }}
                >
                  <div className="title-delete">
                    <h1>{post.title}</h1>
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

                  <div className="post-content">{post.description}</div>
                  <div className="post-info">
                    <div className="post-date">
                      Date:
                      {post.location !== '' && post.link === '' && (
                        <p>Location:</p>
                      )}
                      {post.location === '' && post.link !== '' && <p>Link:</p>}
                      {post.location !== '' && post.link !== '' && (
                        <p>Location:</p>
                      )}
                      {post.location !== '' && post.link !== '' && <>Link:</>}
                    </div>
                    <div className="post-location">
                      <div>
                        {post.date}
                        {'  '}

                        <span style={{ color: 'grey', fontSize: '0.9rem' }}>
                          at
                        </span>
                        {'  '}
                        {post.time}
                      </div>
                      <div>
                        {post.location !== '' && post.location}
                        {post.location === '' && post.link !== '' && (
                          <a href={post.link} className="post-link">
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
                    <Link to="/userProfile" className="customLink">
                      <h3>{post.author.name}</h3>
                    </Link>

                    <img
                      src={post.author.photo}
                      alt="profilePic"
                      className="user-image-smaller"
                    />
                    <div className="attending-going-info">
                      {!isGoing && currentUser.uid !== post.author.id && (
                        <button
                          className="going"
                          onClick={() => {
                            handleGoing(post);
                          }}
                        >
                          <span>Attending?</span>
                          {/* <FontAwesomeIcon icon={faCheck} className="faCheck2" /> */}
                        </button>
                      )}
                      {isGoing && currentUser.uid !== post.author.id && (
                        <button
                          className="notgoing"
                          onClick={() => {
                            handleNotGoing(post.id);
                          }}
                        >
                          Not attending?
                          {/* <FontAwesomeIcon icon={faX} /> */}
                        </button>
                      )}
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
              )
            );
          })}
          <button
            className="createPost"
            title="Create Event"
            onClick={() => {
              setEventDescription('');
              if (search) {
                setEventTitle(search);
              } else {
                setEventTitle('');
              }
              setEventLocation('');
              setEventLink('');
              setEventDate('');
              setFalseDate(false);
              setEmptyLink(false);
              Post();
            }}
          >
            <FontAwesomeIcon icon={faCirclePlus} />
          </button>
        </div>
      </div>
      <dialog ref={dialogRef} className="eventDialog">
        <button
          className="close"
          onClick={() => {
            dialogRef.current.close();
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
          <div className="inputs">
            <div className="date-create">
              <div className="inputFieldLocation">
                <input
                  type="location"
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
                  onChange={(e) => {
                    setEventTime(e.target.value);
                  }}
                ></input>
              </div>
            </div>
          </div>
          <div>
            <button className="login-btn" onClick={createPost}>
              Create Event
            </button>
          </div>
        </div>
      </dialog>
      <div className="favourites">
        <div className="user_now">
          <h1>Your upcoming events:</h1>
        </div>
        <div className="upcomingEvents">
          {upcomingEvents.map((post) => {
            return (
              <div
                className="events2"
                onClick={() => {
                  setExportUsername(post.author.name);
                  setExportPhotoURl(post.author.photo);
                  localStorage.removeItem('name');
                  localStorage.removeItem('username');
                  localStorage.removeItem('photoURL');
                }}
              >
                <div className="title-delete">
                  <h1
                    onClick={(e) => {
                      e.preventDefault();
                      localStorage.removeItem('searchTitle');

                      localStorage.setItem('searchTitle', post.title);
                      setSearch(post.title);
                      const searchQuery = post.title.toLowerCase();
                      const filteredEvents = originalEventList.filter(
                        (post) => {
                          return (
                            post.title.toLowerCase().includes(searchQuery) ||
                            post.description
                              .toLowerCase()
                              .includes(searchQuery) ||
                            post.location.toLowerCase().includes(searchQuery)
                          );
                        }
                      );
                      setEventList(filteredEvents);
                    }}
                    className="postTitle"
                  >
                    {post.title}
                  </h1>
                  {post.author.id === currentUser.uid && (
                    <button
                      className="trash"
                      onClick={() => {
                        console.log(post.id);
                        deletePost(post.id || post.author.id);
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
                    {post.location === '' && post.link !== '' && <p>Link:</p>}
                    {post.location !== '' && post.link !== '' && (
                      <p>Location:</p>
                    )}
                    {post.location !== '' && post.link !== '' && <>Link:</>}
                  </div>
                  <div className="post-location">
                    <div>
                      {post.date}
                      {'  '}

                      <span style={{ color: 'grey', fontSize: '0.9rem' }}>
                        at
                      </span>
                      {'  '}
                      {post.time}
                    </div>
                    <div className>
                      {post.location !== '' && post.location}
                      {post.location === '' && post.link !== '' && (
                        <a href={post.link} target="_blank">
                          {post.link}{' '}
                        </a>
                      )}
                    </div>
                    <div className="post-link">
                      {post.location !== '' && post.link !== '' && (
                        <a href={post.link} target="_blank">
                          {post.link}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="author2">
                  <Link to="/userProfile" className="customLink3">
                    <h3>{post.author.name}</h3>
                  </Link>

                  <img
                    src={post.author.photo}
                    alt="profilePic"
                    className="user-image-smaller"
                  />
                  {currentUser.uid !== post.author.id && (
                    <button
                      className="notgoing2"
                      onClick={() => {
                        handleNotGoing(post.id);
                      }}
                    >
                      <span>Not attending?</span>
                      {/* <FontAwesomeIcon icon={faX} className="faCheck2" /> */}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
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
                  setExportUsername(user.name);
                  setExportPhotoURl(user.photo);
                  localStorage.removeItem('name');
                  localStorage.removeItem('username');
                  localStorage.removeItem('photoURL');
                }}
              >
                <img
                  src={user.photo}
                  alt="profilePic"
                  className="going-user-img"
                />
                <Link to="/userProfile" className="customLink2">
                  <h3>{user.name}</h3>
                </Link>
              </div>
            </div>
          );
        })}
      </dialog>
    </div>
  );
}
