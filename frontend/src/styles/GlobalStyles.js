import { createGlobalStyle } from 'styled-components';
import './tailwind.css';

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${({ theme }) => theme.fonts.body};
    background-color: #f8f9fb;
    color: ${({ theme }) => theme.colors.text.primary};
    line-height: 1.6;
  }

  a {
    text-decoration: none;
    color: ${({ theme }) => theme.colors.primary.main};
    transition: color 0.3s ease;

    &:hover {
      color: ${({ theme }) => theme.colors.primary.dark};
    }
  }

  button {
    cursor: pointer;
    font-family: ${({ theme }) => theme.fonts.body};
  }

  ul, ol {
    list-style-position: inside;
  }

  h1, h2, h3, h4, h5, h6 {
    margin-bottom: 1rem;
    font-weight: 500;
    line-height: 1.2;
    color: ${({ theme }) => theme.colors.text.primary};
  }

  p {
    margin-bottom: 1rem;
    color: ${({ theme }) => theme.colors.text.primary};
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