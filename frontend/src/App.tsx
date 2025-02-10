import React, { useState, useCallback, useEffect } from "react";
import Chat from "./Chat";
import { useChatStore } from './store/chatStore';

const App: React.FC = () => {
  const { searchData, customerIntention } = useChatStore();
  
  // Now you can watch the state directly
  useEffect(() => {
    if (Object.keys(searchData).length > 0) {
      // Handle search data changes
      console.log('Search data updated:', searchData);
    }
  }, [searchData]);

  useEffect(() => {
    if (Object.keys(customerIntention).length > 0) {
      // Handle intention changes
      console.log('Customer intention updated:', customerIntention);
    }
  }, [customerIntention]);

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <h1>Header</h1>
      </header>
      <main style={styles.main}>
        <h2>Main Content Area</h2>
        <p>My name is goo and i want to transact.</p>
        <div>
          <h3>Search Data:</h3>
          <pre>{JSON.stringify(searchData, null, 2)}</pre>
          <h3>Customer Intention:</h3>
          <pre>{JSON.stringify(customerIntention, null, 2)}</pre>
        </div>
      </main>
      <Chat />
      <footer style={styles.footer}>
        <p>Footer</p>
      </footer>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },
  header: {
    padding: '20px',
    backgroundColor: 'white',
    textAlign: 'left',
  },
  main: {
    flex: 1,
    backgroundColor: 'white',
    padding: '20px',
  },
  footer: {
    padding: '20px',
    backgroundColor: 'white',
    textAlign: 'left',
  },
};

export default App;