import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FaCode, FaBars } from 'react-icons/fa/index.js';

const HeaderContainer = styled.header`
  background-color: white;
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.primary.dark};
  font-size: 1.5rem;
  font-weight: 700;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary.main};
    text-decoration: none;
  }
`;

const LogoIcon = styled(FaCode)`
  margin-right: 0.5rem;
  font-size: 1.8rem;
  color: ${({ theme }) => theme.colors.primary.main};
`;

const Nav = styled.nav`
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
    position: absolute;
    top: 70px;
    left: 0;
    right: 0;
    background-color: white;
    flex-direction: column;
    padding: 1rem;
    z-index: 10;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: flex;
  }
`;

const NavLink = styled(Link)`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-left: 1.5rem;
  padding: 0.5rem 0;
  position: relative;
  font-weight: ${({ active, theme }) => 
    active ? theme.fontWeights.bold : theme.fontWeights.normal};
  
  &:after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: ${({ active }) => (active ? '100%' : '0')};
    height: 2px;
    background-color: ${({ theme }) => theme.colors.primary.main};
    transition: width 0.3s ease;
  }
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary.main};
    text-decoration: none;
    
    &:after {
      width: 100%;
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin: 0.5rem 0;
  }
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary.main};
  font-size: 1.5rem;
  cursor: pointer;
  display: none;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: block;
  }
`;

function Header() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo to="/">
          <LogoIcon />
          Odoo Module Builder
        </Logo>
        
        <MenuButton onClick={toggleMenu}>
          <FaBars />
        </MenuButton>
        
        <Nav $isOpen={isMenuOpen}>
          <NavLink to="/" active={location.pathname === '/' ? 1 : 0}>
            Home
          </NavLink>
          <NavLink to="/chat" active={location.pathname === '/chat' ? 1 : 0}>
            Build Module
          </NavLink>
          <NavLink
            to="/specification-review"
            active={location.pathname === '/specification-review' ? 1 : 0}
          >
            Specifications
          </NavLink>
          <NavLink
            to="/development-plan"
            active={location.pathname === '/development-plan' ? 1 : 0}
          >
            Development
          </NavLink>
          <NavLink
            to="/module-output"
            active={location.pathname === '/module-output' ? 1 : 0}
          >
            Output
          </NavLink>
        </Nav>
      </HeaderContent>
    </HeaderContainer>
  );
}

export default Header;