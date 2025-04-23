import os
import json
import uuid
from datetime import datetime
from services.llm_service import LLMService
from services.specification_service import SpecificationService

class DevelopmentPlanService:
    """
    Service for generating and managing development plans
    """
    
    def __init__(self):
        """
        Initialize the development plan service
        """
        self.llm_service = LLMService()
        self.specification_service = SpecificationService()
        
        # In-memory storage for development plans (in a real implementation, this would be a database)
        self.plans = {}
        
        # Create data directory if it doesn't exist
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'plans')
        os.makedirs(self.data_dir, exist_ok=True)
    
    def generate_plan(self, specification_id):
        """
        Generate a development plan based on a specification
        
        Args:
            specification_id (str): Specification ID
            
        Returns:
            tuple: (plan_id, plan)
        """
        # Get the specification
        specification = self.specification_service.get_specification(specification_id)
        
        if not specification:
            raise ValueError(f"Specification not found: {specification_id}")
        
        # Generate a unique plan ID
        plan_id = str(uuid.uuid4())
        
        # Prepare the prompt for the LLM
        prompt = self._prepare_plan_prompt(specification)
        
        # Call the LLM to generate the plan
        plan = self._generate_plan_with_llm(prompt, specification)
        
        # Store the plan
        self.plans[plan_id] = {
            'plan': plan,
            'specification_id': specification_id,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'status': 'draft'
        }
        
        # Save the plan to a file
        self._save_plan(plan_id)
        
        return plan_id, plan
    
    def get_plan(self, plan_id):
        """
        Get a development plan by ID
        
        Args:
            plan_id (str): Plan ID
            
        Returns:
            dict: Development plan
        """
        if plan_id not in self.plans:
            # Try to load from file
            if not self._load_plan(plan_id):
                return None
        
        return self.plans[plan_id]['plan']
    
    def update_plan(self, plan_id, feedback):
        """
        Update a development plan based on user feedback
        
        Args:
            plan_id (str): Plan ID
            feedback (str): User feedback
            
        Returns:
            dict: Updated development plan
        """
        if plan_id not in self.plans:
            # Try to load from file
            if not self._load_plan(plan_id):
                raise ValueError(f"Development plan not found: {plan_id}")
        
        # Get the current plan
        plan_data = self.plans[plan_id]
        current_plan = plan_data['plan']
        specification_id = plan_data['specification_id']
        
        # Get the specification
        specification = self.specification_service.get_specification(specification_id)
        
        # Prepare the prompt for the LLM
        prompt = self._prepare_update_prompt(current_plan, specification, feedback)
        
        # Call the LLM to update the plan
        updated_plan = self._update_plan_with_llm(prompt, current_plan)
        
        # Update the plan
        self.plans[plan_id]['plan'] = updated_plan
        self.plans[plan_id]['updated_at'] = datetime.now().isoformat()
        
        # Save the updated plan to a file
        self._save_plan(plan_id)
        
        return updated_plan
    
    def approve_plan(self, plan_id):
        """
        Mark a development plan as approved
        
        Args:
            plan_id (str): Plan ID
        """
        if plan_id not in self.plans:
            # Try to load from file
            if not self._load_plan(plan_id):
                raise ValueError(f"Development plan not found: {plan_id}")
        
        # Update the status
        self.plans[plan_id]['status'] = 'approved'
        self.plans[plan_id]['approved_at'] = datetime.now().isoformat()
        
        # Save the updated plan to a file
        self._save_plan(plan_id)
    
    def _prepare_plan_prompt(self, specification):
        """
        Prepare the prompt for generating a development plan
        
        Args:
            specification (dict): Module specification
            
        Returns:
            str: Formatted prompt
        """
        prompt = """
        Based on the following Odoo module specification, generate a detailed development plan.
        The plan should include:
        
        1. Module Structure: A list of files and directories that will be created
        2. Development Steps: A step-by-step plan for implementing the module
        
        Module Specification:
        """
        
        # Add specification to the prompt
        prompt += json.dumps(specification, indent=2)
        
        return prompt
    
    def _prepare_update_prompt(self, current_plan, specification, feedback):
        """
        Prepare the prompt for updating a development plan
        
        Args:
            current_plan (dict): Current development plan
            specification (dict): Module specification
            feedback (str): User feedback
            
        Returns:
            str: Formatted prompt
        """
        prompt = """
        Update the following Odoo module development plan based on the user feedback.
        
        Module Specification:
        """
        
        # Add specification to the prompt
        prompt += json.dumps(specification, indent=2)
        
        prompt += "\n\nCurrent Development Plan:\n"
        prompt += json.dumps(current_plan, indent=2)
        
        prompt += "\n\nUser Feedback:\n" + feedback
        
        prompt += """
        
        Provide the complete updated development plan in the same format as the current plan.
        """
        
        return prompt
    
    def _generate_plan_with_llm(self, prompt, specification):
        """
        Generate a development plan using the LLM
        
        Args:
            prompt (str): Formatted prompt
            specification (dict): Module specification
            
        Returns:
            dict: Generated development plan
        """
        # In a real implementation, this would call the LLM service
        # For now, we'll return a sample development plan based on the specification
        
        module_name = specification.get('module_name', 'untitled_module').lower().replace(' ', '_')
        
        # Sample module structure
        module_structure = [
            {"name": module_name, "isFolder": True, "level": 0},
            {"name": "__init__.py", "isFolder": False, "level": 1},
            {"name": "__manifest__.py", "isFolder": False, "level": 1},
            {"name": "controllers", "isFolder": True, "level": 1},
            {"name": "__init__.py", "isFolder": False, "level": 2},
            {"name": "main.py", "isFolder": False, "level": 2},
            {"name": "models", "isFolder": True, "level": 1},
            {"name": "__init__.py", "isFolder": False, "level": 2},
            {"name": f"{module_name}.py", "isFolder": False, "level": 2},
            {"name": "views", "isFolder": True, "level": 1},
            {"name": f"{module_name}_views.xml", "isFolder": False, "level": 2},
            {"name": f"{module_name}_templates.xml", "isFolder": False, "level": 2},
            {"name": "menu.xml", "isFolder": False, "level": 2},
            {"name": "security", "isFolder": True, "level": 1},
            {"name": "ir.model.access.csv", "isFolder": False, "level": 2},
            {"name": "static", "isFolder": True, "level": 1},
            {"name": "description", "isFolder": True, "level": 2},
            {"name": "icon.png", "isFolder": False, "level": 3},
            {"name": "src", "isFolder": True, "level": 2},
            {"name": "js", "isFolder": True, "level": 3},
            {"name": f"{module_name}.js", "isFolder": False, "level": 4},
            {"name": "css", "isFolder": True, "level": 3},
            {"name": f"{module_name}.css", "isFolder": False, "level": 4},
            {"name": "data", "isFolder": True, "level": 1},
            {"name": f"{module_name}_data.xml", "isFolder": False, "level": 2}
        ]
        
        # Sample development steps
        development_steps = [
            {
                "title": "Setup Module Structure",
                "description": "Create the basic module structure with necessary files and directories according to Odoo standards."
            },
            {
                "title": "Define Data Models",
                "description": f"Create Python classes for the data models needed for the {specification.get('module_name', 'module')}."
            },
            {
                "title": "Implement Security Rules",
                "description": "Define access control rules for the new models and create necessary security groups."
            },
            {
                "title": "Create Backend Views",
                "description": "Develop XML views for displaying and interacting with the module data, including list, form, and search views."
            },
            {
                "title": "Implement Business Logic",
                "description": "Code the core business logic for the module functionality."
            },
            {
                "title": "Develop Frontend UI Components",
                "description": "Create JavaScript components for the user interface in the Odoo web client."
            },
            {
                "title": "Add Demo Data",
                "description": "Create demonstration data for testing and showcasing the module functionality."
            },
            {
                "title": "Write Documentation",
                "description": "Create documentation for the module, including usage instructions and technical details."
            }
        ]
        
        # Combine into a development plan
        plan = {
            "module_structure": module_structure,
            "development_steps": development_steps
        }
        
        return plan
    
    def _update_plan_with_llm(self, prompt, current_plan):
        """
        Update a development plan using the LLM
        
        Args:
            prompt (str): Formatted prompt
            current_plan (dict): Current development plan
            
        Returns:
            dict: Updated development plan
        """
        # In a real implementation, this would call the LLM service
        # For now, we'll return a slightly modified version of the current plan
        
        # Create a deep copy of the current plan
        updated_plan = json.loads(json.dumps(current_plan))
        
        # Add a new development step
        if "development_steps" in updated_plan:
            updated_plan["development_steps"].append({
                "title": "Additional Step Based on Feedback",
                "description": "This step was added based on user feedback to address specific requirements."
            })
        
        return updated_plan
    
    def _save_plan(self, plan_id):
        """
        Save a development plan to a file
        
        Args:
            plan_id (str): Plan ID
        """
        file_path = os.path.join(self.data_dir, f"{plan_id}.json")
        
        with open(file_path, 'w') as f:
            json.dump(self.plans[plan_id], f, indent=2)
    
    def _load_plan(self, plan_id):
        """
        Load a development plan from a file
        
        Args:
            plan_id (str): Plan ID
            
        Returns:
            bool: True if loaded successfully, False otherwise
        """
        file_path = os.path.join(self.data_dir, f"{plan_id}.json")
        
        if not os.path.exists(file_path):
            return False
        
        try:
            with open(file_path, 'r') as f:
                self.plans[plan_id] = json.load(f)
            return True
        except Exception:
            return False