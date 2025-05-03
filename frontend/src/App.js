import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react.js';
import { store, persistor } from './stores/store.js';
import { theme } from './styles/theme.js'; // Changed to named import
import GlobalStyles from './styles/GlobalStyles.js';
import ErrorBoundary from './components/Common/ErrorBoundary.jsx';
import Routes from './Routes.js';
import Header from './components/Header.js';
import Footer from './components/Footer.js';

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider theme={theme}>
          <GlobalStyles />
          <ErrorBoundary fallback="Something went wrong with the application. Please refresh the page.">
            <Router>
              <Header />
              <Routes />
              <Footer />
            </Router>
          </ErrorBoundary>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;