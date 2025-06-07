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
        self.model = genai.GenerativeModel('gemini-1.5-flash')
    
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
        
        prompt = f"""You are an expert Odoo developer and business analyst. Your task is to create a comprehensive technical specification for an Odoo module based on the user's requirements.

**Project Information:**
- Module Name: {project_name}
- Odoo Version: {odoo_version}
- Description: {description or "Not provided"}

**User Requirements:**
{requirements}

**Instructions:**
Create a detailed, professional specification document in Markdown format that includes:

1. **Executive Summary** - Brief overview of the module's purpose
2. **Functional Requirements** - What the module should do
3. **Technical Requirements** - How it should be implemented
4. **Data Models** - Required models and fields
5. **User Interface** - Views, menus, and user interactions
6. **Security & Permissions** - Access rights and security rules
7. **Workflow & Business Logic** - Process flows and automation
8. **Integration Points** - How it connects with existing Odoo modules
9. **Testing Scenarios** - Key test cases to validate functionality
10. **Implementation Notes** - Technical considerations and best practices

**Requirements for the specification:**
- Be specific and actionable
- Follow Odoo development best practices
- Include proper field types, model relationships, and view structures
- Consider user experience and business workflows
- Ensure compatibility with Odoo version {odoo_version}
- Include security considerations
- Be ready for direct implementation by a developer

**Output Format:**
Provide the specification as a well-structured Markdown document with clear headings, bullet points, and code examples where appropriate.

Generate the specification now:"""

        return prompt

class CodingAgent:
    """AI agent for generating Odoo module code from specifications"""
    
    def __init__(self):
        """Initialize the Coding Agent with Claude API"""
        try:
            import anthropic
            self.client = anthropic.Anthropic(
                api_key=os.getenv("ANTHROPIC_API_KEY")
            )
        except ImportError:
            raise ImportError("anthropic package is required. Install with: pip install anthropic")
        
        # Load Odoo guidelines
        self.odoo_guidelines = self._load_odoo_guidelines()
        
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
            # Step 1: Generate initial code draft
            print("Step 1: Generating initial code draft...")
            initial_prompt = self._create_generation_prompt(specification, project_info)
            
            initial_response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=8000,
                temperature=0.1,
                messages=[
                    {"role": "user", "content": initial_prompt}
                ]
            )
            
            # Extract JSON from response
            initial_code = self._extract_json_from_response(initial_response.content[0].text)
            
            # Step 2: Refine and improve the code
            print("Step 2: Refining and improving code...")
            refinement_prompt = self._generate_refinement_prompt(str(initial_code))
            
            refinement_response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=8000,
                temperature=0.1,
                messages=[
                    {"role": "user", "content": refinement_prompt}
                ]
            )
            
            # Extract refined JSON
            refined_code = self._extract_json_from_response(refinement_response.content[0].text)
            
            print("Code generation completed successfully!")
            return refined_code
            
        except Exception as e:
            print(f"Error generating module code: {str(e)}")
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
            # Try to find JSON in the response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                return json.loads(json_str)
            else:
                # If no JSON found, try to parse the entire response
                return json.loads(response_text)
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON from response: {e}")
            print(f"Response text: {response_text[:500]}...")
            raise Exception("Failed to parse generated code JSON")
    
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