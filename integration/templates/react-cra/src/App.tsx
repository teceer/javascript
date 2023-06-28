import React from 'react';
import './App.css';
import { ClerkProvider, SignIn } from '@clerk/clerk-react';

function App() {
  return (
    <ClerkProvider publishableKey={process.env.REACT_APP_CLERK_PUBLISHABLE_KEY as string}>
      <div className='App'>
        <SignIn />
      </div>
    </ClerkProvider>
  );
}

export default App;
