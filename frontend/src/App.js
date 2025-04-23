import React from 'react';
import { Routes, Route } from 'react-router-dom';
import styled, { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { ThemeProvider } from './context/ThemeContext.js';
// Temporarily comment out potentially problematic components
// import { HelpProvider } from './components/Common/FloatingHelpButton.jsx';
import GlobalStyles from './styles/GlobalStyles.js';
import { theme } from './styles/theme.js';
import ErrorBoundary from './components/Common/ErrorBoundary.jsx';

// Pages
import Home from './pages/Home.js';
import Chat from './pages/Chat.js';
import SpecificationReview from './pages/SpecificationReview.js';
import DevelopmentPlan from './pages/DevelopmentPlan.js';
import ModuleOutput from './pages/ModuleOutput.js';
import Dashboard from './pages/Dashboard.js';

// Components
import Header from './components/Header.js';
import Footer from './components/Footer.js';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 2rem;
`;

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <StyledThemeProvider theme={theme}>
          {/* Comment out HelpProvider temporarily */}
          {/* <HelpProvider> */}
            <GlobalStyles />
            <AppContainer>
              <Header />
              <MainContent>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/specification-review" element={<SpecificationReview />} />
                  <Route path="/development-plan" element={<DevelopmentPlan />} />
                  <Route path="/module-output" element={<ModuleOutput />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
              </MainContent>
              <Footer />
            </AppContainer>
          {/* </HelpProvider> */}
        </StyledThemeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;