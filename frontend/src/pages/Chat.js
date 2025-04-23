import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaPaperPlane, FaRobot, FaUser, FaSpinner, FaImage, FaFilePdf, FaFile, FaUpload } from 'react-icons/fa/index.js';

// Components for the chat interface
const ChatContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
`;

const ChatHeader = styled.div`
  margin-bottom: 1.5rem;
`;

const ChatTitle = styled.h1`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const ChatDescription = styled.p`
  color: ${({ theme }) => theme.colors.secondary};
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background-color: white;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
`;

const MessageGroup = styled.div`
  margin-bottom: 1.5rem;
  max-width: 80%;
  align-self: ${({ isUser }) => (isUser ? 'flex-end' : 'flex-start')};
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  color: ${({ theme, isUser }) => 
    isUser ? theme.colors.primary : theme.colors.secondary};
`;

const MessageIcon = styled.div`
  margin-right: 0.5rem;
  font-size: 1.2rem;
`;

const MessageSender = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const Message = styled.div`
  background-color: ${({ theme, isUser }) => 
    isUser ? theme.colors.primary : theme.colors.light};
  color: ${({ isUser }) => (isUser ? 'white' : 'inherit')};
  padding: 0.75rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 1rem;
  line-height: 1.5;
  white-space: pre-wrap;
  
  p {
    margin: 0 0 0.75rem 0;
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  code {
    font-family: monospace;
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.1rem 0.3rem;
    border-radius: 0.2rem;
    font-size: 0.9em;
    color: ${({ isUser }) => (isUser ? 'white' : 'inherit')};
  }
  
  pre {
    margin: 0.75rem 0;
    background-color: rgba(0, 0, 0, 0.1);
    padding: 0.75rem;
    border-radius: 0.3rem;
    overflow-x: auto;
    
    code {
      background-color: transparent;
      padding: 0;
      color: ${({ isUser }) => (isUser ? 'white' : 'inherit')};
    }
  }
  
  ul, ol {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
  }
  
  .markdown-content {
    & > :first-child {
      margin-top: 0;
    }
    & > :last-child {
      margin-bottom: 0;
    }
  }
`;

const MessageImage = styled.div`
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  max-width: 100%;
  
  img {
    max-width: 100%;
    max-height: 300px;
    border-radius: ${({ theme }) => theme.borderRadius.md};
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
`;

const InputContainer = styled.div`
  display: flex;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  background-color: white;
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  font-size: 1rem;
  
  &:focus {
    outline: none;
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.light};
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  padding: 0 1.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.secondary};
    cursor: not-allowed;
  }
`;

const UploadButton = styled.button`
  background-color: ${({ theme }) => theme.colors.light};
  color: ${({ theme }) => theme.colors.secondary};
  border: none;
  padding: 0 1rem;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.border};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const FilePreview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const FilePreviewItem = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .remove-button {
    position: absolute;
    top: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    cursor: pointer;
  }
`;

const ButtonIcon = styled.span`
  margin-right: ${({ hasText }) => (hasText ? '0.5rem' : '0')};
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  color: ${({ theme }) => theme.colors.secondary};
`;

const SpinnerIcon = styled(FaSpinner)`
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

// Sample initial messages to guide the user
const initialMessages = [
  {
    id: 1,
    sender: 'assistant',
    content: "Welcome to the Odoo Module Builder! I'll help you create a custom Odoo module by asking a series of questions about your requirements. Let's get started!",
  },
  {
    id: 2,
    sender: 'assistant',
    content: "First, could you tell me what you'd like to name your module? This should be a descriptive name that reflects the module's purpose. You can also share screenshots of similar modules or UI elements you'd like to recreate.",
  },
];

function Chat() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [context, setContext] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  
  // Auto-scroll to the bottom of the messages container
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };
  
  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    Promise.all(
      files.map(file => {
        return new Promise((resolve, reject) => {
          // Check if file is an image
          if (!file.type.startsWith('image/')) {
            alert('Only image files are supported.');
            reject(new Error('Unsupported file type'));
            return;
          }

          const reader = new FileReader();
          reader.onload = (e) => {
            const base64Data = e.target.result.split(',')[1]; // Remove data URL prefix
            resolve({
              id: Math.random().toString(36).substring(2),
              name: file.name,
              type: file.type,
              data: base64Data,
              preview: URL.createObjectURL(file)
            });
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
      })
    )
    .then(fileData => {
      setSelectedFiles(prev => [...prev, ...fileData]);
    })
    .catch(error => {
      console.error('Error processing files:', error);
    });
  };
  
  const handleRemoveFile = (id) => {
    setSelectedFiles(files => files.filter(file => file.id !== id));
  };
  
  const handleOpenFileDialog = () => {
    fileInputRef.current?.click();
  };
  
  const handleSendMessage = async () => {
    if (!input.trim() && selectedFiles.length === 0) return;
    
    // Add user message to the chat
    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      content: input,
    };
    
    // Add files if present
    if (selectedFiles.length > 0) {
      userMessage.files = selectedFiles.map(file => ({
        id: file.id,
        name: file.name,
        type: file.type,
        preview: file.preview
      }));
    }
    
    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Prepare files data for API
      const filesData = selectedFiles.map(({id, name, type, data}) => ({
        id, name, type, data
      }));
      
      // Call the backend API to process the message
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          conversation_id: conversationId,
          context: context,
          files: filesData
        }),
      });
      
      // Clear selected files
      setSelectedFiles([]);
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      
      // Update conversation ID and context
      setConversationId(data.conversation_id);
      setContext(data.context);
      
      // Add assistant response to the chat
      const assistantMessage = {
        id: messages.length + 2,
        sender: 'assistant',
        content: data.response,
      };
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      
      // Check if we should move to the next step
      if (data.next_step === 'specification') {
        // Store the conversation context in session storage for use in the specification page
        sessionStorage.setItem('moduleContext', JSON.stringify(data.context));
        
        // Add a "Continue to Specification" button instead of automatic redirection
        const continueMessage = {
          id: messages.length + 3,
          sender: 'system',
          content: "I have enough information to generate your module specification. Click the button below when you're ready to continue.",
          showContinueButton: true
        };
        
        setMessages(prevMessages => [...prevMessages, continueMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to the chat
      const errorMessage = {
        id: messages.length + 2,
        sender: 'assistant',
        content: "I'm sorry, there was an error processing your message. Please try again.",
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  return (
    <ChatContainer>
      <ChatHeader>
        <ChatTitle>Build Your Odoo Module</ChatTitle>
        <ChatDescription>
          Answer the questions below to define your module requirements. 
          You can share screenshots of existing UI or modules you want to improve.
        </ChatDescription>
      </ChatHeader>
      
      <MessagesContainer>
        {messages.map((message) => (
          <MessageGroup 
            key={message.id} 
            isUser={message.sender === 'user'}
          >
            <MessageHeader isUser={message.sender === 'user'}>
              <MessageIcon>
                {message.sender === 'user' ? <FaUser /> : <FaRobot />}
              </MessageIcon>
              <MessageSender>
                {message.sender === 'user' ? 'You' : 'Assistant'}
              </MessageSender>
            </MessageHeader>
            <Message isUser={message.sender === 'user'}>
              {message.sender === 'assistant' ? (
                <div className="markdown-content">{message.content}</div>
              ) : (
                message.content
              )}
              {message.files && message.files.map(file => (
                <MessageImage key={file.id}>
                  <img src={file.preview} alt={file.name} title={file.name} />
                </MessageImage>
              ))}
              {message.showContinueButton && (
                <div style={{ marginTop: '15px' }}>
                  <button
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate('/specification-review')}
                  >
                    Continue to Specification
                  </button>
                </div>
              )}
            </Message>
          </MessageGroup>
        ))}
        
        {isLoading && (
          <LoadingIndicator>
            <SpinnerIcon />
            <span>Assistant is typing...</span>
          </LoadingIndicator>
        )}
        
        <div ref={messagesEndRef} />
      </MessagesContainer>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <InputContainer>
          <UploadButton 
            onClick={handleOpenFileDialog}
            disabled={isLoading}
            title="Upload image"
          >
            <FaImage />
          </UploadButton>
          <HiddenFileInput 
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/*"
            multiple
          />
          <ChatInput
            type="text"
            placeholder="Type your message here..."
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <SendButton
            onClick={handleSendMessage}
            disabled={(!input.trim() && selectedFiles.length === 0) || isLoading}
          >
            <ButtonIcon hasText={false}>
              <FaPaperPlane />
            </ButtonIcon>
          </SendButton>
        </InputContainer>
        
        {selectedFiles.length > 0 && (
          <FilePreview>
            {selectedFiles.map(file => (
              <FilePreviewItem key={file.id}>
                <img src={file.preview} alt={file.name} />
                <button 
                  className="remove-button" 
                  onClick={() => handleRemoveFile(file.id)}
                >
                  ×
                </button>
              </FilePreviewItem>
            ))}
          </FilePreview>
        )}
        
        <button
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
          onClick={() => {
            // Store the current context in session storage
            const currentContext = context || {};
            sessionStorage.setItem('moduleContext', JSON.stringify(currentContext));
            
            // Navigate to the specification review page
            navigate('/specification-review');
          }}
        >
          Generate Specifications
          <span>→</span>
        </button>
      </div>
    </ChatContainer>
  );
}

export default Chat;