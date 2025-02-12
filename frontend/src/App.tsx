import React, { useState, useCallback, useEffect } from "react";
import Chat from "./Chat";
import { useChatStore } from './store/chatStore';
import { SearchConfig } from '@chat-widget/utils';

const App: React.FC = () => {
  const { searchData, customerIntention, setSearchInProgress, syncSearchState } = useChatStore();
  
  // Now you can watch the state directly
  useEffect(() => {
    if (Object.keys(searchData).length > 0) {
      // Handle search data changes
    }
  }, [searchData]);

  useEffect(() => {
    if (Object.keys(customerIntention).length > 0) {
      // Handle intention changes
    }
  }, [customerIntention]);

  const handleUpdateSearchClick = () => {
    console.log('Updating search with data:', searchData);
    // Here you would typically trigger a search with the new data
  };

  // Test search config
  const testSearchConfig: SearchConfig = {
    searchData: {
      location: {
        type: 'string',
        description: 'City or region to search in',
        required: true,
        example: 'Paris, France'
      },
      startDate: {
        type: 'string',
        description: 'Travel start date',
        required: true,
        format: 'YYYY-MM-DD',
        example: '2024-06-01'
      },
      endDate: {
        type: 'string',
        description: 'Travel end date',
        required: true,
        format: 'YYYY-MM-DD',
        example: '2024-06-07'
      }
    }
  };

  // Test search handler
  const handleTestSearch = () => {
    // Simulate search starting
    setSearchInProgress(true);

    // Simulate API call delay
    setTimeout(() => {
      // Simulate search completion
      const testSearchResult = {
        location: 'Paris, France',
        startDate: '2024-06-01',
        endDate: '2024-06-07'
      };
      
      // Sync the chat state with the search
      syncSearchState(testSearchResult);
      setSearchInProgress(false);
    }, 1500);
  };

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
        <div>
          <button onClick={handleTestSearch}>
            Test Search: Paris
          </button>
        </div>
      </main>
      <Chat 
        searchConfig={testSearchConfig}
        onUpdateSearchClick={handleTestSearch}
        onSearchComplete={(data) => {
          console.log('Search completed with data:', data);
        }}
      />
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
    backgroundColor: 'red',
    padding: '20px',
  },
  footer: {
    padding: '20px',
    backgroundColor: 'white',
    textAlign: 'left',
  },
};

export default App;