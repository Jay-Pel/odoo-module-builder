import os
import logging
from typing import Dict, List
import anthropic

logger = logging.getLogger(__name__)

class TestGenerator:
    """Generates Playwright test scripts using Claude AI"""
    
    def __init__(self):
        try:
            self.client = anthropic.Anthropic(
                api_key=os.getenv("ANTHROPIC_API_KEY")
            )
        except Exception as e:
            logger.error(f"Failed to initialize Anthropic client: {e}")
            self.client = None
    
    async def generate_test_script(self, module_code: Dict[str, str], specification: str, quick_mode: bool = False) -> str:
        """Generate comprehensive Playwright test script"""
        try:
            if not self.client:
                raise Exception("Anthropic client not initialized")
            
            # Create the test generation prompt
            prompt = self._create_test_prompt(module_code, specification, quick_mode)
            
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=8000,
                temperature=0.1,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            test_script = response.content[0].text
            logger.info("Test script generated successfully")
            return test_script
            
        except Exception as e:
            logger.error(f"Failed to generate test script: {e}")
            raise Exception(f"Test generation failed: {e}")
    
    def _create_test_prompt(self, module_code: Dict[str, str], specification: str, quick_mode: bool) -> str:
        """Create the prompt for test script generation"""
        
        # Analyze module structure
        module_analysis = self._analyze_module_structure(module_code)
        
        # Determine test complexity
        test_mode = "Quick testing mode (essential functionality only)" if quick_mode else "Comprehensive testing mode (full coverage)"
        
        prompt = f"""You are an expert Odoo QA engineer and Playwright automation specialist. Generate a comprehensive Playwright test script for the provided Odoo module.

TESTING MODE: {test_mode}

MODULE SPECIFICATION:
{specification}

MODULE CODE ANALYSIS:
{module_analysis}

REQUIREMENTS:
1. Generate a complete Playwright test script using pytest fixtures
2. Test all core functionality described in the specification
3. Include proper page object patterns and element selectors
4. Add data validation and business logic testing
5. Implement proper setup and teardown
6. Include error handling and assertions
7. Generate realistic test data
8. Test both UI interactions and backend functionality

TEST SCRIPT STRUCTURE:
```python
import pytest
import asyncio
from playwright.async_api import async_playwright, Page, Browser
import random
import string

class TestOdooModule:
    @pytest.fixture
    async def browser_context(self):
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            yield context
            await browser.close()
    
    @pytest.fixture
    async def page(self, browser_context):
        page = await browser_context.new_page()
        yield page
        await page.close()
    
    # Add comprehensive test methods here
```

ODOO-SPECIFIC TESTING GUIDELINES:
1. Always login as admin first: email='admin', password='admin'
2. Navigate to Apps menu to find and access the module
3. Test CRUD operations for all models
4. Verify form validations and constraints
5. Test workflow transitions and business logic
6. Verify security access rules
7. Test menu navigation and view rendering
8. Validate computed fields and related data

PLAYWRIGHT BEST PRACTICES:
1. Use data-testid attributes or stable selectors
2. Wait for elements to be visible before interacting
3. Use proper assertions with expect()
4. Handle dynamic content and loading states
5. Take screenshots on failures
6. Use page.wait_for_load_state() appropriately
7. Implement retry logic for flaky elements

{"QUICK MODE: Focus only on essential 'happy path' tests for core functionality." if quick_mode else "COMPREHENSIVE MODE: Include edge cases, error scenarios, and full workflow testing."}

Generate ONLY the complete Python test script. Include all necessary imports, fixtures, and test methods. The script should be ready to run with pytest.

MODULE FILES:
{self._format_module_files(module_code)}

Return only the complete test script code without any explanations."""

        return prompt
    
    def _analyze_module_structure(self, module_code: Dict[str, str]) -> str:
        """Analyze the module structure to inform test generation"""
        analysis = []
        
        # Analyze models
        models = []
        for file_path, content in module_code.items():
            if file_path.endswith('.py') and 'models' in file_path:
                # Extract model information
                lines = content.split('\n')
                for line in lines:
                    if 'class ' in line and 'models.Model' in line:
                        model_name = line.split('class ')[1].split('(')[0].strip()
                        models.append(model_name)
        
        if models:
            analysis.append(f"Python Models: {', '.join(models)}")
        
        # Analyze views
        views = []
        menus = []
        for file_path, content in module_code.items():
            if file_path.endswith('.xml'):
                if 'ir.ui.view' in content:
                    views.append(file_path.split('/')[-1])
                if 'ir.ui.menu' in content:
                    menus.append("Menu items defined")
        
        if views:
            analysis.append(f"XML Views: {', '.join(views)}")
        if menus:
            analysis.append("Menu navigation available")
        
        # Analyze security
        security_files = [f for f in module_code.keys() if 'security' in f]
        if security_files:
            analysis.append(f"Security files: {', '.join(security_files)}")
        
        return '\n'.join(analysis) if analysis else "Basic module structure detected"
    
    def _format_module_files(self, module_code: Dict[str, str]) -> str:
        """Format module files for the prompt"""
        formatted = []
        
        # Prioritize important files
        important_files = []
        other_files = []
        
        for file_path, content in module_code.items():
            if any(important in file_path for important in ['__manifest__.py', 'models/', 'views/', 'security/']):
                important_files.append((file_path, content))
            else:
                other_files.append((file_path, content))
        
        # Add important files first
        for file_path, content in important_files[:5]:  # Limit to top 5 important files
            formatted.append(f"\n--- {file_path} ---\n{content[:2000]}{'...' if len(content) > 2000 else ''}")
        
        # Add summary of other files
        if other_files:
            other_file_names = [f[0] for f in other_files]
            formatted.append(f"\n--- Additional Files ---\n{', '.join(other_file_names)}")
        
        return '\n'.join(formatted)
    
    def extract_test_cases_from_spec(self, specification: str) -> List[str]:
        """Extract specific test cases from the specification"""
        test_cases = []
        
        # Look for acceptance criteria, requirements, features
        lines = specification.split('\n')
        current_section = ""
        
        for line in lines:
            line = line.strip()
            if any(keyword in line.lower() for keyword in ['test', 'should', 'must', 'shall', 'requirement']):
                test_cases.append(line)
            elif line.startswith('- ') and current_section:
                test_cases.append(line[2:])  # Remove bullet point
        
        return test_cases[:10]  # Limit to first 10 test cases 