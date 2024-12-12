import React from "react";
import Chat from "./Chat";

const App: React.FC = () => {
  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <h1>Header</h1>
      </header>
      <main style={styles.main}>
        <h2>Main Content Area</h2>
        <p>This is where the main content goes.</p>
        <p>This is where the main content goes.</p>
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