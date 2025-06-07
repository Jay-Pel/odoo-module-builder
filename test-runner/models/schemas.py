from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime

class TestRequest(BaseModel):
    """Request model for starting a test session"""
    project_id: str
    module_url: str  # URL to download the module ZIP
    module_name: str
    module_code: Dict[str, str]  # Module files for test generation
    specification: str
    odoo_version: int = 17
    quick_mode: bool = False

class TestCase(BaseModel):
    """Individual test case result"""
    name: str
    status: str  # passed, failed, skipped
    duration: float
    error_message: Optional[str] = None
    screenshot_path: Optional[str] = None
    trace_path: Optional[str] = None

class TestResult(BaseModel):
    """Complete test results"""
    session_id: str
    project_id: str
    status: str
    total_tests: int
    passed_tests: int
    failed_tests: int
    skipped_tests: int
    test_cases: List[TestCase]
    execution_time: float
    created_at: datetime
    error_summary: Optional[str] = None

class TestSession(BaseModel):
    """Test session information"""
    session_id: str
    project_id: str
    status: str
    progress: int
    current_step: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    error: Optional[str] = None

class BugFixRequest(BaseModel):
    """Request for automated bug fixing"""
    project_id: str
    test_session_id: str
    error_report: str
    module_code: Dict[str, str]
    test_script: str

class ModuleInstallationResult(BaseModel):
    """Result of module installation in Odoo"""
    success: bool
    logs: str
    database_name: str
    module_name: str
    error_message: Optional[str] = None
    installation_time: float

# New UAT-related models
class UATRequest(BaseModel):
    project_id: str
    module_url: str
    module_name: str
    odoo_version: int
    user_id: str

class UATSession(BaseModel):
    session_id: str
    project_id: str
    user_id: str
    status: str  # "initializing", "active", "expired", "stopped"
    odoo_url: Optional[str] = None
    tunnel_url: Optional[str] = None
    container_info: Optional[Dict] = None
    started_at: datetime
    expires_at: datetime
    last_activity: datetime

class AdjustmentRequest(BaseModel):
    project_id: str
    uat_session_id: str
    user_request: str
    current_specification: str
    module_code: str

class PricingRequest(BaseModel):
    project_id: str
    module_code: str
    specification: str
    complexity_factors: Optional[Dict[str, Any]] = None

class PricingResult(BaseModel):
    project_id: str
    base_price: float
    complexity_score: int
    final_price: float
    pricing_breakdown: Dict[str, Any] 