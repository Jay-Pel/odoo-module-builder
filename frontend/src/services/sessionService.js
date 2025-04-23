/**
 * Session management service for the Odoo Module Builder
 * Handles storing and retrieving module sessions
 */

// Get all module sessions from local storage
export const getAllSessions = () => {
  try {
    const sessionsJson = localStorage.getItem('odooModuleSessions');
    if (!sessionsJson) {
      return [];
    }
    return JSON.parse(sessionsJson);
  } catch (error) {
    console.error('Error getting sessions:', error);
    return [];
  }
};

// Get a specific session by ID
export const getSessionById = (sessionId) => {
  const sessions = getAllSessions();
  return sessions.find(session => session.id === sessionId);
};

// Create a new module session
export const createSession = (name, description) => {
  try {
    const sessions = getAllSessions();
    const newSession = {
      id: `session-${Date.now()}`,
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'in-progress'
    };
    
    sessions.push(newSession);
    localStorage.setItem('odooModuleSessions', JSON.stringify(sessions));
    
    // Set the current session ID in session storage
    sessionStorage.setItem('currentSessionId', newSession.id);
    
    return newSession;
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
};

// Update a session
export const updateSession = (sessionId, updates) => {
  try {
    const sessions = getAllSessions();
    const sessionIndex = sessions.findIndex(session => session.id === sessionId);
    
    if (sessionIndex === -1) {
      return null;
    }
    
    const updatedSession = {
      ...sessions[sessionIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    sessions[sessionIndex] = updatedSession;
    localStorage.setItem('odooModuleSessions', JSON.stringify(sessions));
    
    return updatedSession;
  } catch (error) {
    console.error('Error updating session:', error);
    return null;
  }
};

// Delete a session
export const deleteSession = (sessionId) => {
  try {
    const sessions = getAllSessions();
    const filteredSessions = sessions.filter(session => session.id !== sessionId);
    
    localStorage.setItem('odooModuleSessions', JSON.stringify(filteredSessions));
    
    // If the current session is being deleted, clear the current session ID
    if (sessionStorage.getItem('currentSessionId') === sessionId) {
      sessionStorage.removeItem('currentSessionId');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
};

// Set the current active session
export const setCurrentSession = (sessionId) => {
  // Store in both session and local storage
  sessionStorage.setItem('currentSessionId', sessionId);
  localStorage.setItem('currentSessionId', sessionId);
  
  // Clear any existing context or data from previous sessions
  sessionStorage.removeItem('moduleContext');
  localStorage.removeItem('moduleContext');
  
  sessionStorage.removeItem('specificationId');
  localStorage.removeItem('specificationId');
  
  sessionStorage.removeItem('planId');
  localStorage.removeItem('planId');
  
  sessionStorage.removeItem('generationId');
  localStorage.removeItem('generationId');
};

// Get the current active session ID
export const getCurrentSessionId = () => {
  // Try session storage first, then fall back to local storage
  return sessionStorage.getItem('currentSessionId') || localStorage.getItem('currentSessionId');
};

// Clear all session data (for logout or reset)
export const clearAllSessionData = () => {
  localStorage.removeItem('odooModuleSessions');
  localStorage.removeItem('currentSessionId');
  localStorage.removeItem('moduleContext');
  localStorage.removeItem('specificationId');
  localStorage.removeItem('planId');
  localStorage.removeItem('generationId');
  sessionStorage.clear();
};

// Store a value in both session and local storage
export const storeValue = (key, value) => {
  sessionStorage.setItem(key, value);
  localStorage.setItem(key, value);
};

// Get a value from session storage or local storage
export const getValue = (key) => {
  return sessionStorage.getItem(key) || localStorage.getItem(key);
};

// Remove a value from both session and local storage
export const removeValue = (key) => {
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
};