import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import VanillaTilt from 'vanilla-tilt';
import { Link } from 'react-router-dom';
import Tooltip from '../Common/Tooltip';

const CardContainer = styled(motion.div)`
  position: relative;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: 1rem;
  overflow: hidden;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  height: 100%;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  transform-style: preserve-3d;
  transform: perspective(1000px);
  cursor: pointer;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  transform: translateZ(20px);
  position: relative;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CardDescription = styled.p`
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  transform: translateZ(15px);
  position: relative;
  color: ${({ theme }) => theme.colors.text.secondary};
  opacity: 0.9;
  flex-grow: 1;
`;

const StatusBadge = styled.span`
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  transform: translateZ(30px);
  background-color: ${({ status, theme }) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'in-progress':
        return theme.colors.warning;
      case 'draft':
        return theme.colors.info;
      default:
        return theme.colors.secondary;
    }
  }};
  color: white;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  transform: translateZ(25px);
  position: relative;
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
  background-color: ${({ primary, theme }) => 
    primary ? theme.colors.primary.main : 'transparent'};
  color: ${({ primary, theme }) => 
    primary ? 'white' : theme.colors.text.primary};
  border: 1px solid ${({ primary, theme }) => 
    primary ? 'transparent' : theme.colors.border};
  
  &:hover {
    background-color: ${({ primary, theme }) => 
      primary ? theme.colors.primary.dark : theme.colors.background.hover};
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
`;

const ModuleIcon = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.primary.light};
  color: ${({ theme }) => theme.colors.primary.contrastText};
  font-size: 1.25rem;
  transform: translateZ(30px);
`;

const ModuleCard = ({ 
  module = {},
  onEdit,
  onView,
  onDelete
}) => {
  const {
    id,
    name = 'Untitled Module',
    description = 'No description provided',
    status = 'draft',
    icon = '📦',
    lastUpdated
  } = module;
  
  const cardRef = useRef(null);
  
  useEffect(() => {
    if (cardRef.current) {
      VanillaTilt.init(cardRef.current, {
        max: 10,
        scale: 1.03,
        speed: 800,
        glare: true,
        'max-glare': 0.2,
        gyroscope: true
      });
    }
    
    return () => {
      if (cardRef.current && cardRef.current.vanillaTilt) {
        cardRef.current.vanillaTilt.destroy();
      }
    };
  }, []);
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    hover: {
      y: -5,
      boxShadow: '0 20px 30px rgba(0, 0, 0, 0.15)',
      transition: { 
        type: 'spring',
        stiffness: 500,
        damping: 30
      }
    }
  };
  
  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(id);
  };
  
  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(id);
  };
  
  return (
    <CardContainer
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onClick={() => onView && onView(id)}
      className="module-card"
    >
      <ModuleIcon>{icon}</ModuleIcon>
      <Tooltip content={`Status: ${status.replace('-', ' ')}`}>
        <StatusBadge status={status}>
          {status.replace('-', ' ')}
        </StatusBadge>
      </Tooltip>
      
      <div style={{ marginTop: '2.5rem' }}>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      
      {lastUpdated && (
        <div 
          style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '1rem' }}
        >
          Last updated: {new Date(lastUpdated).toLocaleDateString()}
        </div>
      )}
      
      <ActionButtons>
        <Tooltip content="Edit module details">
          <ActionButton onClick={handleEdit}>
            Edit
          </ActionButton>
        </Tooltip>
        
        <Tooltip content="View module outputs and code">
          <ActionButton primary onClick={() => onView && onView(id)}>
            View
          </ActionButton>
        </Tooltip>
        
        <Tooltip content="Delete this module permanently" placement="left">
          <ActionButton onClick={handleDelete} style={{ marginLeft: 'auto' }}>
            Delete
          </ActionButton>
        </Tooltip>
      </ActionButtons>
    </CardContainer>
  );
};

export default ModuleCard; 