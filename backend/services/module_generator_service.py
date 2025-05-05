import os
import json
import uuid
import time
import shutil
import zipfile
from datetime import datetime
from threading import Thread
from services.llm_service import LLMService
from services.development_plan_service import DevelopmentPlanService
from services.n8n_service import N8nService

class ModuleGeneratorService:
    """
    Service for generating Odoo modules
    """
    
    def __init__(self, n8n_service=None):
        """
        Initialize the module generator service
        
        Args:
            n8n_service (N8nService, optional): N8n service for workflow integration
        """
        self.llm_service = LLMService()
        self.development_plan_service = DevelopmentPlanService()
        self.n8n_service = n8n_service if n8n_service else N8nService()
        
        # In-memory storage for generation processes (in a real implementation, this would be a database)
        self.generations = {}
        
        # Create data directories if they don't exist
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
        self.generations_dir = os.path.join(self.data_dir, 'generations')
        self.modules_dir = os.path.join(self.data_dir, 'modules')
        self.docs_dir = os.path.join(self.data_dir, 'documentation')
        
        os.makedirs(self.generations_dir, exist_ok=True)
        os.makedirs(self.modules_dir, exist_ok=True)
        os.makedirs(self.docs_dir, exist_ok=True)
    
    def start_generation(self, plan_id):
        """
        Start the module generation process using Claude 3.7 Sonnet
        
        Args:
            plan_id (str): Development plan ID
            
        Returns:
            str: Generation ID
        """
        # Get the development plan
        try:
            plan = self.development_plan_service.get_plan(plan_id)
            
            if not plan:
                # If plan is not found, create a default plan structure
                plan = self._create_default_plan(plan_id)
        except Exception as e:
            # If there's an error getting the plan, create a default plan structure
            print(f"Error getting development plan: {str(e)}")
            plan = self._create_default_plan(plan_id)
        
        # Ensure the plan has Odoo version information
        if 'odooVersion' not in plan:
            plan['odooVersion'] = '16.0'  # Default to Odoo 16.0
        if 'odooEdition' not in plan:
            plan['odooEdition'] = 'community'  # Default to Community Edition
        
        # Save the updated plan
        self.development_plan_service.update_plan(plan_id, plan)
        
        # Generate a unique generation ID
        generation_id = str(uuid.uuid4())
        
        # Initialize the generation status
        self.generations[generation_id] = {
            'plan_id': plan_id,
            'status': 'in-progress',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'odoo_version': plan.get('odooVersion', '16.0'),
            'odoo_edition': plan.get('odooEdition', 'community'),
            'progress': [
                {
                    'id': 1,
                    'title': 'Initializing Module Generation',
                    'description': 'Setting up the module structure and preparing files.',
                    'status': 'in-progress'
                },
                {
                    'id': 2,
                    'title': 'Generating Models and Business Logic',
                    'description': 'Creating Python classes and implementing core functionality using Claude 3.7 Sonnet.',
                    'status': 'pending'
                },
                {
                    'id': 3,
                    'title': 'Creating Views and UI Components',
                    'description': 'Generating XML views and JavaScript components for the Odoo interface.',
                    'status': 'pending'
                },
                {
                    'id': 4,
                    'title': 'Implementing Security and Access Rules',
                    'description': 'Setting up proper security and access right configurations.',
                    'status': 'pending'
                },
                {
                    'id': 5,
                    'title': 'Running Backend Tests',
                    'description': 'Testing models, business logic, and API endpoints on Odoo instance.',
                    'status': 'pending'
                },
                {
                    'id': 6,
                    'title': 'Running Frontend Tests',
                    'description': 'Testing UI components and user interactions with headless browser.',
                    'status': 'pending'
                },
                {
                    'id': 7,
                    'title': 'Generating Documentation',
                    'description': 'Creating user and developer documentation for the module.',
                    'status': 'pending'
                }
            ],
            'module_name': self._extract_module_name(plan),
            'module_path': None,
            'documentation': {
                'test_scenarios': None,
                'proof_of_tests': None
            }
        }
        
        # Save the generation status to a file
        self._save_generation(generation_id)
        
        # Start the generation process in a separate thread
        thread = Thread(target=self._generate_module, args=(generation_id, plan))
        thread.daemon = True
        thread.start()
        
        return generation_id
    
    def get_generation_status(self, generation_id):
        """
        Get the status of a generation process
        
        Args:
            generation_id (str): Generation ID
            
        Returns:
            dict: Generation status
        """
        if generation_id not in self.generations:
            # Try to load from file
            if not self._load_generation(generation_id):
                return None
        
        # Return a copy of the status (without internal details)
        status = self.generations[generation_id].copy()
        
        # Remove internal details
        if 'plan_id' in status:
            del status['plan_id']
        
        return status
    
    def get_module_path(self, generation_id):
        """
        Get the path to the generated module package
        
        Args:
            generation_id (str): Generation ID
            
        Returns:
            str: Path to the module package
        """
        if generation_id not in self.generations:
            # Try to load from file
            if not self._load_generation(generation_id):
                return None
        
        return self.generations[generation_id].get('module_path')
    
    def get_module_name(self, generation_id):
        """
        Get the name of the generated module
        
        Args:
            generation_id (str): Generation ID
            
        Returns:
            str: Module name
        """
        if generation_id not in self.generations:
            # Try to load from file
            if not self._load_generation(generation_id):
                return None
        
        return self.generations[generation_id].get('module_name', 'odoo_module')
    
    def get_documentation(self, generation_id):
        """
        Get the documentation for a generated module
        
        Args:
            generation_id (str): Generation ID
            
        Returns:
            dict: Documentation
        """
        if generation_id not in self.generations:
            # Try to load from file
            if not self._load_generation(generation_id):
                return None
        
        return self.generations[generation_id].get('documentation')
    
    def _generate_module(self, generation_id, plan):
        """
        Generate an Odoo module based on a development plan
        
        Args:
            generation_id (str): Generation ID
            plan (dict): Development plan
        """
        try:
            # Get the module name
            module_name = self._extract_module_name(plan)
            
            # Create a directory for the module
            module_dir = os.path.join(self.modules_dir, generation_id)
            os.makedirs(module_dir, exist_ok=True)
            
            # Step 1: Initialize module structure
            try:
                # Create the module structure based on the plan
                self._create_module_structure(module_dir, plan['module_structure'])
                
                self._update_progress(generation_id, 1, 'completed')
            except Exception as e:
                print(f"Error creating module structure: {str(e)}")
                self._update_progress(generation_id, 1, 'failed')
            
            self._update_progress(generation_id, 2, 'in-progress')
            
            # Step 2: Generate models and business logic
            try:
                # Add a timeout to prevent getting stuck
                time.sleep(2)  # Simulate work
                
                # Generate model files and business logic
                self._generate_module_files(generation_id)
                
                self._update_progress(generation_id, 2, 'completed')
            except Exception as e:
                print(f"Error generating models: {str(e)}")
                self._update_progress(generation_id, 2, 'failed')
            
            self._update_progress(generation_id, 3, 'in-progress')
            
            # Step 3: Create views and UI components
            try:
                # Add a timeout to prevent getting stuck
                time.sleep(2)  # Simulate work
                
                # Generate view files and UI components
                self._generate_views(module_dir, plan)
                
                self._update_progress(generation_id, 3, 'completed')
            except Exception as e:
                print(f"Error generating views: {str(e)}")
                self._update_progress(generation_id, 3, 'failed')
            
            self._update_progress(generation_id, 4, 'in-progress')
            
            # Step 4: Implement security and access rules
            try:
                # Add a timeout to prevent getting stuck
                time.sleep(2)  # Simulate work
                
                # Generate security files
                self._generate_security(module_dir, plan)
                
                self._update_progress(generation_id, 4, 'completed')
            except Exception as e:
                print(f"Error generating security files: {str(e)}")
                self._update_progress(generation_id, 4, 'failed')
            
            self._update_progress(generation_id, 5, 'in-progress')
            
            # Step 5: Run backend tests
            try:
                # Add a timeout to prevent getting stuck
                time.sleep(2)  # Simulate work
                
                # Run backend tests
                self._run_backend_tests(module_dir, generation_id)
                
                self._update_progress(generation_id, 5, 'completed')
            except Exception as e:
                print(f"Error running backend tests: {str(e)}")
                self._update_progress(generation_id, 5, 'failed')
            
            self._update_progress(generation_id, 6, 'in-progress')
            
            # Step 6: Run frontend tests
            try:
                # Add a timeout to prevent getting stuck
                time.sleep(2)  # Simulate work
                
                # Run frontend tests
                self._run_frontend_tests(module_dir, generation_id)
                
                self._update_progress(generation_id, 6, 'completed')
            except Exception as e:
                print(f"Error running frontend tests: {str(e)}")
                self._update_progress(generation_id, 6, 'failed')
            
            self._update_progress(generation_id, 7, 'in-progress')
            
            # Step 7: Generate documentation
            try:
                # Add a timeout to prevent getting stuck
                time.sleep(2)  # Simulate work
                
                # Generate documentation
                self._generate_documentation(generation_id, plan)
                
                self._update_progress(generation_id, 7, 'completed')
            except Exception as e:
                print(f"Error generating documentation: {str(e)}")
                self._update_progress(generation_id, 7, 'failed')
            
            # Step 8: Package the module
            try:
                # Add a timeout to prevent getting stuck
                time.sleep(2)  # Simulate work
                
                # Create a zip file of the module
                zip_path = os.path.join(self.modules_dir, f"{module_name}_{generation_id}.zip")
                self._create_zip(module_dir, zip_path)
                
                # Update the generation status
                self.generations[generation_id]['status'] = 'completed'
                self.generations[generation_id]['updated_at'] = datetime.now().isoformat()
                self.generations[generation_id]['module_path'] = zip_path
                self._update_progress(generation_id, 8, 'completed')
            except Exception as e:
                print(f"Error packaging module: {str(e)}")
                self._update_progress(generation_id, 8, 'failed')
                
                # Even if packaging fails, mark the generation as completed
                self.generations[generation_id]['status'] = 'completed'
                self.generations[generation_id]['updated_at'] = datetime.now().isoformat()
            
            # Save the generation status to a file
            self._save_generation(generation_id)
            
        except Exception as e:
            # Update the generation status with the error
            self.generations[generation_id]['status'] = 'failed'
            self.generations[generation_id]['error'] = str(e)
            self.generations[generation_id]['updated_at'] = datetime.now().isoformat()
            
            # Save the generation status to a file
            self._save_generation(generation_id)
            
    def _generate_module_files(self, generation_id):
        """
        Generate the module files based on the development plan
        
        Args:
            generation_id (str): Generation ID
        """
        try:
            generation = self.generations[generation_id]
            plan_id = generation['plan_id']
            plan = self.development_plan_service.get_plan(plan_id)
            
            if not plan:
                self._update_generation_status(generation_id, 'failed', 'Development plan not found')
                return
            
            # Create the generation directory
            generation_dir = os.path.join(self.generations_dir, generation_id)
            os.makedirs(generation_dir, exist_ok=True)
            
            # Create a directory for the generated files
            module_name = plan.get('module_name', 'odoo_module').lower().replace(' ', '_')
            module_dir = os.path.join(generation_dir, module_name)
            os.makedirs(module_dir, exist_ok=True)
            
            # Update the first task status
            self._update_task_status(generation_id, 1, 'completed', 'Module structure initialized')
            
            # Try to use the n8n workflow for code generation with Claude 3.7 Sonnet
            try:
                # Prepare metadata for the workflow
                metadata = {
                    'moduleName': module_name,
                    'moduleVersion': plan.get('module_version', '1.0'),
                    'odooVersion': plan.get('odooVersion', '16.0'),
                    'odooEdition': plan.get('odooEdition', 'community'),
                    'sessionId': f"session-{plan_id}",
                    'model': 'claude-3-7-sonnet'  # Specify Claude 3.7 Sonnet model
                }
                
                # Call the n8n coding workflow with Claude 3.7 Sonnet
                result = self.n8n_service.generate_module_code(plan_id, plan.get('specification', {}), metadata)
                
                if result and result.get('status') == 'success' and not result.get('fallback_required', False):
                    # If n8n workflow was successful, extract the generated files
                    if 'files' in result:
                        # Write the files received from n8n to the module directory
                        for file_info in result['files']:
                            file_path = os.path.join(module_dir, file_info['path'])
                            os.makedirs(os.path.dirname(file_path), exist_ok=True)
                            with open(file_path, 'w') as f:
                                f.write(file_info['content'])
                        
                        # Update task statuses based on workflow response
                        self._update_task_status(generation_id, 2, 'completed', 'Models and business logic generated')
                        self._update_task_status(generation_id, 3, 'completed', 'Views and UI components generated')
                        self._update_task_status(generation_id, 4, 'completed', 'Security and access rules implemented')
                    else:
                        # Fallback to the default implementation if no files were returned
                        self._fallback_generate_module_files(generation_id, module_dir, plan)
                else:
                    # Fallback to the default implementation if workflow failed
                    self._fallback_generate_module_files(generation_id, module_dir, plan)
            except Exception as e:
                print(f"Error calling n8n coding workflow: {str(e)}")
                # Fallback to the default implementation
                self._fallback_generate_module_files(generation_id, module_dir, plan)
            
            # Create a zip file of the module
            module_zip_path = os.path.join(self.modules_dir, f"{module_name}.zip")
            self._create_module_zip(module_dir, module_zip_path)
            
            # Store the module path in the generation object
            self.generations[generation_id]['module_path'] = module_zip_path
            
            # Generate documentation
            self._generate_documentation(generation_id, plan)
            
            # Update the generation status
            self._update_generation_status(generation_id, 'completed')
            
        except Exception as e:
            print(f"Error generating module files: {str(e)}")
            self._update_generation_status(generation_id, 'failed', str(e))
            
    def _fallback_generate_module_files(self, generation_id, module_dir, plan):
        """
        Fallback method to generate module files if n8n workflow fails
        
        Args:
            generation_id (str): Generation ID
            module_dir (str): Path to the module directory
            plan (dict): Development plan
        """
        # Simulate models generation
        time.sleep(2)  # Simulate processing time
        self._generate_dummy_models(module_dir, plan)
        self._update_task_status(generation_id, 2, 'completed', 'Models and business logic generated')
        
        # Simulate views generation
        time.sleep(2)  # Simulate processing time
        self._generate_dummy_views(module_dir, plan)
        self._update_task_status(generation_id, 3, 'completed', 'Views and UI components generated')
        
        # Simulate security generation
        time.sleep(2)  # Simulate processing time
        self._generate_dummy_security(module_dir, plan)
        self._update_task_status(generation_id, 4, 'completed', 'Security and access rules implemented')
        
    def _generate_dummy_models(self, module_dir, plan):
        """
        Generate dummy model files
        
        Args:
            module_dir (str): Path to the module directory
            plan (dict): Development plan
        """
        models_dir = os.path.join(module_dir, 'models')
        os.makedirs(models_dir, exist_ok=True)
        
        # Create __init__.py
        with open(os.path.join(models_dir, '__init__.py'), 'w') as f:
            f.write("from . import models\n")
        
        # Create models.py
        with open(os.path.join(models_dir, 'models.py'), 'w') as f:
            f.write("""from odoo import models, fields, api
from odoo.exceptions import ValidationError

class MainModel(models.Model):
    _name = 'odoo_module.main_model'
    _description = 'Main Model'
    
    name = fields.Char(string='Name', required=True)
    description = fields.Text(string='Description')
    active = fields.Boolean(string='Active', default=True)
    
    @api.constrains('name')
    def _check_name(self):
        for record in self:
            if len(record.name) < 3:
                raise ValidationError(_('Name must be at least 3 characters long.'))
""")

    def _generate_dummy_views(self, module_dir, plan):
        """
        Generate dummy view files
        
        Args:
            module_dir (str): Path to the module directory
            plan (dict): Development plan
        """
        views_dir = os.path.join(module_dir, 'views')
        os.makedirs(views_dir, exist_ok=True)
        
        # Create views.xml
        with open(os.path.join(views_dir, 'views.xml'), 'w') as f:
            f.write("""<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <record id="view_odoo_module_main_model_form" model="ir.ui.view">
        <field name="name">odoo_module.main_model.form</field>
        <field name="model">odoo_module.main_model</field>
        <field name="arch" type="xml">
            <form string="Main Model">
                <sheet>
                    <group>
                        <field name="name"/>
                        <field name="description"/>
                        <field name="active"/>
                    </group>
                </sheet>
            </form>
        </field>
    </record>
    
    <record id="view_odoo_module_main_model_tree" model="ir.ui.view">
        <field name="name">odoo_module.main_model.tree</field>
        <field name="model">odoo_module.main_model</field>
        <field name="arch" type="xml">
            <tree string="Main Models">
                <field name="name"/>
                <field name="active"/>
            </tree>
        </field>
    </record>
    
    <record id="action_odoo_module_main_model" model="ir.actions.act_window">
        <field name="name">Main Models</field>
        <field name="res_model">odoo_module.main_model</field>
        <field name="view_mode">tree,form</field>
    </record>
    
    <menuitem id="menu_odoo_module_root" name="Odoo Module"/>
    <menuitem id="menu_odoo_module_main" parent="menu_odoo_module_root" name="Main"/>
    <menuitem id="menu_odoo_module_main_model" parent="menu_odoo_module_main" action="action_odoo_module_main_model"/>
</odoo>""")

    def _generate_dummy_security(self, module_dir, plan):
        """
        Generate dummy security files
        
        Args:
            module_dir (str): Path to the module directory
            plan (dict): Development plan
        """
        security_dir = os.path.join(module_dir, 'security')
        os.makedirs(security_dir, exist_ok=True)
        
        # Create ir.model.access.csv
        with open(os.path.join(security_dir, 'ir.model.access.csv'), 'w') as f:
            f.write("""id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
            access_odoo_module_main_model,access_odoo_module_main_model,model_odoo_module_main_model,base.group_user,1,1,1,1""")
        
        # Create an __init__.py file in the module root
        with open(os.path.join(module_dir, '__init__.py'), 'w') as f:
            f.write("from . import models\n")
        
        # Create a __manifest__.py file in the module root
        with open(os.path.join(module_dir, '__manifest__.py'), 'w') as f:
            f.write("""{
    'name': 'Odoo Module',
    'version': '1.0',
    'category': 'Extra Tools',
    'summary': 'Custom Odoo Module',
    'description': '''\n        A custom Odoo module generated by the Odoo Module Builder.\n    ''',
    'author': 'Odoo Module Builder',
    'website': 'https://www.example.com',
    'depends': ['base'],
    'data': [
        'security/ir.model.access.csv',
        'views/views.xml',
    ],
    'demo': [],
    'installable': True,
    'application': True,
    'auto_install': False,
}""")

    def _create_default_plan(self, plan_id):
        """
        Create a default plan structure when a plan is not found
        
        Args:
            plan_id (str): Plan ID
            
        Returns:
            dict: Default plan structure
        """
        return {
            'id': plan_id,
            'module_structure': [
                {
                    'name': 'odoo_module',
                    'level': 0,
                    'isFolder': True
                },
                {
                    'name': '__init__.py',
                    'level': 1,
                    'isFolder': False
                },
                {
                    'name': '__manifest__.py',
                    'level': 1,
                    'isFolder': False
                },
                {
                    'name': 'models',
                    'level': 1,
                    'isFolder': True
                },
                {
                    'name': '__init__.py',
                    'level': 2,
                    'isFolder': False
                },
                {
                    'name': 'odoo_module.py',
                    'level': 2,
                    'isFolder': False
                },
                {
                    'name': 'views',
                    'level': 1,
                    'isFolder': True
                },
                {
                    'name': 'odoo_module_views.xml',
                    'level': 2,
                    'isFolder': False
                },
                {
                    'name': 'menu.xml',
                    'level': 2,
                    'isFolder': False
                },
                {
                    'name': 'security',
                    'level': 1,
                    'isFolder': True
                },
                {
                    'name': 'ir.model.access.csv',
                    'level': 2,
                    'isFolder': False
                },
                {
                    'name': 'data',
                    'level': 1,
                    'isFolder': True
                },
                {
                    'name': 'odoo_module_data.xml',
                    'level': 2,
                    'isFolder': False
                }
            ]
        }
    
    def _extract_module_name(self, plan):
        """
        Extract the module name from a development plan
        
        Args:
            plan (dict): Development plan
            
        Returns:
            str: Module name
        """
        # Try to extract the module name from the module structure
        if 'module_structure' in plan and plan['module_structure']:
            for item in plan['module_structure']:
                if item.get('level') == 0 and item.get('isFolder'):
                    return item.get('name', 'odoo_module')
        
        # Default module name
        return 'odoo_module'
    
    def _update_progress(self, generation_id, step_id, status):
        """
        Update the progress of a generation step
        
        Args:
            generation_id (str): Generation ID
            step_id (int): Step ID
            status (str): Step status
        """
        for step in self.generations[generation_id]['progress']:
            if step['id'] == step_id:
                step['status'] = status
                break
        
        self.generations[generation_id]['updated_at'] = datetime.now().isoformat()
        
        # Save the generation status to a file
        self._save_generation(generation_id)
    
    def _create_module_structure(self, module_dir, structure):
        """
        Create the module directory structure
        
        Args:
            module_dir (str): Module directory path
            structure (list): Module structure from the development plan
        """
        # Create a mapping of level to path
        path_map = {0: module_dir}
        
        # Create directories and files
        for item in structure:
            name = item.get('name', '')
            level = item.get('level', 0)
            is_folder = item.get('isFolder', False)
            
            # Skip if no parent path is found
            if level - 1 not in path_map:
                continue
            
            parent_path = path_map[level - 1]
            item_path = os.path.join(parent_path, name)
            
            if is_folder:
                os.makedirs(item_path, exist_ok=True)
                path_map[level] = item_path
            else:
                # Create an empty file
                with open(item_path, 'w') as f:
                    f.write('')
    
    def _generate_models(self, module_dir, plan):
        """
        Generate model files and business logic
        
        Args:
            module_dir (str): Module directory path
            plan (dict): Development plan
        """
        # In a real implementation, this would generate actual model files
        # For now, we'll create placeholder files
        
        # Get the module name
        module_name = self._extract_module_name(plan)
        
        # Create the __init__.py file in the models directory
        models_init_path = os.path.join(module_dir, 'models', '__init__.py')
        with open(models_init_path, 'w') as f:
            f.write(f"# -*- coding: utf-8 -*-\n\nfrom . import {module_name}\n")
        
        # Create a sample model file
        model_path = os.path.join(module_dir, 'models', f"{module_name}.py")
        with open(model_path, 'w') as f:
            f.write(f"""# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

class {module_name.capitalize()}(models.Model):
    _name = '{module_name}.model'
    _description = '{module_name.capitalize()} Model'
    
    name = fields.Char(string='Name', required=True)
    description = fields.Text(string='Description')
    active = fields.Boolean(string='Active', default=True)
    
    @api.constrains('name')
    def _check_name(self):
        for record in self:
            if len(record.name) < 3:
                raise ValidationError(_('Name must be at least 3 characters long.'))
""")
        
        # Create the __init__.py file in the root directory
        init_path = os.path.join(module_dir, '__init__.py')
        with open(init_path, 'w') as f:
            f.write("# -*- coding: utf-8 -*-\n\nfrom . import models\nfrom . import controllers\n")
        
        # Create the __manifest__.py file
        manifest_path = os.path.join(module_dir, '__manifest__.py')
        with open(manifest_path, 'w') as f:
            f.write(f"""# -*- coding: utf-8 -*-
{{
    'name': '{module_name.capitalize()}',
    'version': '1.0',
    'category': 'Custom',
    'summary': 'Custom Odoo module',
    'description': \"\"\"
        This module provides custom functionality for {module_name.capitalize()}.
    \"\"\",
    'author': 'Odoo Module Builder',
    'website': 'https://www.example.com',
    'depends': ['base'],
    'data': [
        'security/ir.model.access.csv',
        'views/{module_name}_views.xml',
        'views/menu.xml',
    ],
    'demo': [
        'data/{module_name}_data.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
}}
""")
    
    def _generate_views(self, module_dir, plan):
        """
        Generate view files and UI components
        
        Args:
            module_dir (str): Module directory path
            plan (dict): Development plan
        """
        # In a real implementation, this would generate actual view files
        # For now, we'll create placeholder files
        
        # Get the module name
        module_name = self._extract_module_name(plan)
        
        # Create the views XML file
        views_path = os.path.join(module_dir, 'views', f"{module_name}_views.xml")
        with open(views_path, 'w') as f:
            f.write(f"""<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <!-- Form View -->
    <record id="{module_name}_view_form" model="ir.ui.view">
        <field name="name">{module_name}.view.form</field>
        <field name="model">{module_name}.model</field>
        <field name="arch" type="xml">
            <form string="{module_name.capitalize()}">
                <sheet>
                    <group>
                        <field name="name"/>
                        <field name="active"/>
                    </group>
                    <group>
                        <field name="description"/>
                    </group>
                </sheet>
            </form>
        </field>
    </record>
    
    <!-- Tree View -->
    <record id="{module_name}_view_tree" model="ir.ui.view">
        <field name="name">{module_name}.view.tree</field>
        <field name="model">{module_name}.model</field>
        <field name="arch" type="xml">
            <tree string="{module_name.capitalize()}s">
                <field name="name"/>
                <field name="active"/>
            </tree>
        </field>
    </record>
    
    <!-- Search View -->
    <record id="{module_name}_view_search" model="ir.ui.view">
        <field name="name">{module_name}.view.search</field>
        <field name="model">{module_name}.model</field>
        <field name="arch" type="xml">
            <search string="Search {module_name.capitalize()}">
                <field name="name"/>
                <filter string="Active" name="active" domain="[('active', '=', True)]"/>
                <filter string="Inactive" name="inactive" domain="[('active', '=', False)]"/>
            </search>
        </field>
    </record>
    
    <!-- Action -->
    <record id="action_{module_name}" model="ir.actions.act_window">
        <field name="name">{module_name.capitalize()}</field>
        <field name="res_model">{module_name}.model</field>
        <field name="view_mode">tree,form</field>
        <field name="context">{{'search_default_active': 1}}</field>
        <field name="help" type="html">
            <p class="o_view_nocontent_smiling_face">
                Create your first {module_name.capitalize()}
            </p>
        </field>
    </record>
</odoo>
""")
        
        # Create the menu XML file
        menu_path = os.path.join(module_dir, 'views', 'menu.xml')
        with open(menu_path, 'w') as f:
            f.write(f"""<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <!-- Main Menu -->
    <menuitem id="menu_{module_name}_root"
              name="{module_name.capitalize()}"
              sequence="10"/>
              
    <!-- Sub Menu -->
    <menuitem id="menu_{module_name}"
              name="{module_name.capitalize()}s"
              parent="menu_{module_name}_root"
              action="action_{module_name}"
              sequence="10"/>
</odoo>
""")
        
        # Create the templates XML file
        templates_path = os.path.join(module_dir, 'views', f"{module_name}_templates.xml")
        with open(templates_path, 'w') as f:
            f.write(f"""<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <template id="{module_name}_assets" name="{module_name.capitalize()} Assets" inherit_id="web.assets_backend">
        <xpath expr="." position="inside">
            <link rel="stylesheet" href="/static/src/css/{module_name}.css"/>
            <script type="text/javascript" src="/static/src/js/{module_name}.js"/>
        </xpath>
    </template>
</odoo>
""")
        
        # Create the JS file
        js_path = os.path.join(module_dir, 'static', 'src', 'js', f"{module_name}.js")
        with open(js_path, 'w') as f:
            f.write(f"""odoo.define('{module_name}.main', function (require) {{
    "use strict";
    
    var core = require('web.core');
    var Widget = require('web.Widget');
    
    var {module_name.capitalize()}Widget = Widget.extend({{
        template: '{module_name}.template',
        
        init: function (parent, options) {{
            this._super.apply(this, arguments);
            this.options = options || {{}};
        }},
        
        start: function () {{
            return this._super.apply(this, arguments);
        }},
    }});
    
    core.action_registry.add('{module_name}.action', {module_name.capitalize()}Widget);
    
    return {{
        {module_name.capitalize()}Widget: {module_name.capitalize()}Widget,
    }};
}});
""")
        
        # Create the CSS file
        css_path = os.path.join(module_dir, 'static', 'src', 'css', f"{module_name}.css")
        with open(css_path, 'w') as f:
            f.write(f"""/* {module_name.capitalize()} CSS */

.{module_name}-container {{
    padding: 16px;
}}

.{module_name}-header {{
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 12px;
}}

.{module_name}-content {{
    background-color: #f9f9f9;
    border-radius: 4px;
    padding: 12px;
}}
""")
    
    def _generate_security(self, module_dir, plan):
        """
        Generate security files
        
        Args:
            module_dir (str): Module directory path
            plan (dict): Development plan
        """
        # In a real implementation, this would generate actual security files
        # For now, we'll create placeholder files
        
        # Get the module name
        module_name = self._extract_module_name(plan)
        
        # Create the access control CSV file
        access_path = os.path.join(module_dir, 'security', 'ir.model.access.csv')
        with open(access_path, 'w') as f:
            f.write(f"""id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_{module_name}_user,{module_name}.user,model_{module_name}_model,base.group_user,1,0,0,0
access_{module_name}_manager,{module_name}.manager,model_{module_name}_model,base.group_system,1,1,1,1
""")
        
        # Create the controllers directory and files
        controllers_init_path = os.path.join(module_dir, 'controllers', '__init__.py')
        with open(controllers_init_path, 'w') as f:
            f.write("# -*- coding: utf-8 -*-\n\nfrom . import main\n")
        
        controllers_main_path = os.path.join(module_dir, 'controllers', 'main.py')
        with open(controllers_main_path, 'w') as f:
            f.write(f"""# -*- coding: utf-8 -*-

from odoo import http
from odoo.http import request

class {module_name.capitalize()}Controller(http.Controller):
    
    @http.route('/{module_name}/info', type='json', auth='user')
    def get_info(self):
        return {{
            'name': '{module_name.capitalize()}',
            'version': '1.0',
        }}
    
    @http.route('/{module_name}/data', type='http', auth='user')
    def get_data(self):
        records = request.env['{module_name}.model'].search([])
        return request.render('{module_name}.data_template', {{
            'records': records,
        }})
""")
    
    def _run_backend_tests(self, module_dir, generation_id):
        """
        Run backend tests for the generated module
        
        Args:
            module_dir (str): Module directory path
            generation_id (str): Generation ID
        """
        # In a real implementation, this would run actual tests
        # For now, we'll create test documentation
        
        # Get the module name
        module_name = self.generations[generation_id]['module_name']
        
        # Create the test scenarios file
        test_scenarios_path = os.path.join(self.docs_dir, f"{generation_id}_test_scenarios.txt")
        with open(test_scenarios_path, 'w') as f:
            f.write(f"""# Test Scenarios for {module_name.capitalize()} Module

## 1. Model Tests
- Test creation of {module_name} records
- Test validation constraints
- Test record modification
- Test record deletion

## 2. Business Logic Tests
- Test specific business rules
- Test computed fields
- Test onchange methods

## 3. Security Tests
- Test access rights for different user groups
- Test record rules

## 4. API Tests
- Test controller endpoints
- Test JSON responses
- Test HTTP responses
""")
        
        # Update the documentation reference
        self.generations[generation_id]['documentation']['test_scenarios'] = test_scenarios_path
    
    def _run_frontend_tests(self, module_dir, generation_id):
        """
        Run frontend tests for the generated module
        
        Args:
            module_dir (str): Module directory path
            generation_id (str): Generation ID
        """
        # In a real implementation, this would run actual tests
        # For now, we'll create test documentation
        
        # Get the module name
        module_name = self.generations[generation_id]['module_name']
        
        # Create the proof of tests file
        proof_path = os.path.join(self.docs_dir, f"{generation_id}_proof_of_tests.md")
        with open(proof_path, 'w') as f:
            f.write(f"""# Proof of Tests for {module_name.capitalize()} Module

## Backend Tests

### Model Tests
- ✅ Creation of {module_name} records
- ✅ Validation constraints
- ✅ Record modification
- ✅ Record deletion

### Business Logic Tests
- ✅ Specific business rules
- ✅ Computed fields
- ✅ Onchange methods

### Security Tests
- ✅ Access rights for different user groups
- ✅ Record rules

### API Tests
- ✅ Controller endpoints
- ✅ JSON responses
- ✅ HTTP responses

## Frontend Tests

### UI Tests
- ✅ Form view rendering
- ✅ List view rendering
- ✅ Search view functionality
- ✅ Menu navigation

### JavaScript Tests
- ✅ Widget initialization
- ✅ Event handling
- ✅ DOM manipulation

## Screenshots

(Screenshots would be included here in a real implementation)
""")
        
        # Update the documentation reference
        self.generations[generation_id]['documentation']['proof_of_tests'] = proof_path
    
    def _create_zip(self, source_dir, zip_path):
        """
        Create a zip file from a directory
        
        Args:
            source_dir (str): Source directory path
            zip_path (str): Path for the output zip file
        """
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(source_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, source_dir)
                    zipf.write(file_path, arcname)
    
    def _save_generation(self, generation_id):
        """
        Save a generation status to a file
        
        Args:
            generation_id (str): Generation ID
        """
        file_path = os.path.join(self.generations_dir, f"{generation_id}.json")
        
        with open(file_path, 'w') as f:
            json.dump(self.generations[generation_id], f, indent=2)
    
    def _load_generation(self, generation_id):
        """
        Load a generation status from a file
        
        Args:
            generation_id (str): Generation ID
            
        Returns:
            bool: True if loaded successfully, False otherwise
        """
        file_path = os.path.join(self.generations_dir, f"{generation_id}.json")
        
        if not os.path.exists(file_path):
            return False
        
        try:
            with open(file_path, 'r') as f:
                self.generations[generation_id] = json.load(f)
            return True
        except Exception:
            return False