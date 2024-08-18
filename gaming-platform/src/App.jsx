import Sign_in from './sign-in.jsx';
import Signup from './signup.jsx';
import Home from './home.jsx';
import Profile from './profile.jsx';
import ResetPassword from './resetPassword.jsx';
import Connect from './connect.jsx';
import Settings from './settings.jsx';
import UserProfile from './userProfile.jsx';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import PrivateRoute from './privateRoute.jsx';

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <Routes>
          <Route path="/signupPage" element={<Signup />} />
          <Route path="/home" element={<Home />} />
          <Route path="/" element={<Sign_in />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/resetPassword" element={<ResetPassword />} />
          <Route path="/connect" element={<Connect />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/userProfile" element={<UserProfile />} />
        </Routes>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
