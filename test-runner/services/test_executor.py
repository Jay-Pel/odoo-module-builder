import asyncio
import os
import tempfile
import subprocess
import json
import logging
import time
from typing import Dict, List
from datetime import datetime
from pathlib import Path

from models.schemas import TestResult, TestCase

logger = logging.getLogger(__name__)

class TestExecutor:
    """Executes Playwright tests and collects results"""
    
    def __init__(self):
        self.base_test_dir = tempfile.mkdtemp(prefix="omb_tests_")
        logger.info(f"Test executor initialized with base directory: {self.base_test_dir}")
    
    async def run_tests(self, session_id: str, test_script: str, odoo_url: str) -> Dict:
        """Run the generated test script and collect results"""
        try:
            logger.info(f"Running tests for session {session_id}")
            
            # Create test directory for this session
            test_dir = os.path.join(self.base_test_dir, session_id)
            os.makedirs(test_dir, exist_ok=True)
            
            # Write test script to file
            test_file = os.path.join(test_dir, "test_module.py")
            with open(test_file, 'w') as f:
                f.write(test_script)
            
            # Create pytest configuration
            await self._create_pytest_config(test_dir, odoo_url)
            
            # Create conftest.py for shared fixtures
            await self._create_conftest(test_dir, odoo_url)
            
            # Install playwright browsers if needed
            await self._ensure_playwright_browsers()
            
            # Run tests
            start_time = time.time()
            test_results = await self._execute_pytest(test_dir, session_id)
            total_duration = time.time() - start_time
            
            # Parse results
            parsed_results = await self._parse_test_results(test_dir, session_id, total_duration)
            
            logger.info(f"Tests completed for session {session_id}")
            return parsed_results
            
        except Exception as e:
            logger.error(f"Test execution failed for session {session_id}: {e}")
            return {
                "success": False,
                "error": str(e),
                "total_tests": 0,
                "passed_tests": 0,
                "failed_tests": 0,
                "skipped_tests": 0,
                "total_duration": 0,
                "test_cases": []
            }
    
    async def _create_pytest_config(self, test_dir: str, odoo_url: str):
        """Create pytest.ini configuration"""
        config_content = f"""[tool:pytest]
testpaths = .
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --tb=short
    --strict-markers
    --disable-warnings
    --junit-xml=results.xml
    --html=report.html
    --self-contained-html
markers =
    slow: marks tests as slow
    integration: marks tests as integration tests
    ui: marks tests as UI tests

[pytest]
ODOO_URL = {odoo_url}
"""
        
        config_file = os.path.join(test_dir, "pytest.ini")
        with open(config_file, 'w') as f:
            f.write(config_content)
    
    async def _create_conftest(self, test_dir: str, odoo_url: str):
        """Create conftest.py with shared fixtures"""
        conftest_content = f'''import pytest
import asyncio
from playwright.async_api import async_playwright

ODOO_URL = "{odoo_url}"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def browser():
    """Launch browser for the test session"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage']
        )
        yield browser
        await browser.close()

@pytest.fixture
async def page(browser):
    """Create a new page for each test"""
    context = await browser.new_context(
        viewport={{"width": 1280, "height": 720}},
        ignore_https_errors=True
    )
    page = await context.new_page()
    
    # Enable request/response logging
    page.on("console", lambda msg: print(f"Console: {{msg.text}}"))
    
    yield page
    
    # Take screenshot on test end
    try:
        await page.screenshot(path=f"screenshot_{{int(time.time())}}.png")
    except:
        pass
    
    await context.close()

@pytest.fixture
async def logged_in_page(page):
    """Login to Odoo and return authenticated page"""
    try:
        await page.goto(ODOO_URL)
        await page.wait_for_load_state("networkidle")
        
        # Try to login if login form is present
        if await page.locator('input[name="login"]').is_visible():
            await page.fill('input[name="login"]', 'admin')
            await page.fill('input[name="password"]', 'admin')
            await page.click('button[type="submit"]')
            await page.wait_for_load_state("networkidle")
        
        return page
    except Exception as e:
        print(f"Login failed: {{e}}")
        return page

@pytest.fixture
def test_data():
    """Generate test data for tests"""
    import random
    import string
    
    return {{
        "random_string": ''.join(random.choices(string.ascii_letters, k=10)),
        "random_number": random.randint(1, 1000),
        "timestamp": int(time.time())
    }}
'''
        
        conftest_file = os.path.join(test_dir, "conftest.py")
        with open(conftest_file, 'w') as f:
            f.write(conftest_content)
    
    async def _ensure_playwright_browsers(self):
        """Ensure Playwright browsers are installed"""
        try:
            # Check if browsers are already installed
            result = subprocess.run(
                ["python", "-m", "playwright", "install", "--dry-run"],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if "chromium" not in result.stdout.lower():
                logger.info("Installing Playwright browsers...")
                subprocess.run(
                    ["python", "-m", "playwright", "install", "chromium"],
                    check=True,
                    timeout=300
                )
        except Exception as e:
            logger.warning(f"Failed to ensure Playwright browsers: {e}")
    
    async def _execute_pytest(self, test_dir: str, session_id: str) -> Dict:
        """Execute pytest and capture results"""
        try:
            # Change to test directory
            original_cwd = os.getcwd()
            os.chdir(test_dir)
            
            # Run pytest with JSON output
            cmd = [
                "python", "-m", "pytest",
                "test_module.py",
                "-v",
                "--tb=short",
                "--junit-xml=results.xml",
                "--json-report",
                "--json-report-file=results.json"
            ]
            
            logger.info(f"Executing: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=600  # 10 minute timeout
            )
            
            return {
                "exit_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "success": result.returncode == 0
            }
            
        except subprocess.TimeoutExpired:
            logger.error("Test execution timed out")
            return {
                "exit_code": -1,
                "stdout": "",
                "stderr": "Test execution timed out after 10 minutes",
                "success": False
            }
        except Exception as e:
            logger.error(f"Test execution failed: {e}")
            return {
                "exit_code": -1,
                "stdout": "",
                "stderr": str(e),
                "success": False
            }
        finally:
            # Restore original directory
            os.chdir(original_cwd)
    
    async def _parse_test_results(self, test_dir: str, session_id: str, total_duration: float) -> Dict:
        """Parse test results from JSON and XML output"""
        try:
            results = {
                "success": False,
                "total_tests": 0,
                "passed_tests": 0,
                "failed_tests": 0,
                "skipped_tests": 0,
                "total_duration": total_duration,
                "test_cases": [],
                "error_summary": None
            }
            
            # Try to read JSON results first
            json_file = os.path.join(test_dir, "results.json")
            if os.path.exists(json_file):
                try:
                    with open(json_file, 'r') as f:
                        json_data = json.load(f)
                    
                    results.update(self._parse_json_results(json_data))
                except Exception as e:
                    logger.warning(f"Failed to parse JSON results: {e}")
            
            # Fallback to XML results
            xml_file = os.path.join(test_dir, "results.xml")
            if os.path.exists(xml_file) and not results["test_cases"]:
                try:
                    results.update(self._parse_xml_results(xml_file))
                except Exception as e:
                    logger.warning(f"Failed to parse XML results: {e}")
            
            # Collect screenshots and traces
            results["screenshots"] = self._collect_artifacts(test_dir, "*.png")
            results["traces"] = self._collect_artifacts(test_dir, "*.zip")
            
            results["success"] = results["failed_tests"] == 0 and results["total_tests"] > 0
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to parse test results: {e}")
            return {
                "success": False,
                "error": str(e),
                "total_tests": 0,
                "passed_tests": 0,
                "failed_tests": 0,
                "skipped_tests": 0,
                "total_duration": total_duration,
                "test_cases": []
            }
    
    def _parse_json_results(self, json_data: Dict) -> Dict:
        """Parse pytest JSON results"""
        results = {
            "total_tests": json_data.get("summary", {}).get("total", 0),
            "passed_tests": json_data.get("summary", {}).get("passed", 0),
            "failed_tests": json_data.get("summary", {}).get("failed", 0),
            "skipped_tests": json_data.get("summary", {}).get("skipped", 0),
            "test_cases": []
        }
        
        # Parse individual test cases
        for test in json_data.get("tests", []):
            test_case = {
                "name": test.get("nodeid", "Unknown"),
                "status": test.get("outcome", "unknown"),
                "duration": test.get("duration", 0),
                "error_message": None
            }
            
            if test.get("call", {}).get("longrepr"):
                test_case["error_message"] = test["call"]["longrepr"]
            
            results["test_cases"].append(test_case)
        
        return results
    
    def _parse_xml_results(self, xml_file: str) -> Dict:
        """Parse pytest XML results as fallback"""
        try:
            import xml.etree.ElementTree as ET
            tree = ET.parse(xml_file)
            root = tree.getroot()
            
            results = {
                "total_tests": int(root.get("tests", 0)),
                "passed_tests": 0,
                "failed_tests": int(root.get("failures", 0)),
                "skipped_tests": int(root.get("skipped", 0)),
                "test_cases": []
            }
            
            results["passed_tests"] = results["total_tests"] - results["failed_tests"] - results["skipped_tests"]
            
            # Parse test cases
            for testcase in root.findall(".//testcase"):
                test_case = {
                    "name": testcase.get("name", "Unknown"),
                    "duration": float(testcase.get("time", 0)),
                    "status": "passed",
                    "error_message": None
                }
                
                # Check for failures or errors
                failure = testcase.find("failure")
                error = testcase.find("error")
                skipped = testcase.find("skipped")
                
                if failure is not None:
                    test_case["status"] = "failed"
                    test_case["error_message"] = failure.text
                elif error is not None:
                    test_case["status"] = "failed"
                    test_case["error_message"] = error.text
                elif skipped is not None:
                    test_case["status"] = "skipped"
                
                results["test_cases"].append(test_case)
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to parse XML results: {e}")
            return {}
    
    def _collect_artifacts(self, test_dir: str, pattern: str) -> List[str]:
        """Collect test artifacts like screenshots and traces"""
        try:
            from glob import glob
            artifacts = glob(os.path.join(test_dir, pattern))
            return [os.path.basename(f) for f in artifacts]
        except Exception:
            return []
    
    async def cleanup_test_session(self, session_id: str):
        """Clean up test files for a session"""
        try:
            test_dir = os.path.join(self.base_test_dir, session_id)
            if os.path.exists(test_dir):
                import shutil
                shutil.rmtree(test_dir)
                logger.info(f"Cleaned up test directory for session {session_id}")
        except Exception as e:
            logger.error(f"Failed to cleanup test session {session_id}: {e}") 