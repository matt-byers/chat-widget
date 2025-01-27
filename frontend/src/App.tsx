import React, { useState, useCallback } from "react";
import Chat from "./Chat";

const App: React.FC = () => {
  const [searchData, setSearchData] = useState<Record<string, any>>({});
  const [customerIntention, setCustomerIntention] = useState<Record<string, any>>({});
  
  const handleSearchUpdate = useCallback((newData: Record<string, any>) => {
    console.log('App: handleSearchUpdate triggered with data:', newData);
    setSearchData(prevState => {
      const updatedData = { ...prevState };

      for (const key in newData) {
        if (newData[key] !== undefined && newData[key] !== null) {
          updatedData[key] = newData[key];
        }
      }

      return updatedData;
    });
  }, []);
  
  const handleIntentionUpdate = useCallback((newData: { [key: string]: any }) => {
    console.log('App: handleIntentionUpdate triggered with data:', newData);
    setCustomerIntention(prevState => {
      const updatedData = { ...prevState };

      for (const key in newData) {
        if (newData[key] !== undefined && newData[key] !== null) {
          updatedData[key] = newData[key];
        }
      }

      return updatedData;
    });
  }, []);

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
      <Chat onSearchUpdate={handleSearchUpdate} onIntentionUpdate={handleIntentionUpdate} />
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