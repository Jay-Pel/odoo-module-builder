import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import ModuleCardGrid from '../components/Dashboard/ModuleCardGrid.jsx';
import useDashboardStore from '../stores/dashboardStore.js';
import useModuleStore from '../stores/moduleStore.js';
import { useNavigate } from 'react-router-dom';
import Tooltip from '../components/Common/Tooltip.jsx';

const PageContainer = styled.div`
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled(motion.h1)`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary.main}, ${({ theme }) => theme.colors.primary.light});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 2rem;
`;

const StatsContainer = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(motion.div)`
  padding: 1.5rem;
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.background.secondary};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ControlsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const SearchInput = styled.input`
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background.input};
  color: ${({ theme }) => theme.colors.text.primary};
  width: 100%;
  max-width: 400px;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.main};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary.light}33;
  }
`;

const CreateButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors.primary.main};
  color: white;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary.dark};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background: ${({ active, theme }) => 
    active ? theme.colors.primary.main : theme.colors.background.secondary};
  color: ${({ active, theme }) => 
    active ? 'white' : theme.colors.text.primary};
  font-weight: 500;
  border: 1px solid ${({ active, theme }) => 
    active ? 'transparent' : theme.colors.border};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ active, theme }) => 
      active ? theme.colors.primary.dark : theme.colors.background.hover};
  }
`;

const Dashboard = () => {
  const navigate = useNavigate();
  const { modules, fetchModules } = useModuleStore();
  const { filter, setFilter, searchTerm, setSearchTerm } = useDashboardStore();
  const [filteredModules, setFilteredModules] = useState([]);
  
  useEffect(() => {
    // Fetch modules on component mount
    fetchModules();
  }, [fetchModules]);
  
  useEffect(() => {
    // Filter and search modules
    let result = [...modules];
    
    if (filter !== 'all') {
      result = result.filter(module => module.status === filter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(module => 
        module.name.toLowerCase().includes(term) || 
        module.description.toLowerCase().includes(term)
      );
    }
    
    setFilteredModules(result);
  }, [modules, filter, searchTerm]);
  
  const handleModuleEdit = (id) => {
    navigate(`/chat?moduleId=${id}`);
  };
  
  const handleModuleView = (id) => {
    navigate(`/module-output?moduleId=${id}`);
  };
  
  const handleModuleDelete = (id) => {
    // Implement delete logic
    if (window.confirm('Are you sure you want to delete this module?')) {
      // Call delete API and update state
      console.log('Delete module:', id);
    }
  };
  
  const handleCreateNew = () => {
    navigate('/chat');
  };
  
  // Stats for the dashboard
  const stats = [
    {
      value: modules.length,
      label: 'Total Modules'
    },
    {
      value: modules.filter(m => m.status === 'completed').length,
      label: 'Completed'
    },
    {
      value: modules.filter(m => m.status === 'in-progress').length,
      label: 'In Progress'
    },
    {
      value: modules.filter(m => m.status === 'draft').length,
      label: 'Drafts'
    }
  ];
  
  return (
    <PageContainer>
      <Header>
        <Title
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Module Dashboard
        </Title>
        <Subtitle>Manage and track all your Odoo modules</Subtitle>
      </Header>
      
      <StatsContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
          >
            <StatValue>{stat.value}</StatValue>
            <StatLabel>{stat.label}</StatLabel>
          </StatCard>
        ))}
      </StatsContainer>
      
      <ControlsContainer>
        <Tooltip content="Search modules by name or description">
          <SearchInput
            type="text"
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Tooltip>
        
        <FilterContainer>
          <Tooltip content="Show all modules">
            <FilterButton 
              active={filter === 'all'} 
              onClick={() => setFilter('all')}
            >
              All
            </FilterButton>
          </Tooltip>
          
          <Tooltip content="Show only completed modules">
            <FilterButton 
              active={filter === 'completed'} 
              onClick={() => setFilter('completed')}
            >
              Completed
            </FilterButton>
          </Tooltip>
          
          <Tooltip content="Show modules in development">
            <FilterButton 
              active={filter === 'in-progress'} 
              onClick={() => setFilter('in-progress')}
            >
              In Progress
            </FilterButton>
          </Tooltip>
          
          <Tooltip content="Show draft modules">
            <FilterButton 
              active={filter === 'draft'} 
              onClick={() => setFilter('draft')}
            >
              Drafts
            </FilterButton>
          </Tooltip>
        </FilterContainer>
        
        <Tooltip content="Start building a new Odoo module">
          <CreateButton onClick={handleCreateNew}>
            Create New Module
          </CreateButton>
        </Tooltip>
      </ControlsContainer>
      
      <ModuleCardGrid
        modules={filteredModules}
        onEdit={handleModuleEdit}
        onView={handleModuleView}
        onDelete={handleModuleDelete}
        onCreateNew={handleCreateNew}
        height={800}
      />
    </PageContainer>
  );
};

export default Dashboard; 