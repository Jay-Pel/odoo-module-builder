import React, { useEffect, useState, useContext } from 'react';
import styled, { css } from 'styled-components';
import { remark } from 'remark';
import html from 'remark-html';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { ThemeContext } from '../../context/ThemeContext';
import { vs, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Styled components for markdown content
const MarkdownContainer = styled.div`
  font-size: 1rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.primary};
  
  /* Headings */
  h1, h2, h3, h4, h5, h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
    line-height: 1.25;
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  h1 {
    font-size: 2em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
  
  h2 {
    font-size: 1.5em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
  
  h3 {
    font-size: 1.25em;
  }
  
  h4 {
    font-size: 1em;
  }
  
  h5 {
    font-size: 0.875em;
  }
  
  h6 {
    font-size: 0.85em;
    color: ${({ theme }) => theme.colors.text.secondary};
  }
  
  /* Paragraph and text */
  p {
    margin-top: 0;
    margin-bottom: 1em;
  }
  
  a {
    color: ${({ theme }) => theme.colors.primary.main};
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  strong {
    font-weight: 600;
  }
  
  em {
    font-style: italic;
  }
  
  /* Lists */
  ul, ol {
    margin-top: 0;
    margin-bottom: 1em;
    padding-left: 2em;
  }
  
  ul {
    list-style-type: disc;
  }
  
  ol {
    list-style-type: decimal;
  }
  
  li {
    margin-bottom: 0.25em;
  }
  
  /* Blockquotes */
  blockquote {
    margin: 0 0 1em;
    padding: 0 1em;
    color: ${({ theme }) => theme.colors.text.secondary};
    border-left: 0.25em solid ${({ theme }) => theme.colors.border};
  }
  
  /* Code */
  code {
    font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
    font-size: 0.9em;
    padding: 0.2em 0.4em;
    margin: 0;
    background-color: ${({ theme }) => theme.colors.background.secondary};
    border-radius: 3px;
  }
  
  pre {
    margin-top: 0;
    margin-bottom: 1em;
    padding: 1em;
    overflow: auto;
    background-color: ${({ theme }) => theme.colors.background.secondary};
    border-radius: 6px;
    line-height: 1.45;
    
    code {
      padding: 0;
      background-color: transparent;
      border-radius: 0;
    }
  }
  
  /* Tables */
  table {
    display: block;
    width: 100%;
    overflow: auto;
    margin-top: 0;
    margin-bottom: 1em;
    border-spacing: 0;
    border-collapse: collapse;
  }
  
  th {
    font-weight: 600;
    padding: 6px 13px;
    border: 1px solid ${({ theme }) => theme.colors.border};
  }
  
  td {
    padding: 6px 13px;
    border: 1px solid ${({ theme }) => theme.colors.border};
  }
  
  tr {
    background-color: ${({ theme }) => theme.colors.background.primary};
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    
    &:nth-child(2n) {
      background-color: ${({ theme }) => theme.colors.background.secondary};
    }
  }
  
  /* Horizontal rule */
  hr {
    height: 0.25em;
    padding: 0;
    margin: 24px 0;
    background-color: ${({ theme }) => theme.colors.border};
    border: 0;
  }
  
  /* Images */
  img {
    max-width: 100%;
    box-sizing: initial;
    background-color: #fff;
    border-radius: 6px;
  }
  
  /* Responsive styles */
  @media (max-width: 768px) {
    font-size: 0.95rem;
    
    h1 {
      font-size: 1.75em;
    }
    
    h2 {
      font-size: 1.4em;
    }
    
    h3 {
      font-size: 1.15em;
    }
  }
`;

// Table of contents container
const TocContainer = styled.div`
  margin-bottom: 2rem;
  padding: 1rem 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  
  h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.1em;
  }
  
  ul {
    margin-bottom: 0;
  }
  
  a {
    color: ${({ theme }) => theme.colors.primary.main};
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

/**
 * A component for rendering markdown content with syntax highlighting
 * @param {Object} props - Component props
 * @param {string} props.content - Markdown content to render
 * @param {boolean} props.showToc - Whether to show table of contents
 * @param {string} props.className - Additional class names
 */
const MarkdownViewer = ({ content, showToc = false, className = '' }) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [toc, setToc] = useState([]);
  const { theme } = useContext(ThemeContext);
  
  // Choose syntax highlighting theme based on app theme
  const codeStyle = theme === 'light' ? vs : vscDarkPlus;
  
  // Process markdown to HTML
  useEffect(() => {
    const processMarkdown = async () => {
      try {
        // Extract headings for TOC
        const headings = [];
        const headingRegex = /^(#{1,6})\s+(.+)$/gm;
        let match;
        
        while ((match = headingRegex.exec(content)) !== null) {
          const level = match[1].length;
          const text = match[2].trim();
          const slug = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
          
          headings.push({ level, text, slug });
        }
        
        setToc(headings);
        
        // Process content with remark
        const result = await remark()
          .use(html, { sanitize: false })
          .process(content);
        
        // Replace code blocks with syntax highlighted versions
        let processedContent = result.toString();
        
        // Add IDs to headings for TOC
        headings.forEach(({ text, slug }) => {
          const headingRegex = new RegExp(`(<h\\d[^>]*>)(${text})(</h\\d>)`, 'i');
          processedContent = processedContent.replace(
            headingRegex, 
            `$1<a id="${slug}" href="#${slug}" class="anchor"></a>$2$3`
          );
        });
        
        // Replace code blocks with syntax highlighted versions
        const codeBlockRegex = /<pre><code class="language-([a-z0-9]+)">([\s\S]+?)<\/code><\/pre>/g;
        processedContent = processedContent.replace(codeBlockRegex, (_, language, code) => {
          return `<div class="syntax-highlight" data-language="${language}">
            ${SyntaxHighlighter({
              children: code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'),
              style: codeStyle,
              language,
              showLineNumbers: true,
              wrapLines: true
            })}
          </div>`;
        });
        
        setHtmlContent(processedContent);
      } catch (error) {
        console.error('Error processing markdown:', error);
        setHtmlContent(`<p>Error rendering markdown: ${error.message}</p>`);
      }
    };
    
    if (content) {
      processMarkdown();
    } else {
      setHtmlContent('');
      setToc([]);
    }
  }, [content, theme]);
  
  // Generate TOC
  const renderToc = () => {
    if (!showToc || toc.length === 0) return null;
    
    return (
      <TocContainer>
        <h3>Table of Contents</h3>
        <ul>
          {toc.map(({ level, text, slug }, index) => (
            <li 
              key={index} 
              style={{ 
                marginLeft: `${(level - 1) * 1.5}rem`,
                fontSize: `${1 - (level - 1) * 0.05}em`
              }}
            >
              <a href={`#${slug}`}>{text}</a>
            </li>
          ))}
        </ul>
      </TocContainer>
    );
  };
  
  return (
    <div className={`markdown-viewer ${className}`}>
      {renderToc()}
      <MarkdownContainer 
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        className="markdown-content"
      />
    </div>
  );
};

export default MarkdownViewer; 