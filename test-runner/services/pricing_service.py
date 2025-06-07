import json
import re
import logging
from typing import Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class PricingService:
    """Dynamic pricing service for Odoo modules based on complexity analysis"""
    
    def __init__(self):
        # Base pricing configuration
        self.base_price = 50.0  # Minimum price in USD
        self.max_price = 100.0  # Maximum price in USD
        
        # Complexity scoring weights
        self.complexity_weights = {
            "lines_of_code": 0.3,
            "python_models": 0.25,
            "xml_views": 0.2,
            "security_rules": 0.1,
            "data_files": 0.05,
            "fix_attempts": 0.1
        }
    
    async def calculate_price(self, project_id: str, module_code: Dict[str, str], 
                            specification: str, fix_attempts: int = 0) -> Dict[str, Any]:
        """Calculate dynamic pricing based on module complexity"""
        try:
            logger.info(f"Calculating price for project {project_id}")
            
            # Analyze module complexity
            complexity_analysis = self._analyze_module_complexity(module_code, specification)
            
            # Add fix attempts to complexity
            complexity_analysis["fix_attempts"] = fix_attempts
            
            # Calculate complexity score
            complexity_score = self._calculate_complexity_score(complexity_analysis)
            
            # Calculate final price
            price_multiplier = min(complexity_score / 100.0, 1.0)  # Cap at 100%
            final_price = self.base_price + (price_multiplier * (self.max_price - self.base_price))
            
            # Round to nearest $5
            final_price = round(final_price / 5) * 5
            
            # Ensure minimum price
            final_price = max(final_price, self.base_price)
            
            pricing_result = {
                "project_id": project_id,
                "base_price": self.base_price,
                "complexity_score": complexity_score,
                "final_price": final_price,
                "pricing_breakdown": {
                    "complexity_analysis": complexity_analysis,
                    "weighted_scores": self._calculate_weighted_scores(complexity_analysis),
                    "price_multiplier": price_multiplier,
                    "calculated_at": datetime.now().isoformat()
                }
            }
            
            logger.info(f"Price calculated for project {project_id}: ${final_price}")
            return pricing_result
            
        except Exception as e:
            logger.error(f"Error calculating price for project {project_id}: {e}")
            # Return base price on error
            return {
                "project_id": project_id,
                "base_price": self.base_price,
                "complexity_score": 0,
                "final_price": self.base_price,
                "pricing_breakdown": {
                    "error": str(e),
                    "calculated_at": datetime.now().isoformat()
                }
            }
    
    def _analyze_module_complexity(self, module_code: Dict[str, str], specification: str) -> Dict[str, int]:
        """Analyze module code and specification to determine complexity factors"""
        analysis = {
            "lines_of_code": 0,
            "python_models": 0,
            "xml_views": 0,
            "security_rules": 0,
            "data_files": 0,
            "javascript_files": 0,
            "css_files": 0,
            "report_files": 0,
            "wizard_files": 0,
            "api_controllers": 0,
            "workflow_complexity": 0
        }
        
        for file_path, content in module_code.items():
            if not content:
                continue
                
            # Count lines of code (excluding empty lines and comments)
            lines = content.split('\n')
            code_lines = [line.strip() for line in lines if line.strip() and not line.strip().startswith('#')]
            analysis["lines_of_code"] += len(code_lines)
            
            # Analyze Python files
            if file_path.endswith('.py'):
                analysis.update(self._analyze_python_file(content, file_path))
            
            # Analyze XML files
            elif file_path.endswith('.xml'):
                analysis.update(self._analyze_xml_file(content, file_path))
            
            # Analyze JavaScript files
            elif file_path.endswith('.js'):
                analysis["javascript_files"] += 1
            
            # Analyze CSS files
            elif file_path.endswith('.css') or file_path.endswith('.scss'):
                analysis["css_files"] += 1
            
            # Analyze CSV files (data files)
            elif file_path.endswith('.csv'):
                analysis["data_files"] += 1
        
        # Analyze specification complexity
        spec_complexity = self._analyze_specification_complexity(specification)
        analysis["workflow_complexity"] = spec_complexity
        
        return analysis
    
    def _analyze_python_file(self, content: str, file_path: str) -> Dict[str, int]:
        """Analyze Python file for complexity indicators"""
        analysis = {}
        
        # Count Odoo models
        model_patterns = [
            r'class\s+\w+\(models\.Model\)',
            r'class\s+\w+\(models\.TransientModel\)',
            r'class\s+\w+\(models\.AbstractModel\)'
        ]
        
        model_count = 0
        for pattern in model_patterns:
            model_count += len(re.findall(pattern, content))
        analysis["python_models"] = model_count
        
        # Count API controllers
        if 'http.route' in content or '@route' in content:
            analysis["api_controllers"] = len(re.findall(r'@.*route', content))
        
        # Count wizard/transient models
        if 'TransientModel' in content:
            analysis["wizard_files"] = 1
        
        return analysis
    
    def _analyze_xml_file(self, content: str, file_path: str) -> Dict[str, int]:
        """Analyze XML file for complexity indicators"""
        analysis = {}
        
        # Count different types of XML elements
        if 'security' in file_path.lower():
            # Security rules
            analysis["security_rules"] = len(re.findall(r'<record.*model=["\']ir\.model\.access["\']', content))
        
        elif 'views' in file_path.lower() or 'view' in file_path.lower():
            # Views
            view_types = ['form', 'tree', 'kanban', 'calendar', 'graph', 'pivot', 'search']
            view_count = 0
            for view_type in view_types:
                view_count += len(re.findall(f'<{view_type}[^>]*>', content))
            analysis["xml_views"] = view_count
        
        elif 'report' in file_path.lower():
            # Reports
            analysis["report_files"] = len(re.findall(r'<template.*report', content))
        
        # Count data records
        data_records = len(re.findall(r'<record[^>]*>', content))
        if data_records > 0:
            analysis["data_files"] = 1
        
        return analysis
    
    def _analyze_specification_complexity(self, specification: str) -> int:
        """Analyze specification text for workflow complexity indicators"""
        if not specification:
            return 0
        
        complexity_keywords = [
            # Workflow complexity
            'workflow', 'state', 'approval', 'validation', 'notification',
            'automation', 'trigger', 'condition', 'rule', 'permission',
            
            # Integration complexity  
            'api', 'webhook', 'integration', 'external', 'sync', 'import', 'export',
            
            # Data complexity
            'calculation', 'formula', 'computation', 'aggregation', 'summary',
            'report', 'dashboard', 'chart', 'graph',
            
            # UI complexity
            'wizard', 'popup', 'modal', 'dynamic', 'conditional', 'interactive'
        ]
        
        spec_lower = specification.lower()
        complexity_score = 0
        
        for keyword in complexity_keywords:
            # Count occurrences with diminishing returns
            count = spec_lower.count(keyword)
            if count > 0:
                complexity_score += min(count * 2, 10)  # Max 10 points per keyword
        
        return min(complexity_score, 50)  # Cap at 50 points
    
    def _calculate_complexity_score(self, complexity_analysis: Dict[str, int]) -> int:
        """Calculate weighted complexity score"""
        total_score = 0
        
        # Lines of code score (0-30 points)
        loc = complexity_analysis.get("lines_of_code", 0)
        loc_score = min(loc / 50, 30)  # 1 point per 50 lines, max 30
        
        # Models score (0-25 points)
        models_score = min(complexity_analysis.get("python_models", 0) * 5, 25)
        
        # Views score (0-20 points)  
        views_score = min(complexity_analysis.get("xml_views", 0) * 3, 20)
        
        # Security rules score (0-10 points)
        security_score = min(complexity_analysis.get("security_rules", 0) * 2, 10)
        
        # Data files score (0-5 points)
        data_score = min(complexity_analysis.get("data_files", 0) * 2, 5)
        
        # Fix attempts penalty (0-10 points)
        fix_penalty = min(complexity_analysis.get("fix_attempts", 0) * 2, 10)
        
        # Workflow complexity score (0-15 points)
        workflow_score = min(complexity_analysis.get("workflow_complexity", 0) / 3, 15)
        
        # Additional complexity factors
        additional_score = 0
        additional_score += min(complexity_analysis.get("api_controllers", 0) * 3, 10)
        additional_score += min(complexity_analysis.get("wizard_files", 0) * 2, 8)
        additional_score += min(complexity_analysis.get("report_files", 0) * 3, 12)
        
        total_score = (loc_score + models_score + views_score + security_score + 
                      data_score + fix_penalty + workflow_score + additional_score)
        
        return int(min(total_score, 100))  # Cap at 100 points
    
    def _calculate_weighted_scores(self, complexity_analysis: Dict[str, int]) -> Dict[str, float]:
        """Calculate individual weighted scores for transparency"""
        weighted_scores = {}
        
        for factor, weight in self.complexity_weights.items():
            raw_value = complexity_analysis.get(factor, 0)
            if factor == "lines_of_code":
                normalized_value = min(raw_value / 50, 30)
            elif factor == "python_models":
                normalized_value = min(raw_value * 5, 25)
            elif factor == "xml_views":
                normalized_value = min(raw_value * 3, 20)
            elif factor == "security_rules":
                normalized_value = min(raw_value * 2, 10)
            elif factor == "data_files":
                normalized_value = min(raw_value * 2, 5)
            elif factor == "fix_attempts":
                normalized_value = min(raw_value * 2, 10)
            else:
                normalized_value = raw_value
            
            weighted_scores[factor] = normalized_value * weight
        
        return weighted_scores 