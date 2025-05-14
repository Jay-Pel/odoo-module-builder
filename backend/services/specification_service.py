import os
import json
import uuid
import logging
from datetime import datetime
from services.llm_service import LLMService
from services.n8n_service import N8nService

# Set up module-specific logger
logger = logging.getLogger('odoo_module_builder.specification_service')
logger.setLevel(logging.INFO)

class SpecificationService:
    """
    Service for generating and managing module specifications
    """
    
    def __init__(self):
        """
        Initialize the specification service
        """
        self.llm_service = LLMService()
        self.n8n_service = N8nService()
        
        # In-memory storage for specifications (in a real implementation, this would be a database)
        self.specifications = {}
        
        # Create data directory if it doesn't exist
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'specifications')
        os.makedirs(self.data_dir, exist_ok=True)
    
    def generate_specification(self, context):
        """
        Generate a module specification based on the provided context using Claude 3.7
        
        Args:
            context (dict): Context information from the chat
            
        Returns:
            tuple: (specification_id, specification in HTML format)
        """
        try:
            # Generate a unique specification ID
            specification_id = str(uuid.uuid4())
            
            logger.info(f"[SpecService] Generating specification with Claude 3.7. Initial context: {context}")

            # Ensure context includes Odoo version information
            if 'odooVersion' not in context:
                context['odooVersion'] = '16.0'  # Default to Odoo 16.0
            if 'odooEdition' not in context:
                context['odooEdition'] = 'community'  # Default to Community Edition
            
            # First check if the Anthropic API key is valid
            if not self.llm_service.anthropic_api_key:
                logger.error("[SpecService] No Anthropic API key found. Cannot generate specification with Claude.")
                raise ValueError("No valid Anthropic API key found. Please set ANTHROPIC_API_KEY in your .env file.")
            
            # First, prepare the prompt
            prompt = self._prepare_specification_prompt(context, html_output=True)
            logger.info(f"[SpecService] Prepared prompt for Claude 3.7 (first 200 chars): {prompt[:200]}")
            
            # Call Claude directly with the prepared prompt
            # Use the sonnet model for better results (more economical than haiku but still powerful)
            specification = self.llm_service.generate_text(
                prompt, 
                model="claude-3-7-sonnet-20250219"
            )
            
            logger.info(f"[SpecService] Specification from Claude 3.7 (first 200 chars): {str(specification)[:200]}")
            
            # Store the specification
            self.specifications[specification_id] = {
                'specification': specification,
                'context': context,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat(),
                'status': 'draft',
                'format': 'html',
                'model': 'claude-3-7-sonnet-20250219'
            }
            
            # Save the specification to a file
            self._save_specification(specification_id)
            
            logger.info(f"[SpecService] Final specification_id: {specification_id} generated with Claude 3.7")
            return specification_id, specification
        except Exception as e:
            # Log any errors during specification generation
            logger.error(f"[SpecService] Critical error in generate_specification: {str(e)}")
            raise
    
    def generate_specification_fallback(self, context):
        """
        Fallback mechanism to generate a module specification when Claude 3.7 is unavailable
        This uses an older model or n8n workflow as an alternative
        
        Args:
            context (dict): Context information from the chat
            
        Returns:
            tuple: (specification_id, specification in HTML format)
        """
        try:
            # Generate a unique specification ID
            specification_id = str(uuid.uuid4())
            
            logger.info(f"[SpecService] Using fallback mechanism to generate specification. Context: {context}")

            # Ensure context includes Odoo version information
            if 'odooVersion' not in context:
                context['odooVersion'] = '16.0'
            if 'odooEdition' not in context:
                context['odooEdition'] = 'community'
            
            # Try different approaches for fallback
            specification = None
            model_used = "fallback"
            
            # First try n8n workflow with alternative model
            try:
                logger.info("[SpecService] Attempting to use n8n workflow for fallback generation")
                result = self.n8n_service.generate_specification(context)
                
                if result and result.get('status') == 'success':
                    if 'specificationId' in result:
                        specification_id = result['specificationId']
                    
                    specification = result['specification']
                    model_used = "n8n_workflow"
                    logger.info(f"[SpecService] Specification generated using n8n workflow (first 200 chars): {str(specification)[:200]}")
            except Exception as n8n_error:
                logger.warning(f"[SpecService] n8n workflow failed: {str(n8n_error)}")
                # Continue to next fallback method
            
            # If n8n failed, try with an older Claude model directly
            if not specification:
                try:
                    logger.info("[SpecService] Attempting fallback with Claude 3 Haiku model")
                    prompt = self._prepare_specification_prompt(context, html_output=True)
                    specification = self.llm_service.generate_text(
                        prompt, 
                        model="claude-3-haiku-20240307",  # Older, more reliable model
                        max_retries=2                   # Fewer retries for fallback
                    )
                    model_used = "claude-3-haiku-20240307"
                    logger.info(f"[SpecService] Specification generated with Claude Haiku (first 200 chars): {str(specification)[:200]}")
                except Exception as claude_error:
                    logger.warning(f"[SpecService] Claude Haiku fallback failed: {str(claude_error)}")
                    # Continue to next fallback method
            
            # Last resort: try with a template-based approach if all else fails
            if not specification:
                logger.warning("[SpecService] All LLM-based fallbacks failed, using template-based generation")
                specification = self._generate_template_based_specification(context)
                model_used = "template"
            
            # Store the specification with fallback information
            self.specifications[specification_id] = {
                'specification': specification,
                'context': context,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat(),
                'status': 'draft',
                'format': 'html',
                'model': model_used,
                'is_fallback': True
            }
            
            # Save the specification to a file
            self._save_specification(specification_id)
            
            logger.info(f"[SpecService] Fallback specification generated with ID: {specification_id} using: {model_used}")
            return specification_id, specification
        except Exception as e:
            logger.error(f"[SpecService] Critical error in fallback specification generation: {str(e)}")
            raise
    
    def _generate_template_based_specification(self, context):
        """
        Generate a basic specification using templates when all LLM options fail
        
        Args:
            context (dict): Context information
            
        Returns:
            str: HTML formatted specification based on templates
        """
        module_name = context.get('module_name', 'New Module')
        requirements = context.get('requirements', 'No requirements provided')
        odoo_version = context.get('odooVersion', '16.0')
        
        # Create a simple HTML template
        specification = f"""
        <div class="module-specification">
            <h1>{module_name} - Module Specification</h1>
            
            <div class="module-info">
                <h2>Module Information</h2>
                <p><strong>Name:</strong> {module_name}</p>
                <p><strong>Version:</strong> {context.get('module_version', '1.0.0')}</p>
                <p><strong>Category:</strong> {context.get('category', 'Uncategorized')}</p>
                <p><strong>Author:</strong> {context.get('author', 'Anonymous')}</p>
                <p><strong>Odoo Version:</strong> {odoo_version}</p>
                <p><strong>Edition:</strong> {context.get('odooEdition', 'Community')}</p>
                <p><strong>License:</strong> {context.get('license', 'LGPL-3')}</p>
            </div>
            
            <div class="module-description">
                <h2>Module Description</h2>
                <p>{requirements}</p>
            </div>
            
            <div class="functional-requirements">
                <h2>Functional Requirements</h2>
                <p>This is a template-based specification generated as a fallback when LLM-based generation is unavailable.</p>
                <p>Please edit this specification to add detailed functional requirements based on your needs.</p>
            </div>
            
            <div class="technical-requirements">
                <h2>Technical Requirements</h2>
                <p>Based on the requirements, the module will need to be built using Odoo {odoo_version}.</p>
                <p>Consider the following technical aspects:</p>
                <ul>
                    <li>Database models to store the required data</li>
                    <li>Views to display and interact with the data</li>
                    <li>Business logic in Python</li>
                    <li>Integration with other Odoo modules if needed</li>
                </ul>
            </div>
            
            <div class="dependencies">
                <h2>Dependencies</h2>
                <p><strong>Base Dependencies:</strong> {context.get('dependencies', 'base')}</p>
            </div>
            
            <div class="note">
                <h2>Note</h2>
                <p>This specification was generated using a template-based fallback system since the AI-powered generation was unavailable.</p>
                <p>You may want to enhance this specification with more details before proceeding to development.</p>
            </div>
        </div>
        """
        
        return specification
    
    def get_specification(self, specification_id):
        """
        Get a specification by ID
        
        Args:
            specification_id (str): Specification ID
            
        Returns:
            dict: Specification
        """
        if specification_id not in self.specifications:
            # Try to load from file
            if not self._load_specification(specification_id):
                return None
        
        return self.specifications[specification_id]['specification']
    
    def update_specification(self, specification_id, feedback, sections=None, approved=False):
        """
        Update a specification based on user feedback using Gemini 2.5
        
        Args:
            specification_id (str): Specification ID
            feedback (str): User feedback
            sections (list, optional): Sections to update
            approved (bool): Whether the specification is approved for next step
            
        Returns:
            dict: Updated specification in HTML format
        """
        if specification_id not in self.specifications:
            # Try to load from file
            if not self._load_specification(specification_id):
                raise ValueError(f"Specification not found: {specification_id}")
        
        # Get the current specification
        spec_data = self.specifications[specification_id]
        current_spec = spec_data['specification']
        context = spec_data['context']
        format_type = spec_data.get('format', 'markdown')
        
        try:
            # Try to update specification using n8n workflow with Gemini 2.5
            try:
                # Submit the feedback to the n8n workflow directly
                result = self.n8n_service.submit_specification_feedback(
                    specification_id, 
                    feedback,
                    current_spec,
                    approved
                )
                
                if result and result.get('status') in ['approved', 'updated']:
                    # Update with the processed specification from the workflow
                    if 'specification' in result:
                        updated_spec = result['specification']
                    else:
                        # If no specification is returned but status is success, use current spec
                        updated_spec = current_spec
                else:
                    # Fallback to direct LLM update if workflow failed
                    is_html = (format_type == 'html')
                    prompt = self._prepare_update_prompt(current_spec, feedback, sections, html_output=is_html)
                    updated_spec = self._update_specification_with_llm(prompt, current_spec)
            except Exception as e:
                # Log the error and fallback to direct LLM update
                print(f"Error calling n8n workflow for specification feedback: {str(e)}")
                is_html = (format_type == 'html')
                prompt = self._prepare_update_prompt(current_spec, feedback, sections, html_output=is_html)
                updated_spec = self._update_specification_with_llm(prompt, current_spec)
        except Exception as e:
            # Log the error but continue with the original update process
            print(f"Error in specification update process: {str(e)}")
            # Fallback to direct LLM update
            is_html = (format_type == 'html')
            prompt = self._prepare_update_prompt(current_spec, feedback, sections, html_output=is_html)
            updated_spec = self._update_specification_with_llm(prompt, current_spec)
        
        # Update the specification
        self.specifications[specification_id]['specification'] = updated_spec
        self.specifications[specification_id]['updated_at'] = datetime.now().isoformat()
        
        # Save the updated specification to a file
        self._save_specification(specification_id)
        
        return updated_spec
    
    def approve_specification(self, specification_id):
        """
        Mark a specification as approved
        
        Args:
            specification_id (str): Specification ID
        """
        if specification_id not in self.specifications:
            # Try to load from file
            if not self._load_specification(specification_id):
                raise ValueError(f"Specification not found: {specification_id}")
        
        # Update the status
        self.specifications[specification_id]['status'] = 'approved'
        self.specifications[specification_id]['approved_at'] = datetime.now().isoformat()
        
        # Save the updated specification to a file
        self._save_specification(specification_id)
    
    def _prepare_specification_prompt(self, context, html_output=True):
        """
        Prepare the prompt for Gemini 2.5 to generate a specification
        
        Args:
            context (dict): Context information
            html_output (bool): Whether to request HTML output format
            
        Returns:
            str: Prompt for the LLM
        """
        requirements = context.get('requirements', 'Build a custom Odoo module')
        module_name = context.get('module_name', 'Custom Module')
        module_version = context.get('module_version', '1.0')
        odoo_version = context.get('odooVersion', '16.0')
        odoo_edition = context.get('odooEdition', 'community')
        
        # Prepare system prompt for Gemini 2.5
        system_prompt = (
            "You are an expert Odoo module developer and senior business analyst with over 10 years of experience. "  
            "Your task is to create a detailed specification document for an Odoo ERP module based on the user's requirements. "
            "The specification should be comprehensive and cover all aspects of the module's functionality as a professional business analyst would write it."
        )
        
        # Prepare user prompt
        user_prompt = (
            f"Please create a detailed specification for an Odoo module with the following details:\n\n"
            f"Module Name: {module_name}\n"
            f"Module Version: {module_version}\n"
            f"Odoo Version: {odoo_version}\n"
            f"Odoo Edition: {odoo_edition}\n\n"
            f"User Requirements:\n{requirements}\n\n"
            f"Please include the following sections in your specification:\n"
            f"1. Module Overview - A high-level description of the module\n"
            f"2. Functional Requirements - Detailed list of features and functionality\n"
            f"3. Data Model - Database models, fields, relations, and constraints\n"
            f"4. User Interface - Views, menus, actions, and UI components\n"
            f"5. Business Logic - Rules, workflows, and processes\n"
            f"6. Security - Access rights and permission levels\n"
            f"7. Technical Notes - Implementation details and dependencies\n"
            f"8. User Stories - Examples of how users will interact with this module\n\n"
        )
        
        if html_output:
            user_prompt += (
                f"Format your response as clean, well-structured HTML that can be directly displayed in a web application. "
                f"Use appropriate HTML tags for headings, paragraphs, lists, tables, etc. Add CSS classes that would work well "
                f"with Bootstrap 5. Make the document visually appealing and professional."
            )
        else:
            user_prompt += "Format your response as a Markdown document."
        
        return f"{system_prompt}\n\n{user_prompt}"
    
    def _prepare_update_prompt(self, current_spec, feedback, sections=None, html_output=True):
        """
        Prepare the prompt for updating a specification
        
        Args:
            current_spec (dict): Current specification
            feedback (str): User feedback
            sections (list, optional): Sections to update
            html_output (bool): Whether to request HTML output format
            
        Returns:
            str: Formatted prompt
        """
        prompt = """
        Update the following Odoo module specification based on the user feedback.
        
        Current Specification:
        """
        
        # Add current specification to the prompt
        prompt += json.dumps(current_spec, indent=2)
        
        prompt += "\n\nUser Feedback:\n" + feedback
        
        if sections:
            prompt += "\n\nFocus on updating these sections:\n"
            prompt += ", ".join(sections)
        
        prompt += """
        
        Provide the complete updated specification in the same format as the current specification.
        """
        
        if html_output:
            prompt += (
                f"Format your response as clean, well-structured HTML that can be directly displayed in a web application. "
                f"Use appropriate HTML tags for headings, paragraphs, lists, tables, etc. Add CSS classes that would work well "
                f"with Bootstrap 5. Make the document visually appealing and professional."
            )
        else:
            prompt += "Format your response as a Markdown document."
        
        return prompt
    
    def _generate_specification_with_llm(self, prompt, context, model=None):
        """
        Generate a specification using Claude with a prepared prompt
        
        Args:
            prompt (str): Prepared prompt for the LLM
            context (dict): Context information
            model (str, optional): Model name to use, defaults to claude-3-7-sonnet
            
        Returns:
            str: Specification in text format
        """
        try:
            # Use specified model or default to sonnet for balance of quality and cost
            model_name = model or "claude-3-7-sonnet-20250219"
            logger.info(f"[SpecService] Generating specification with model: {model_name}")
            
            # Claude response with maximum relevance and accuracy
            result = self.llm_service.generate_text(prompt, model=model_name)
            return result
        except Exception as e:
            logger.error(f"[SpecService] Error in _generate_specification_with_llm using {model}: {str(e)}")
            # Re-raise the exception to be handled by the caller
            raise
    
    def _generate_with_openai(self, prompt, context):
        """
        Generate a specification using OpenAI
        
        Args:
            prompt (str): Formatted prompt
            context (dict): Context information
            
        Returns:
            str: Generated response
        """
        import openai
        
        try:
            # Call the OpenAI API using the legacy format (v0.28.0)
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert Odoo module developer. Your task is to create a detailed specification for an Odoo module based on the user's requirements."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error calling OpenAI API: {str(e)}")
            raise
    
    def _generate_with_anthropic(self, prompt, context):
        """
        Generate a specification using Anthropic
        
        Args:
            prompt (str): Formatted prompt
            context (dict): Context information
            
        Returns:
            str: Generated response
        """
        response = self.llm_service.anthropic_client.completions.create(
            model="claude-2",
            prompt=f"\n\nHuman: {prompt}\n\nAssistant:",
            max_tokens_to_sample=2000,
            temperature=0.7
        )
        
        return response.completion.strip()
    
    def _parse_specification_response(self, response, context):
        """
        Parse the LLM response into a structured specification
        
        Args:
            response (str): LLM response
            context (dict): Context information
            
        Returns:
            dict: Structured specification
        """
        # Initialize the specification with context information
        specification = {
            'module_name': context.get('module_name', 'Untitled Module'),
            'module_description': '',
            'functional_requirements': [],
            'technical_requirements': [],
            'user_interface': [],
            'dependencies': []
        }
        
        # Try to extract structured information from the response
        try:
            # Split the response into sections
            sections = response.split('\n\n')
            
            current_section = None
            
            for section in sections:
                section = section.strip()
                
                if not section:
                    continue
                
                # Check for section headers
                if "Module Description" in section or "Description" in section:
                    current_section = "module_description"
                    # Extract the description (remove the header)
                    description = section.split(':', 1)[-1].strip()
                    if description:
                        specification['module_description'] = description
                
                elif "Functional Requirements" in section or "Features" in section:
                    current_section = "functional_requirements"
                    # Extract requirements as list items
                    items = self._extract_list_items(section)
                    if items:
                        specification['functional_requirements'] = items
                
                elif "Technical Requirements" in section or "Technical Specifications" in section:
                    current_section = "technical_requirements"
                    # Extract requirements as list items
                    items = self._extract_list_items(section)
                    if items:
                        specification['technical_requirements'] = items
                
                elif "User Interface" in section or "UI Components" in section:
                    current_section = "user_interface"
                    # Extract UI components as list items
                    items = self._extract_list_items(section)
                    if items:
                        specification['user_interface'] = items
                
                elif "Dependencies" in section or "Required Modules" in section:
                    current_section = "dependencies"
                    # Extract dependencies as list items
                    items = self._extract_list_items(section)
                    if items:
                        specification['dependencies'] = items
                
                # If we're in a section but didn't find a new section header,
                # append the content to the current section
                elif current_section and current_section == "module_description":
                    specification['module_description'] += "\n" + section
                elif current_section and "-" in section:
                    # This might be a list item for the current section
                    items = self._extract_list_items(section)
                    if items and current_section in specification:
                        specification[current_section].extend(items)
        
        except Exception as e:
            print(f"Error parsing specification response: {str(e)}")
            # If parsing fails, we'll return the specification with the defaults
            # and whatever we managed to extract
        
        # Ensure we have at least some content in each section
        if not specification['module_description']:
            specification['module_description'] = f"A module for {context.get('module_purpose', 'custom business needs')}"
        
        if not specification['functional_requirements']:
            specification['functional_requirements'] = [
                f"Implement core functionality for {context.get('module_purpose', 'the business need')}",
                "Provide user-friendly interface",
                "Ensure data integrity and validation"
            ]
        
        if not specification['technical_requirements']:
            specification['technical_requirements'] = [
                "Integration with Odoo core modules",
                "Database structure optimization",
                "API endpoints for external access"
            ]
        
        if not specification['user_interface']:
            specification['user_interface'] = [
                "Main dashboard view",
                "List and form views for records",
                "Reporting interface"
            ]
        
        if not specification['dependencies']:
            specification['dependencies'] = [
                "Odoo Base (base)",
                "Odoo Web (web)",
                "Odoo Mail (mail)"
            ]
        
        return specification
    
    def _extract_list_items(self, text):
        """
        Extract list items from a text block
        
        Args:
            text (str): Text block that may contain list items
            
        Returns:
            list: Extracted list items
        """
        items = []
        
        # Remove the section header if present
        if ":" in text:
            text = text.split(":", 1)[1].strip()
        
        # Split by newlines and process each line
        lines = text.split("\n")
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines
            if not line:
                continue
            
            # Check for list markers (-, *, 1., etc.)
            if line.startswith("-") or line.startswith("*") or (line[0].isdigit() and line[1:3] in ['. ', ') ']):
                # Remove the list marker
                item = line[1:].strip() if line.startswith("-") or line.startswith("*") else line[line.find(' ')+1:].strip()
                
                if item:
                    items.append(item)
            else:
                # If it's not a list item but we're in a list section,
                # it might be a continuation of the previous item or a non-formatted list
                items.append(line)
        
        return items
    
    def _update_specification_with_llm(self, prompt, current_spec):
        """
        Update a specification using the LLM
        
        Args:
            prompt (str): Formatted prompt
            current_spec (dict): Current specification
            
        Returns:
            dict: Updated specification
        """
        try:
            # Call the LLM to generate an updated specification based on feedback
            provider = self.llm_service.default_provider
            
            if provider == 'openai':
                response = self._generate_with_openai(prompt, {"current_spec": current_spec})
            elif provider == 'anthropic':
                response = self._generate_with_anthropic(prompt, {"current_spec": current_spec})
            else:
                print(f"Warning: Unsupported LLM provider '{provider}', falling back to OpenAI")
                response = self._generate_with_openai(prompt, {"current_spec": current_spec})
                
            # Parse the response into a structured specification
            updated_spec = self._parse_specification_response(response, {"current_spec": current_spec})
            
            return updated_spec
            
        except Exception as e:
            print(f"Error updating specification: {str(e)}")
            
            # Create a deep copy of the current specification as fallback
            updated_spec = json.loads(json.dumps(current_spec))
            
            # Add a note about the update
            for key in updated_spec:
                if isinstance(updated_spec[key], list) and updated_spec[key]:
                    updated_spec[key].append(f"Updated based on user feedback")
            
            return updated_spec
    
    def _save_specification(self, specification_id):
        """
        Save a specification to a file
        
        Args:
            specification_id (str): Specification ID
        """
        file_path = os.path.join(self.data_dir, f"{specification_id}.json")
        
        with open(file_path, 'w') as f:
            json.dump(self.specifications[specification_id], f, indent=2)
    
    def _load_specification(self, specification_id):
        """
        Load a specification from a file
        
        Args:
            specification_id (str): Specification ID
            
        Returns:
            bool: True if loaded successfully, False otherwise
        """
        file_path = os.path.join(self.data_dir, f"{specification_id}.json")
        
        if not os.path.exists(file_path):
            return False
        
        try:
            with open(file_path, 'r') as f:
                self.specifications[specification_id] = json.load(f)
            return True
        except Exception:
            return False