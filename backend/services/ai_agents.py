import os
import google.generativeai as genai
from typing import Dict, Any
import json
import zipfile
import io
from pathlib import Path

class SpecificationAgent:
    """AI agent for generating Odoo module specifications using Gemini"""
    
    def __init__(self):
        # Configure Gemini
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=api_key)
        # Use Gemini 2.5 Pro for better quality specifications
        self.model = genai.GenerativeModel('gemini-2.5-pro-preview-06-05')
        
        # Load specification template
        self.specification_template = self._load_specification_template()
    
    def _load_specification_template(self) -> str:
        """Load specification generation template from file"""
        try:
            template_path = Path(__file__).parent.parent / "core" / "prompts" / "specification_template.md"
            with open(template_path, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            print("Warning: Specification template file not found. Using basic template.")
            return """You are an expert Odoo developer and business analyst. Create a comprehensive technical specification for an Odoo module based on the user's requirements."""
    
    def generate_specification(self, project_name: str, odoo_version: int, 
                             requirements: str, description: str = None) -> str:
        """Generate a comprehensive Odoo module specification"""
        
        # Load the prompt template
        prompt = self._build_specification_prompt(
            project_name, odoo_version, requirements, description
        )
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            raise Exception(f"Failed to generate specification: {str(e)}")
    
    def _build_specification_prompt(self, project_name: str, odoo_version: int, 
                                  requirements: str, description: str = None) -> str:
        """Build the prompt for specification generation"""
        
        prompt = f"""{self.specification_template}

**Project Information:**
- Module Name: {project_name}
- Odoo Version: {odoo_version}
- Description: {description or "Not provided"}

**User Requirements:**
{requirements}

Generate the specification now following the template guidelines above:"""

        return prompt

class CodingAgent:
    """AI agent for generating Odoo module code from specifications"""
    
    def __init__(self):
        """Initialize the Coding Agent with Claude API"""
        try:
            import anthropic
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                raise ValueError("ANTHROPIC_API_KEY environment variable is required")
            
            # Validate API key format
            if not api_key.startswith(('sk-ant-', 'k-ant-')):
                print(f"Warning: API key format might be incorrect. Expected to start with 'sk-ant-' but got: {api_key[:10]}...")
                print("This might cause authentication errors. Please check your Anthropic API key.")
            
            self.client = anthropic.Anthropic(api_key=api_key)
            print("Anthropic client initialized successfully")
            
        except ImportError:
            raise ImportError("anthropic package is required. Install with: pip install anthropic")
        except Exception as e:
            raise Exception(f"Failed to initialize Anthropic client: {str(e)}")
        
        # Load Odoo guidelines
        self.odoo_guidelines = self._load_odoo_guidelines()
    
    def test_api_connection(self) -> bool:
        """Test the API connection with a simple request"""
        try:
            # Send a minimal test request with Claude Sonnet 4
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=50,
                messages=[
                    {"role": "user", "content": "Hello, respond with 'API test successful'"}
                ]
            )
            
            # Check if we got a response
            if hasattr(response, 'content') and response.content:
                if isinstance(response.content, list):
                    response_text = response.content[0].text
                else:
                    response_text = response.content
                
                print(f"API test response: {response_text}")
                return True
            
            return False
            
        except Exception as e:
            print(f"API connection test failed: {str(e)}")
            return False
        
    def _load_odoo_guidelines(self) -> str:
        """Load Odoo development guidelines from file"""
        try:
            guidelines_path = Path(__file__).parent.parent / "core" / "prompts" / "odoo_guidelines.md"
            with open(guidelines_path, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            print("Warning: Odoo guidelines file not found. Using basic guidelines.")
            return """
# Basic Odoo Development Guidelines
- Follow Odoo coding standards
- Use proper model structure
- Include security files
- Create proper views
- Follow naming conventions
"""
    
    def _generate_system_prompt(self) -> str:
        """Generate the system prompt for code generation"""
        return f"""You are an expert Odoo developer and architect. Your task is to generate complete, production-ready Odoo modules based on user specifications.

CRITICAL REQUIREMENTS:
1. Generate COMPLETE, WORKING Odoo modules
2. Follow ALL Odoo development guidelines provided
3. Return code as a single JSON object where keys are file paths and values are complete file contents
4. Include ALL necessary files: __manifest__.py, models, views, security, etc.
5. Use proper Odoo coding standards and best practices
6. Ensure the module is installable and functional

ODOO DEVELOPMENT GUIDELINES:
{self.odoo_guidelines}

OUTPUT FORMAT:
Return ONLY a valid JSON object in this exact format:
{{
    "__manifest__.py": "# Module manifest content...",
    "__init__.py": "# Module init content...",
    "models/__init__.py": "# Models init content...",
    "models/example_model.py": "# Model code...",
    "views/example_views.xml": "<!-- View XML content -->",
    "security/ir.model.access.csv": "# Security CSV content...",
    "static/description/icon.png": "BASE64_ENCODED_ICON_DATA"
}}

IMPORTANT: 
- Generate real, functional code - not placeholders or comments
- Include proper imports, field definitions, and business logic
- Follow the specification exactly
- Add proper error handling and validation
- Include appropriate comments for maintainability
"""
    
    def _generate_refinement_prompt(self, generated_code: str) -> str:
        """Generate the refinement prompt for code review and improvement"""
        return f"""You are a senior Odoo architect performing a code review. 

TASK: Review and refine the following Odoo module code to ensure it meets production standards.

REVIEW CRITERIA:
1. **Odoo Compliance**: Ensure full compliance with Odoo development guidelines
2. **Functionality**: Verify all features work as specified
3. **Security**: Check access rights and security rules
4. **Performance**: Optimize for performance and maintainability
5. **Code Quality**: Remove unnecessary code, improve structure
6. **Best Practices**: Follow Odoo ORM and API best practices

GENERATED CODE TO REVIEW:
{generated_code}

REFINEMENT INSTRUCTIONS:
- Fix any bugs or issues
- Optimize performance
- Improve code structure
- Add missing security rules
- Ensure proper error handling
- Validate all field definitions
- Check view structures
- Verify manifest dependencies

Return the refined code in the exact same JSON format, with all improvements applied.
"""
    
    async def generate_module_code(self, specification: str, project_info: dict) -> dict:
        """
        Generate Odoo module code from specification
        
        Args:
            specification: The approved module specification
            project_info: Project details including name, version, etc.
            
        Returns:
            dict: Generated module files as {file_path: content}
        """
        try:
            # Step 0: Test API connection first
            print("Step 0: Testing Anthropic API connection...")
            if not self.test_api_connection():
                raise Exception("Failed to connect to Anthropic API. Please check your API key.")
            print("✅ API connection test successful")
            
            # Step 1: Generate initial code draft
            print("Step 1: Generating initial code draft...")
            initial_prompt = self._create_generation_prompt(specification, project_info)
            
            initial_response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=8000,
                temperature=0.1,
                messages=[
                    {"role": "user", "content": initial_prompt}
                ]
            )
            
            # Extract JSON from response - handle different response formats
            if hasattr(initial_response, 'content') and initial_response.content:
                if isinstance(initial_response.content, list):
                    response_text = initial_response.content[0].text
                else:
                    response_text = initial_response.content
            else:
                response_text = str(initial_response)
            
            initial_code = self._extract_json_from_response(response_text)
            
            # Step 2: Refine and improve the code
            print("Step 2: Refining and improving code...")
            refinement_prompt = self._generate_refinement_prompt(str(initial_code))
            
            refinement_response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=8000,
                temperature=0.1,
                messages=[
                    {"role": "user", "content": refinement_prompt}
                ]
            )
            
            # Extract refined JSON - handle different response formats
            if hasattr(refinement_response, 'content') and refinement_response.content:
                if isinstance(refinement_response.content, list):
                    refined_text = refinement_response.content[0].text
                else:
                    refined_text = refinement_response.content
            else:
                refined_text = str(refinement_response)
            
            refined_code = self._extract_json_from_response(refined_text)
            
            print("Code generation completed successfully!")
            return refined_code
            
        except Exception as e:
            print(f"Error generating module code: {str(e)}")
            # Log the full error for debugging
            import traceback
            print(f"Full traceback: {traceback.format_exc()}")
            
            # Provide helpful error messages based on error type
            if "authentication_error" in str(e).lower():
                raise Exception(f"Authentication failed. Please check your ANTHROPIC_API_KEY. The key should start with 'sk-ant-'. Current error: {str(e)}")
            elif "rate_limit" in str(e).lower():
                raise Exception(f"Rate limit exceeded. Please wait and try again. Error: {str(e)}")
            else:
                raise Exception(f"Code generation failed: {str(e)}")
    
    def _create_generation_prompt(self, specification: str, project_info: dict) -> str:
        """Create the initial code generation prompt"""
        return f"""{self._generate_system_prompt()}

PROJECT INFORMATION:
- Module Name: {project_info.get('name', 'Unknown')}
- Odoo Version: {project_info.get('odoo_version', 17)}
- Description: {project_info.get('description', '')}

MODULE SPECIFICATION:
{specification}

Generate a complete, functional Odoo module based on this specification. Return only the JSON object with all necessary files.
"""
    
    def _extract_json_from_response(self, response_text: str) -> dict:
        """Extract and parse JSON from Claude's response"""
        import json
        import re
        
        try:
            # Clean the response text
            response_text = response_text.strip()
            
            # Try to find JSON in the response using various patterns
            patterns = [
                r'\{.*\}',  # Basic JSON pattern
                r'```json\s*(\{.*?\})\s*```',  # JSON in code blocks
                r'```\s*(\{.*?\})\s*```',  # JSON in generic code blocks
            ]
            
            for pattern in patterns:
                json_match = re.search(pattern, response_text, re.DOTALL)
                if json_match:
                    if len(json_match.groups()) > 0:
                        json_str = json_match.group(1)
                    else:
                        json_str = json_match.group(0)
                    
                    try:
                        return json.loads(json_str)
                    except json.JSONDecodeError:
                        continue
            
            # If no JSON pattern found, try to parse the entire response
            return json.loads(response_text)
            
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON from response: {e}")
            print(f"Response text (first 500 chars): {response_text[:500]}...")
            
            # Fallback: return a basic module structure
            return {
                "__manifest__.py": f"""{{
    'name': 'Generated Module',
    'version': '1.0.0',
    'category': 'Custom',
    'summary': 'Auto-generated Odoo module',
    'description': 'This module was generated automatically.',
    'author': 'OMB v3',
    'depends': ['base'],
    'data': [],
    'installable': True,
    'auto_install': False,
}}""",
                "__init__.py": "# Module initialization",
                "models/__init__.py": "# Models package",
            }
    
    def create_module_zip(self, module_files: dict, module_name: str) -> bytes:
        """
        Create a ZIP file from module files
        
        Args:
            module_files: Dictionary of {file_path: content}
            module_name: Name of the module for the root directory
            
        Returns:
            bytes: ZIP file content
        """
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_path, content in module_files.items():
                # Create full path with module name as root
                full_path = f"{module_name}/{file_path}"
                
                # Handle different content types
                if isinstance(content, str):
                    # Handle base64 encoded files (like images)
                    if file_path.endswith(('.png', '.jpg', '.jpeg', '.gif', '.ico')):
                        try:
                            import base64
                            # If content looks like base64, decode it
                            if content.startswith('data:') or len(content) > 100:
                                # Extract base64 part if it's a data URL
                                if content.startswith('data:'):
                                    content = content.split(',')[1]
                                binary_content = base64.b64decode(content)
                                zip_file.writestr(full_path, binary_content)
                            else:
                                # Fallback: treat as text
                                zip_file.writestr(full_path, content.encode('utf-8'))
                        except Exception:
                            # If base64 decode fails, treat as text
                            zip_file.writestr(full_path, content.encode('utf-8'))
                    else:
                        # Regular text file
                        zip_file.writestr(full_path, content.encode('utf-8'))
                elif isinstance(content, bytes):
                    zip_file.writestr(full_path, content)
                else:
                    # Convert to string and encode
                    zip_file.writestr(full_path, str(content).encode('utf-8'))
        
        zip_buffer.seek(0)
        return zip_buffer.read()
    
    def analyze_module_complexity(self, module_files: dict) -> dict:
        """
        Analyze module complexity for pricing
        
        Args:
            module_files: Dictionary of module files
            
        Returns:
            dict: Complexity analysis
        """
        analysis = {
            'total_files': len(module_files),
            'python_files': 0,
            'xml_files': 0,
            'csv_files': 0,
            'total_lines': 0,
            'models_count': 0,
            'views_count': 0,
            'complexity_score': 0
        }
        
        for file_path, content in module_files.items():
            if not isinstance(content, str):
                continue
                
            lines = content.count('\n') + 1
            analysis['total_lines'] += lines
            
            if file_path.endswith('.py'):
                analysis['python_files'] += 1
                # Count model definitions
                analysis['models_count'] += content.count('class ') * content.count('models.Model')
            elif file_path.endswith('.xml'):
                analysis['xml_files'] += 1
                # Count view definitions
                analysis['views_count'] += content.count('<record') * content.count('ir.ui.view')
            elif file_path.endswith('.csv'):
                analysis['csv_files'] += 1
        
        # Calculate complexity score (0-100)
        base_score = min(analysis['total_files'] * 5, 30)
        code_score = min(analysis['total_lines'] // 50, 40)
        feature_score = min((analysis['models_count'] + analysis['views_count']) * 5, 30)
        
        analysis['complexity_score'] = base_score + code_score + feature_score
        
        return analysis

class TestingAgent:
    """AI agent for generating test cases (for future sprints)"""
    
    def __init__(self):
        # Will be implemented in Sprint 4
        pass
    
    def generate_test_cases(self, module_code: Dict[str, str]) -> str:
        """Generate test cases for the module"""
        # Placeholder for Sprint 4
        return "Test generation will be implemented in Sprint 4" 