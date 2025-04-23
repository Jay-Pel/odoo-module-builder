import React, { useMemo } from 'react';
import { FixedSizeGrid } from 'react-window';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import ModuleCard from './ModuleCard';
import { useMediaQuery } from '../../utils/hooks';

const GridContainer = styled(motion.div)`
  width: 100%;
  position: relative;
  padding: 1rem 0;
`;

const EmptyState = styled.div`
  width: 100%;
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
`;

const EmptyStateTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const EmptyStateDescription = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 500px;
  margin-bottom: 1.5rem;
`;

const EmptyStateButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors.primary.main};
  color: white;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary.dark};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const getColumnCount = (width) => {
  if (width < 768) return 1;
  if (width < 1024) return 2;
  if (width < 1536) return 3;
  return 4;
};

const ModuleCardGrid = ({ 
  modules = [], 
  onEdit, 
  onView, 
  onDelete,
  onCreateNew,
  height = 800
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');
  
  const columnCount = useMemo(() => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    return 3;
  }, [isMobile, isTablet]);
  
  if (!modules.length) {
    return (
      <EmptyState>
        <EmptyStateTitle>No modules found</EmptyStateTitle>
        <EmptyStateDescription>
          You haven't created any modules yet. Get started by creating your first Odoo module.
        </EmptyStateDescription>
        <EmptyStateButton onClick={onCreateNew}>
          Create New Module
        </EmptyStateButton>
      </EmptyState>
    );
  }
  
  const itemWidth = Math.floor(100 / columnCount);
  const rowCount = Math.ceil(modules.length / columnCount);
  
  // Calculate the grid item key
  const getItemKey = ({ columnIndex, rowIndex }) => {
    const index = rowIndex * columnCount + columnIndex;
    return index < modules.length ? modules[index].id : `empty-${index}`;
  };
  
  // Render a grid cell
  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnCount + columnIndex;
    
    if (index >= modules.length) {
      return <div style={style} />;
    }
    
    const module = modules[index];
    
    return (
      <div style={{
        ...style,
        padding: '1rem'
      }}>
        <ModuleCard 
          module={module} 
          onEdit={onEdit} 
          onView={onView} 
          onDelete={onDelete}
        />
      </div>
    );
  };
  
  return (
    <GridContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FixedSizeGrid
        columnCount={columnCount}
        columnWidth={`${itemWidth}%`}
        height={height}
        rowCount={rowCount}
        rowHeight={350}
        width="100%"
        itemKey={getItemKey}
      >
        {Cell}
      </FixedSizeGrid>
    </GridContainer>
  );
};

export default ModuleCardGrid; 