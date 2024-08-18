import React, { createContext, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [exportUsername, setExportUsername] = useState('');
  const [exportName, setExportName] = useState('');
  const [exportPhotoURl, setExportPhotoURl] = useState(null);

  return (
    <UserContext.Provider
      value={{
        exportUsername,
        setExportUsername,
        exportName,
        setExportName,
        exportPhotoURl,
        setExportPhotoURl,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
