import os
import json
import uuid
import re
import shutil
import subprocess
from datetime import datetime
from services.llm_service import LLMService

class TestingService:
    """
    Service for testing generated Odoo modules
    """
    
    def __init__(self):
        """
        Initialize the testing service
        """
        self.llm_service = LLMService()
        
        # Create data directories if they don't exist
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
        self.screenshots_dir = os.path.join(self.data_dir, 'screenshots')
        self.test_results_dir = os.path.join(self.data_dir, 'test_results')
        self.fixes_dir = os.path.join(self.data_dir, 'fixes')
        
        os.makedirs(self.screenshots_dir, exist_ok=True)
        os.makedirs(self.test_results_dir, exist_ok=True)
        os.makedirs(self.fixes_dir, exist_ok=True)
        
        # In-memory storage for test results (in a real implementation, this would be a database)
        self.test_results = {}
        self.fixes = {}
    
    def run_tests(self, module_path, generation_id):
        """
        Run tests on a generated module
        
        Args:
            module_path (str): Path to the module directory
            generation_id (str): Generation ID
            
        Returns:
            dict: Test results
        """
        # Create a test results object
        test_results = {
            'generation_id': generation_id,
            'timestamp': datetime.now().isoformat(),
            'status': 'running',
            'backend_tests': [],
            'frontend_tests': [],
            'errors': [],
            'fixes_applied': []
        }
        
        # Run backend tests
        backend_results = self._run_backend_tests(module_path)
        test_results['backend_tests'] = backend_results
        
        # Run frontend tests
        frontend_results = self._run_frontend_tests(module_path)
        test_results['frontend_tests'] = frontend_results
        
        # Collect errors from both backend and frontend tests
        errors = []
        for test in backend_results:
            if not test.get('passed', False) and 'error' in test:
                errors.append({
                    'type': 'backend',
                    'test_name': test['name'],
                    'error': test['error'],
                    'file_path': test.get('file_path')
                })
        
        for test in frontend_results:
            if not test.get('passed', False) and 'error' in test:
                errors.append({
                    'type': 'frontend',
                    'test_name': test['name'],
                    'error': test['error'],
                    'file_path': test.get('file_path')
                })
        
        test_results['errors'] = errors
        
        # Update status based on test results
        if not errors:
            test_results['status'] = 'passed'
        else:
            test_results['status'] = 'failed'
            
            # Attempt to fix errors
            fixes = self._fix_errors(module_path, errors)
            test_results['fixes_applied'] = fixes
            
            # If fixes were applied, run tests again
            if fixes:
                # Update status to indicate fixes were applied
                test_results['status'] = 'fixed'
                
                # Run backend tests again
                backend_results = self._run_backend_tests(module_path)
                test_results['backend_tests_after_fix'] = backend_results
                
                # Run frontend tests again
                frontend_results = self._run_frontend_tests(module_path)
                test_results['frontend_tests_after_fix'] = frontend_results
                
                # Check if all tests pass after fixes
                all_pass = True
                for test in backend_results + frontend_results:
                    if not test.get('passed', False):
                        all_pass = False
                        break
                
                if all_pass:
                    test_results['status'] = 'fixed_and_passed'
        
        # Save test results
        self.test_results[generation_id] = test_results
        self._save_test_results(generation_id)
        
        return test_results
    
    def get_test_results(self, generation_id):
        """
        Get the test results for a generated module
        
        Args:
            generation_id (str): Generation ID
            
        Returns:
            dict: Test results
        """
        if generation_id not in self.test_results:
            # Try to load from file
            if not self._load_test_results(generation_id):
                return None
        
        return self.test_results[generation_id]
    
    def get_screenshot_path(self, screenshot_id):
        """
        Get the path to a screenshot
        
        Args:
            screenshot_id (str): Screenshot ID
            
        Returns:
            str: Path to the screenshot
        """
        return os.path.join(self.screenshots_dir, f"{screenshot_id}.png")
    
    def get_fixes(self, generation_id):
        """
        Get the fixes applied to a generated module
        
        Args:
            generation_id (str): Generation ID
            
        Returns:
            list: Applied fixes
        """
        if generation_id not in self.fixes:
            # Try to load from file
            if not self._load_fixes(generation_id):
                return []
        
        return self.fixes[generation_id]
    
    def _run_backend_tests(self, module_path):
        """
        Run backend tests on a generated module
        
        Args:
            module_path (str): Path to the module directory
            
        Returns:
            list: Test results
        """
        # In a real implementation, this would run actual tests using Odoo's test framework
        # For now, we'll simulate test results
        
        results = []
        
        # Check Python syntax
        python_files = self._find_files(module_path, '.py')
        for file_path in python_files:
            result = self._check_python_syntax(file_path)
            if result:
                results.append(result)
        
        # Check model definitions
        model_files = [f for f in python_files if '/models/' in f]
        for file_path in model_files:
            result = self._check_model_definition(file_path)
            if result:
                results.append(result)
        
        # Check security files
        security_files = self._find_files(os.path.join(module_path, 'security'), '.csv')
        for file_path in security_files:
            result = self._check_security_file(file_path)
            if result:
                results.append(result)
        
        return results
    
    def _run_frontend_tests(self, module_path):
        """
        Run frontend tests on a generated module
        
        Args:
            module_path (str): Path to the module directory
            
        Returns:
            list: Test results
        """
        # In a real implementation, this would run actual tests using a frontend testing framework
        # For now, we'll simulate test results
        
        results = []
        
        # Check XML syntax
        xml_files = self._find_files(module_path, '.xml')
        for file_path in xml_files:
            result = self._check_xml_syntax(file_path)
            if result:
                results.append(result)
        
        # Check JavaScript syntax
        js_files = self._find_files(module_path, '.js')
        for file_path in js_files:
            result = self._check_js_syntax(file_path)
            if result:
                results.append(result)
        
        return results
    
    def _check_python_syntax(self, file_path):
        """
        Check Python syntax
        
        Args:
            file_path (str): Path to the Python file
            
        Returns:
            dict: Test result
        """
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            
            # Try to compile the Python code to check for syntax errors
            compile(content, file_path, 'exec')
            
            return {
                'name': f"Python Syntax Check: {os.path.basename(file_path)}",
                'description': "Checks for Python syntax errors",
                'passed': True,
                'file_path': file_path
            }
        except SyntaxError as e:
            return {
                'name': f"Python Syntax Check: {os.path.basename(file_path)}",
                'description': "Checks for Python syntax errors",
                'passed': False,
                'error': f"Syntax error at line {e.lineno}: {e.msg}",
                'file_path': file_path,
                'line': e.lineno
            }
        except Exception as e:
            return {
                'name': f"Python Syntax Check: {os.path.basename(file_path)}",
                'description': "Checks for Python syntax errors",
                'passed': False,
                'error': str(e),
                'file_path': file_path
            }
    
    def _check_model_definition(self, file_path):
        """
        Check model definition
        
        Args:
            file_path (str): Path to the model file
            
        Returns:
            dict: Test result
        """
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            
            # Check for common model definition issues
            issues = []
            
            # Check if _name is defined for models
            if 'models.Model' in content and '_name' not in content:
                issues.append("Model class is missing _name attribute")
            
            # Check if _description is defined for models
            if 'models.Model' in content and '_description' not in content:
                issues.append("Model class is missing _description attribute")
            
            # Check for potential field definition issues
            if 'fields.' in content:
                # Check for common field definition mistakes
                if re.search(r'fields\.[A-Za-z]+\s*\(\s*\)', content):
                    issues.append("Field definition is missing required parameters")
                
                # Check for string parameter in field definitions
                if re.search(r'fields\.[A-Za-z]+\s*\([^)]*\)', content) and 'string=' not in content:
                    issues.append("Field definitions should include a 'string' parameter for better UI labels")
            
            if issues:
                return {
                    'name': f"Model Definition Check: {os.path.basename(file_path)}",
                    'description': "Checks for proper model definitions",
                    'passed': False,
                    'error': "\n".join(issues),
                    'file_path': file_path
                }
            else:
                return {
                    'name': f"Model Definition Check: {os.path.basename(file_path)}",
                    'description': "Checks for proper model definitions",
                    'passed': True,
                    'file_path': file_path
                }
        except Exception as e:
            return {
                'name': f"Model Definition Check: {os.path.basename(file_path)}",
                'description': "Checks for proper model definitions",
                'passed': False,
                'error': str(e),
                'file_path': file_path
            }
    
    def _check_security_file(self, file_path):
        """
        Check security file
        
        Args:
            file_path (str): Path to the security file
            
        Returns:
            dict: Test result
        """
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            
            # Check for common security file issues
            issues = []
            
            # Check if the file has the correct header
            if not content.startswith('id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink'):
                issues.append("Security file is missing the correct header")
            
            # Check if permissions are defined as 0 or 1
            if re.search(r',[^01],[^01],[^01],[^01]$', content, re.MULTILINE):
                issues.append("Permissions must be defined as 0 or 1")
            
            if issues:
                return {
                    'name': f"Security File Check: {os.path.basename(file_path)}",
                    'description': "Checks for proper security file configuration",
                    'passed': False,
                    'error': "\n".join(issues),
                    'file_path': file_path
                }
            else:
                return {
                    'name': f"Security File Check: {os.path.basename(file_path)}",
                    'description': "Checks for proper security file configuration",
                    'passed': True,
                    'file_path': file_path
                }
        except Exception as e:
            return {
                'name': f"Security File Check: {os.path.basename(file_path)}",
                'description': "Checks for proper security file configuration",
                'passed': False,
                'error': str(e),
                'file_path': file_path
            }
    
    def _check_xml_syntax(self, file_path):
        """
        Check XML syntax
        
        Args:
            file_path (str): Path to the XML file
            
        Returns:
            dict: Test result
        """
        try:
            import xml.etree.ElementTree as ET
            
            with open(file_path, 'r') as f:
                content = f.read()
            
            # Try to parse the XML to check for syntax errors
            ET.fromstring(content)
            
            return {
                'name': f"XML Syntax Check: {os.path.basename(file_path)}",
                'description': "Checks for XML syntax errors",
                'passed': True,
                'file_path': file_path
            }
        except ET.ParseError as e:
            return {
                'name': f"XML Syntax Check: {os.path.basename(file_path)}",
                'description': "Checks for XML syntax errors",
                'passed': False,
                'error': f"XML parse error: {str(e)}",
                'file_path': file_path
            }
        except Exception as e:
            return {
                'name': f"XML Syntax Check: {os.path.basename(file_path)}",
                'description': "Checks for XML syntax errors",
                'passed': False,
                'error': str(e),
                'file_path': file_path
            }
    
    def _check_js_syntax(self, file_path):
        """
        Check JavaScript syntax
        
        Args:
            file_path (str): Path to the JavaScript file
            
        Returns:
            dict: Test result
        """
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            
            # Check for common JavaScript issues
            issues = []
            
            # Check for missing semicolons
            if re.search(r'[^;{}\s]\s*\n', content):
                issues.append("Missing semicolons at the end of statements")
            
            # Check for console.log statements (which should be removed in production)
            if 'console.log' in content:
                issues.append("console.log statements should be removed in production code")
            
            if issues:
                return {
                    'name': f"JavaScript Check: {os.path.basename(file_path)}",
                    'description': "Checks for JavaScript issues",
                    'passed': False,
                    'error': "\n".join(issues),
                    'file_path': file_path
                }
            else:
                return {
                    'name': f"JavaScript Check: {os.path.basename(file_path)}",
                    'description': "Checks for JavaScript issues",
                    'passed': True,
                    'file_path': file_path
                }
        except Exception as e:
            return {
                'name': f"JavaScript Check: {os.path.basename(file_path)}",
                'description': "Checks for JavaScript issues",
                'passed': False,
                'error': str(e),
                'file_path': file_path
            }
    
    def _fix_errors(self, module_path, errors):
        """
        Fix errors in a generated module
        
        Args:
            module_path (str): Path to the module directory
            errors (list): List of errors
            
        Returns:
            list: Applied fixes
        """
        fixes = []
        
        for error in errors:
            fix = self._generate_fix(error)
            
            if fix and 'file_path' in error and 'fix_content' in fix:
                # Apply the fix
                self._apply_fix(error['file_path'], fix['fix_content'])
                
                # Add to the list of applied fixes
                fixes.append({
                    'error': error,
                    'fix': fix
                })
        
        return fixes
    
    def _generate_fix(self, error):
        """
        Generate a fix for an error
        
        Args:
            error (dict): Error information
            
        Returns:
            dict: Fix information
        """
        if 'file_path' not in error or not os.path.exists(error['file_path']):
            return None
        
        try:
            with open(error['file_path'], 'r') as f:
                file_content = f.read()
            
            # Prepare a prompt for the LLM to generate a fix
            prompt = f"""
            I need to fix an error in an Odoo module file. Here's the information:
            
            File: {os.path.basename(error['file_path'])}
            Error: {error['error']}
            
            Here's the current content of the file:
            
            ```
            {file_content}
            ```
            
            Please provide the corrected version of the file that fixes the error.
            Only provide the full corrected file content, nothing else.
            """
            
            # Call the LLM to generate a fix
            if self.llm_service.default_provider == 'openai':
                fix_content = self._generate_fix_with_openai(prompt)
            elif self.llm_service.default_provider == 'anthropic':
                fix_content = self._generate_fix_with_anthropic(prompt)
            else:
                return None
            
            # If the fix is the same as the original content, it didn't actually fix anything
            if fix_content.strip() == file_content.strip():
                return None
            
            return {
                'description': f"Fixed error in {os.path.basename(error['file_path'])}",
                'fix_content': fix_content
            }
            
        except Exception as e:
            print(f"Error generating fix: {str(e)}")
            return None
    
    def _generate_fix_with_openai(self, prompt):
        """
        Generate a fix using OpenAI
        
        Args:
            prompt (str): Prompt for the LLM
            
        Returns:
            str: Generated fix
        """
        import openai
        
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert Odoo developer. Your task is to fix errors in Odoo module files."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        return response.choices[0].message.content.strip()
    
    def _generate_fix_with_anthropic(self, prompt):
        """
        Generate a fix using Anthropic
        
        Args:
            prompt (str): Prompt for the LLM
            
        Returns:
            str: Generated fix
        """
        response = self.llm_service.anthropic_client.completions.create(
            model="claude-2",
            prompt=f"\n\nHuman: {prompt}\n\nAssistant:",
            max_tokens_to_sample=2000,
            temperature=0.3
        )
        
        return response.completion.strip()
    
    def _apply_fix(self, file_path, fix_content):
        """
        Apply a fix to a file
        
        Args:
            file_path (str): Path to the file
            fix_content (str): Fixed content
        """
        # Create a backup of the original file
        backup_path = f"{file_path}.bak"
        shutil.copy2(file_path, backup_path)
        
        # Write the fixed content to the file
        with open(file_path, 'w') as f:
            f.write(fix_content)
    
    def _find_files(self, directory, extension):
        """
        Find files with a specific extension in a directory
        
        Args:
            directory (str): Directory to search
            extension (str): File extension to find
            
        Returns:
            list: List of file paths
        """
        files = []
        
        for root, _, filenames in os.walk(directory):
            for filename in filenames:
                if filename.endswith(extension):
                    files.append(os.path.join(root, filename))
        
        return files
    
    def _save_test_results(self, generation_id):
        """
        Save test results to a file
        
        Args:
            generation_id (str): Generation ID
        """
        file_path = os.path.join(self.test_results_dir, f"{generation_id}.json")
        
        with open(file_path, 'w') as f:
            json.dump(self.test_results[generation_id], f, indent=2)
    
    def _load_test_results(self, generation_id):
        """
        Load test results from a file
        
        Args:
            generation_id (str): Generation ID
            
        Returns:
            bool: True if loaded successfully, False otherwise
        """
        file_path = os.path.join(self.test_results_dir, f"{generation_id}.json")
        
        if not os.path.exists(file_path):
            return False
        
        try:
            with open(file_path, 'r') as f:
                self.test_results[generation_id] = json.load(f)
            return True
        except Exception:
            return False
    
    def _save_fixes(self, generation_id):
        """
        Save fixes to a file
        
        Args:
            generation_id (str): Generation ID
        """
        file_path = os.path.join(self.fixes_dir, f"{generation_id}.json")
        
        with open(file_path, 'w') as f:
            json.dump(self.fixes[generation_id], f, indent=2)
    
    def _load_fixes(self, generation_id):
        """
        Load fixes from a file
        
        Args:
            generation_id (str): Generation ID
            
        Returns:
            bool: True if loaded successfully, False otherwise
        """
        file_path = os.path.join(self.fixes_dir, f"{generation_id}.json")
        
        if not os.path.exists(file_path):
            return False
        
        try:
            with open(file_path, 'r') as f:
                self.fixes[generation_id] = json.load(f)
            return True
        except Exception:
            return False