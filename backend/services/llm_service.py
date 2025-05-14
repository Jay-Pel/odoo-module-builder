import os
import json
import uuid
import base64
import time
import logging
from datetime import datetime
import requests
from anthropic import Anthropic, APITimeoutError, APIError, APIConnectionError, RateLimitError, APIStatusError

class LLMService:
    """
    Service for interacting with Anthropic Claude 3, a state-of-the-art multimodal LLM
    """
    
    def __init__(self):
        """
        Initialize the LLM service with Anthropic API
        """
        # Load API key from environment variable
        self.anthropic_api_key = os.environ.get('ANTHROPIC_API_KEY')
        self.api_key_warning_shown = False
        
        if not self.anthropic_api_key:
            print("\n⚠️ WARNING: NO VALID ANTHROPIC API KEY FOUND! ⚠️")
            print("The application will start, but specification generation will fail.")
            print("Please set a valid ANTHROPIC_API_KEY in your backend/.env file.")
            print("The existing API key in the template may have expired or is invalid.")
            print("You can get a valid API key from https://console.anthropic.com/ \n")
            self.client = None
            self.api_key_warning_shown = True
            return
            
        print("Anthropic API key loaded. Attempting to initialize client...")
        
        # Initialize Anthropic client with the new version's initialization pattern
        try:
            # Create client with only the required API key parameter
            # Based on the latest Anthropic SDK documentation
            self.client = Anthropic(api_key=self.anthropic_api_key)
            
            # Test the client with a simple request to verify it works
            try:
                self.client.messages.create(
                    model="claude-3-7-sonnet-20250219",
                    max_tokens=10,
                    messages=[{"role": "user", "content": "Hello"}]
                )
                print("✅ Successfully initialized and tested Anthropic client!")
            except Exception as client_test_error:
                print(f"⚠️ Anthropic client initialized but test request failed: {str(client_test_error)}")
                # Continue with the initialized client
                
        except Exception as e:
            # Log the detailed error but don't fall back to mock mode
            print(f"❌ ERROR initializing Anthropic client: {str(e)}")
            print(f"API Details: Using Anthropic version {getattr(Anthropic, '__version__', 'unknown')}")
            print("The application will start, but specification generation will not work properly.")
            print("Please ensure your Anthropic API key is valid and try again.")
            self.client = None
        
        # In-memory storage for conversations (in a real implementation, this would be a database)
        self.conversations = {}
    
    def _generate_mock_response(self):
        """
        This method should never be called as we require real LLM responses
        
        Returns:
            Never returns, always raises an exception
        """
        raise Exception("Mock responses are not allowed. Real LLM responses are required for this application.")
    
    def generate_text(self, prompt, model=None, max_retries=3, initial_backoff=2):
        """
        Generate text using the Anthropic Claude API with retry logic and enhanced error handling
        
        Args:
            prompt (str): Prompt for the LLM
            model (str, optional): Model to use (claude-3-7-sonnet, etc.)
            max_retries (int): Maximum number of retry attempts
            initial_backoff (int): Initial backoff time in seconds
            
        Returns:
            str: Generated text
            
        Raises:
            Exception: If the text generation fails after all retries
        """
        if not self.client:
            if self.api_key_warning_shown:
                error_message = (
                    "ERROR: Cannot generate specification - No valid Anthropic API key.\n" 
                    "You need a real API key to generate specifications.\n"
                    "Please update your backend/.env file with a valid ANTHROPIC_API_KEY"
                )
            else:
                error_message = "Anthropic client is not properly initialized. Real LLM responses are required."
            
            print(f"\n⚠️ {error_message}\n")
            raise Exception(error_message)
        
        # Use claude-3-7-sonnet for highest quality responses if not specified
        model_name = model or "claude-3-7-sonnet-20250219"
        print(f"[LLM Service] Generating text with model: {model_name}")
        print(f"[LLM Service] Prompt (first 100 chars): {prompt[:100]}...")
        
        # Implement retry with exponential backoff
        for attempt in range(max_retries):
            try:
                # Create the API request with increased timeout (5 minutes)
                response = self.client.messages.create(
                    model=model_name,
                    max_tokens=4000,
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    timeout=300  # 5 minutes timeout in seconds
                )
                
                generated_text = response.content[0].text
                print(f"[LLM Service] Generated response (first 100 chars): {generated_text[:100]}...")
                return generated_text
                
            except APITimeoutError as e:
                backoff = initial_backoff * (2 ** attempt)
                error_details = f"Timeout error: {str(e)}. Retrying in {backoff} seconds... (Attempt {attempt+1}/{max_retries})"
                print(f"\n⚠️ {error_details}\n")
                
                # If this is the last attempt, raise the exception
                if attempt == max_retries - 1:
                    raise Exception(f"API Timeout after {max_retries} attempts: {str(e)}. The Anthropic API is taking too long to respond.")
                time.sleep(backoff)
                
            except RateLimitError as e:
                backoff = initial_backoff * (2 ** attempt)
                error_details = f"Rate limit exceeded: {str(e)}. Retrying in {backoff} seconds... (Attempt {attempt+1}/{max_retries})"
                print(f"\n⚠️ {error_details}\n")
                
                # If this is the last attempt, raise the exception with detailed information
                if attempt == max_retries - 1:
                    raise Exception(f"Rate limit exceeded after {max_retries} attempts: {str(e)}. Please check your Anthropic API rate limits.")
                time.sleep(backoff)
                
            except APIConnectionError as e:
                backoff = initial_backoff * (2 ** attempt)
                error_details = f"Connection error: {str(e)}. Retrying in {backoff} seconds... (Attempt {attempt+1}/{max_retries})"
                print(f"\n⚠️ {error_details}\n")
                
                # If this is the last attempt, raise the exception
                if attempt == max_retries - 1:
                    raise Exception(f"API Connection error after {max_retries} attempts: {str(e)}. Please check your internet connection or if there are regional restrictions.")
                time.sleep(backoff)
                
            except APIStatusError as e:
                error_message = f"API Status Error: {str(e)}. Status code: {e.status_code}"
                print(f"\n❌ {error_message}\n")
                
                # For specific status codes, provide more detailed error messages
                if e.status_code == 401:
                    raise Exception("Authentication error: Your Anthropic API key is invalid. Please check your API key.")
                elif e.status_code == 403:
                    raise Exception("Authorization error: Your Anthropic API key does not have permission to use this model or feature.")
                elif e.status_code == 404:
                    raise Exception(f"The requested model '{model_name}' was not found. Please check if the model name is correct.")
                else:
                    raise Exception(f"API error with status code {e.status_code}: {str(e)}")
            
            except Exception as e:
                error_message = f"Failed to generate text with Anthropic: {str(e)}. Real LLM responses are required."
                print(f"\n❌ {error_message}\n")
                raise Exception(error_message)
    
    def generate_conversation_id(self):
        """
        Generate a unique conversation ID
        
        Returns:
            str: Unique conversation ID
        """
        return str(uuid.uuid4())
    
    def process_chat_message(self, message, conversation_id=None, context=None, files=None):
        """
        Process a user message and generate a response using the LLM
        
        Args:
            message (str): User message
            conversation_id (str, optional): Conversation ID
            context (dict, optional): Context information
            files (list, optional): List of file objects with their data
            
        Returns:
            tuple: (response, updated_context, next_step)
        """
        # Initialize context if not provided
        if context is None:
            context = {}
        
        # Get or create conversation history
        if conversation_id and conversation_id in self.conversations:
            history = self.conversations[conversation_id]['history']
            existing_context = self.conversations[conversation_id]['context']
            context = {**existing_context, **context}
        else:
            history = []
            conversation_id = self.generate_conversation_id()
            self.conversations[conversation_id] = {
                'history': history,
                'context': context
            }
        
        # Add user message to history
        user_message_entry = {
            'role': 'user',
            'content': message,
            'timestamp': datetime.now().isoformat()
        }
        
        # Add files if provided
        if files:
            user_message_entry['files'] = files
        
        history.append(user_message_entry)
        
        # Call the LLM to generate a response
        response, extracted_context, next_step = self._call_anthropic(history, context)
        
        # Add assistant response to history
        history.append({
            'role': 'assistant',
            'content': response,
            'timestamp': datetime.now().isoformat()
        })
        
        # Update context
        updated_context = {**context, **extracted_context}
        self.conversations[conversation_id]['context'] = updated_context
        
        return response, updated_context, next_step
    
    def get_conversation_history(self, conversation_id):
        """
        Get the conversation history and context for a given conversation ID
        
        Args:
            conversation_id (str): Conversation ID
            
        Returns:
            tuple: (history, context)
        """
        if conversation_id not in self.conversations:
            return [], {}
        
        return (
            self.conversations[conversation_id]['history'],
            self.conversations[conversation_id]['context']
        )
    
    def _prepare_messages(self, history):
        """
        Convert our history format to Anthropic message format
        
        Args:
            history (list): Conversation history
            
        Returns:
            list: Messages in Anthropic format
        """
        messages = []
        
        for entry in history:
            message = {"role": entry['role'], "content": []}
            
            # Add text content
            if entry['content']:
                message["content"].append({
                    "type": "text",
                    "text": entry['content']
                })
            
            # Add files/images if present
            if 'files' in entry and entry['files']:
                for file in entry['files']:
                    if file.get('type', '').startswith('image/'):
                        # Convert to base64 for images
                        message["content"].append({
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": file['type'],
                                "data": file['data']
                            }
                        })
            
            messages.append(message)
        
        return messages
    
    def _call_anthropic(self, history, context):
        """
        Call the Anthropic Claude API to generate a response
        
        Args:
            history (list): Conversation history
            context (dict): Current context
            
        Returns:
            tuple: (response, extracted_context, next_step)
        """
        if not self.client:
            raise Exception("Anthropic client is not initialized. API key may be missing or invalid.")
        
        try:
            # System prompt providing context and instructions
            system_prompt = """
            You are an AI assistant specialized in helping users create custom Odoo ERP modules.
            Your task is to guide the user through a series of questions to gather requirements for their module.
            Extract key information from the user's responses and provide helpful guidance.
            
            IMPORTANT: You MUST ask the user which Odoo version they need the module for (e.g., 14.0, 15.0, 16.0, 17.0)
            before suggesting to move to the specification phase. This is critical for proper module generation.
            
            If the user shares screenshots or images of existing Odoo modules or UIs, analyze them to understand 
            their requirements better. Look for UI elements, field structures, and workflows that need to be 
            recreated or improved in the new module.
            
            Based on the conversation, extract the following information:
            - Module name
            - Module purpose/description
            - Odoo version
            - Functional requirements
            - Technical requirements
            - User interface elements
            - Dependencies on other Odoo modules
            
            When you have gathered sufficient information, including the Odoo version, suggest moving to the specification review phase.
            """
            
            # Prepare messages for Anthropic
            messages = self._prepare_messages(history)
            
            # Call the Anthropic API
            response = self.client.messages.create(
                model="claude-3-7-sonnet-20250219",  # Using Claude 3.7 Sonnet model
                system=system_prompt,
                messages=messages,
                max_tokens=1000,
                temperature=0.7
            )
            
            # Extract the response text
            response_text = response.content[0].text
            
            # Extract context and determine next step
            extracted_context = self._extract_context(response_text, context)
            next_step = self._determine_next_step(response_text, extracted_context)
            
            return response_text, extracted_context, next_step
            
        except Exception as e:
            # Handle API errors
            error_message = f"Error calling Anthropic API: {str(e)}"
            print(error_message)
            # Don't provide a mock response, raise the error so it can be addressed
            raise Exception(f"Error calling Anthropic API: {str(e)}. Real LLM responses are required, cannot use fallback content.")
    
    def _extract_context(self, response_text, current_context):
        """
        Extract context information from the LLM response
        
        Args:
            response_text (str): LLM response text
            current_context (dict): Current context
            
        Returns:
            dict: Extracted context
        """
        # Initialize with existing context
        extracted_context = {}
        
        # Define key phrases to look for in the response
        key_phrases = {
            "module_name": ["module name", "name of the module", "module will be called", "name your module"],
            "module_purpose": ["module purpose", "purpose of the module", "module will", "module should", "module's main function"],
            "odoo_version": ["odoo version", "version of odoo", "odoo v", "version", "odoo 14", "odoo 15", "odoo 16", "odoo 17"],
            "functional_requirements": ["functional requirement", "feature", "capability", "the module will", "the module should"],
            "technical_requirements": ["technical requirement", "technical specification", "implementation detail", "technical aspect"],
            "user_interface": ["user interface", "ui component", "interface element", "view", "form", "menu"],
            "dependencies": ["dependency", "depend on", "require module", "integration with"]
        }
        
        # Split the response into lines for processing
        lines = response_text.split("\n")
        
        # Process each line
        for line in lines:
            line_lower = line.lower()
            
            # Check for each key phrase
            for context_key, phrases in key_phrases.items():
                for phrase in phrases:
                    if phrase in line_lower:
                        # Extract text after colon, dash, or similar delimiter
                        for delimiter in [":", "-", "="]:
                            if delimiter in line:
                                parts = line.split(delimiter, 1)
                                if len(parts) > 1 and parts[1].strip():
                                    # If the context key is for a list type, append to it
                                    if context_key in ["functional_requirements", "technical_requirements",
                                                      "user_interface", "dependencies"]:
                                        if context_key not in extracted_context:
                                            extracted_context[context_key] = []
                                        extracted_context[context_key].append(parts[1].strip())
                                    else:
                                        # For non-list types, just set the value
                                        extracted_context[context_key] = parts[1].strip()
                                    break
        
        # If we didn't find a module name but it's mentioned in the text, try a more aggressive approach
        if "module_name" not in extracted_context and "module_name" not in current_context:
            for line in lines:
                line_lower = line.lower()
                if "module" in line_lower and any(word in line_lower for word in ["name", "called", "titled"]):
                    # Try to extract the module name using NLP-like heuristics
                    words = line.split()
                    for i, word in enumerate(words):
                        if word.lower() in ["module", "named", "called", "titled"] and i < len(words) - 1:
                            # The next word might be the module name
                            candidate = words[i + 1].strip('":,.;')
                            if len(candidate) > 2 and candidate.lower() not in ["is", "will", "should", "can", "for", "that", "which"]:
                                extracted_context["module_name"] = candidate
                                break
        
        # If we didn't find a module purpose but it's described in the text, try to extract it
        if "module_purpose" not in extracted_context and "module_purpose" not in current_context:
            purpose_indicators = ["purpose is", "designed to", "will allow", "helps to", "enables", "for managing"]
            for line in lines:
                line_lower = line.lower()
                if "module" in line_lower and any(indicator in line_lower for indicator in purpose_indicators):
                    for indicator in purpose_indicators:
                        if indicator in line_lower:
                            parts = line_lower.split(indicator, 1)
                            if len(parts) > 1 and parts[1].strip():
                                extracted_context["module_purpose"] = parts[1].strip().capitalize()
                                break
        
        return extracted_context
    
    def _determine_next_step(self, response_text, context):
        """
        Determine the next step based on the LLM response and context
        
        Args:
            response_text (str): LLM response text
            context (dict): Current context
            
        Returns:
            str: Next step ('specification', 'continue', or None)
        """
        # Check if we have gathered enough information to move to the specification phase
        # We'll still ask for Odoo version but not block if it's not provided
        basic_required_keys = ["module_name", "module_purpose"]
        has_basic_info = all(key in context for key in basic_required_keys)
        
        # Check if the response suggests moving to the specification phase
        suggests_specification = any(phrase in response_text.lower() for phrase in [
            "move to specification",
            "create specification",
            "generate specification",
            "review specification"
        ])
        
        # If Odoo version is not provided, we'll use a default value
        if "odoo_version" not in context and has_basic_info:
            # Add a default Odoo version if not specified
            context["odoo_version"] = "16.0"  # Use latest stable version as default
        
        # Allow moving to specification if we have at least the basic required info
        if suggests_specification and has_basic_info:
            return "specification"
        elif has_basic_info and len(context) >= 3:
            return "specification"
        else:
            return "continue"