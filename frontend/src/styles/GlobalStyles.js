import { createGlobalStyle } from 'styled-components';
import './tailwind.css';

const GlobalStyles = createGlobalStyle`
  /* Base reset that doesn't conflict with Tailwind */
  * {
    box-sizing: border-box;
  }

  /* Basic typography and colors */
  body {
    font-family: ${({ theme }) => theme.fonts.body};
    background-color: #f8f9fb;
    color: ${({ theme }) => theme.colors.text.primary};
    line-height: 1.6;
    margin: 0;
    padding: 0;
  }

  /* Enhanced form controls */
  input, textarea, select {
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: 1rem;
    transition: all 0.2s ease-in-out;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    padding: 0.5rem 0.75rem;
    width: 100%;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    outline: none;

    &:focus {
      border-color: ${({ theme }) => theme.colors.primary.main};
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
    }

    &::placeholder {
      color: #9ca3af;
    }
  }

  /* Button styling */
  button {
    cursor: pointer;
    font-family: ${({ theme }) => theme.fonts.body};
    font-weight: 500;
    transition: all 0.2s ease;
  }

  a {
    text-decoration: none;
    color: ${({ theme }) => theme.colors.primary.main};
    transition: color 0.3s ease;

    &:hover {
      color: ${({ theme }) => theme.colors.primary.dark};
    }
  }

  ul, ol {
    list-style-position: inside;
  }

  h1, h2, h3, h4, h5, h6 {
    margin-bottom: 1rem;
    font-weight: 600;
    line-height: 1.2;
    color: ${({ theme }) => theme.colors.text.primary};
  }

  p {
    margin-bottom: 1rem;
    color: ${({ theme }) => theme.colors.text.primary};
  }

  /* Form elements spacing */
  form .grid {
    margin-bottom: 1.5rem;
  }

  /* Label styling */
  label {
    font-weight: 500;
    margin-bottom: 0.5rem;
    display: block;
  }

  /* Helper text */
  .helper-text {
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  /* Dark mode styles */
  html.dark {
    body {
      background-color: #121212;
      color: #f5f5f5;
    }

    a {
      color: ${({ theme }) => theme.colors.primary.light};
      
      &:hover {
        color: ${({ theme }) => theme.colors.primary.main};
      }
    }
  }
`;

export default GlobalStyles;