import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, updateProfile } from 'firebase/auth';
import { getFirestore, setDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyA9cniFrLh14q0mHoyO66FboJQlAHZb9jk',
  authDomain: 'gaming-platform-a948d.firebaseapp.com',
  projectId: 'gaming-platform-a948d',
  storageBucket: 'gaming-platform-a948d.appspot.com',
  messagingSenderId: '969223634615',
  appId: '1:969223634615:web:3a8e8c6efe0261fec99732',
  measurementId: 'G-KNECHD4TMB ',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const Storage = getStorage(app);
const db = getFirestore(app);
const googlProvider = new GoogleAuthProvider();

export async function upload(file, currentUser, setLoading) {
  const fileRef = ref(Storage, `profilePics/${currentUser.uid}`);
  setLoading(true);
  const snapshot = await uploadBytes(fileRef, file);
  const phurl = await getDownloadURL(fileRef);
  await setDoc(
    doc(db, 'users', currentUser.uid),
    {
      photoURL: phurl,
    },
    { merge: true }
  );
  updateProfile(currentUser, { photoURL: phurl });
  setLoading(false);
}
export async function uploadBackground(
  file,
  currentUser,
  setLoadingBackground
) {
  const fileRef = ref(Storage, `background-photos/${currentUser.uid}`);
  setLoadingBackground(true);
  const snapshot = await uploadBytes(fileRef, file);
  const phurl = await getDownloadURL(fileRef);
  await setDoc(
    doc(db, 'users', currentUser.uid),
    {
      backgroundPhoto: phurl,
    },
    { merge: true }
  );
  updateProfile(currentUser, { photoURL: phurl });
  setLoadingBackground(false);
}

export { googlProvider };
export default app;
export { auth };
