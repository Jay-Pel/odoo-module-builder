import os
import sqlite3
from typing import Optional, List, Dict, Any
from datetime import datetime

class DatabaseService:
    """Service for handling Cloudflare D1 database operations"""
    
    def __init__(self):
        # In production, this will be handled by Cloudflare Workers
        # For local development, use SQLite
        self.db_path = os.getenv("DATABASE_PATH", "./local_dev.db")
        self._init_local_db()
    
    def _init_local_db(self):
        """Initialize local SQLite database for development"""
        if not os.path.exists(self.db_path):
            conn = sqlite3.connect(self.db_path)
            with open("database/schema.sql", "r") as f:
                schema = f.read()
            conn.executescript(schema)
            conn.close()
    
    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable dict-like access
        return conn
    
    # User operations
    async def create_user(self, user_id: str, email: str, hashed_password: str) -> bool:
        """Create a new user"""
        try:
            conn = self.get_connection()
            conn.execute(
                "INSERT INTO users (id, email, hashed_password) VALUES (?, ?, ?)",
                (user_id, email, hashed_password)
            )
            conn.commit()
            conn.close()
            return True
        except sqlite3.IntegrityError:
            return False
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        conn = self.get_connection()
        cursor = conn.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        conn.close()
        return dict(user) if user else None
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        conn = self.get_connection()
        cursor = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        conn.close()
        return dict(user) if user else None
    
    # Project operations
    async def create_project(self, project_id: str, user_id: str, name: str, 
                           odoo_version: int, description: str = None) -> bool:
        """Create a new project"""
        try:
            conn = self.get_connection()
            conn.execute(
                "INSERT INTO projects (id, user_id, name, odoo_version, description) VALUES (?, ?, ?, ?, ?)",
                (project_id, user_id, name, odoo_version, description)
            )
            conn.commit()
            conn.close()
            return True
        except sqlite3.Error:
            return False
    
    async def get_user_projects(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all projects for a user"""
        conn = self.get_connection()
        cursor = conn.execute(
            "SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,)
        )
        projects = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return projects
    
    async def get_project_by_id(self, project_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get project by ID for a specific user"""
        conn = self.get_connection()
        cursor = conn.execute(
            "SELECT * FROM projects WHERE id = ? AND user_id = ?",
            (project_id, user_id)
        )
        project = cursor.fetchone()
        conn.close()
        return dict(project) if project else None
    
    async def update_project_status(self, project_id: str, status: str) -> bool:
        """Update project status"""
        try:
            conn = self.get_connection()
            conn.execute(
                "UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (status, project_id)
            )
            conn.commit()
            conn.close()
            return True
        except sqlite3.Error:
            return False
    
    # Specification operations
    async def save_specification(self, spec_id: str, project_id: str, content: str) -> bool:
        """Save or update specification"""
        try:
            conn = self.get_connection()
            conn.execute(
                """INSERT OR REPLACE INTO specifications 
                   (id, project_id, content, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)""",
                (spec_id, project_id, content)
            )
            conn.commit()
            conn.close()
            return True
        except sqlite3.Error:
            return False
    
    async def get_specification(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get specification for a project"""
        conn = self.get_connection()
        cursor = conn.execute(
            "SELECT * FROM specifications WHERE project_id = ?",
            (project_id,)
        )
        spec = cursor.fetchone()
        conn.close()
        return dict(spec) if spec else None
    
    async def approve_specification(self, project_id: str) -> bool:
        """Approve a specification"""
        try:
            conn = self.get_connection()
            conn.execute(
                "UPDATE specifications SET is_approved = 1 WHERE project_id = ?",
                (project_id,)
            )
            conn.commit()
            conn.close()
            return True
        except sqlite3.Error:
            return False
    
    # Module Builds operations
    async def create_module_build(self, build_data: Dict) -> bool:
        """Create a new module build record"""
        try:
            conn = self.get_connection()
            conn.execute("""
                INSERT INTO module_builds (id, project_id, version, r2_key, build_status, build_size, files_count, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                build_data['id'],
                build_data['project_id'],
                build_data['version'],
                build_data['r2_key'],
                build_data.get('build_status', 'building'),
                build_data.get('build_size', 0),
                build_data.get('files_count', 0),
                build_data.get('created_at')
            ))
            conn.commit()
            conn.close()
            return True
        except sqlite3.Error as e:
            print(f"Error creating module build: {str(e)}")
            return False
    
    async def get_module_builds(self, project_id: str) -> List[Dict]:
        """Get all module builds for a project"""
        try:
            conn = self.get_connection()
            cursor = conn.execute(
                "SELECT * FROM module_builds WHERE project_id = ? ORDER BY version DESC",
                (project_id,)
            )
            builds = [dict(row) for row in cursor.fetchall()]
            conn.close()
            return builds
        except sqlite3.Error as e:
            print(f"Error getting module builds: {str(e)}")
            return []
    
    async def get_module_build(self, project_id: str, version: int) -> Optional[Dict]:
        """Get a specific module build"""
        try:
            conn = self.get_connection()
            cursor = conn.execute(
                "SELECT * FROM module_builds WHERE project_id = ? AND version = ?",
                (project_id, version)
            )
            build = cursor.fetchone()
            conn.close()
            return dict(build) if build else None
        except sqlite3.Error as e:
            print(f"Error getting module build: {str(e)}")
            return None
    
    async def get_next_module_version(self, project_id: str) -> int:
        """Get the next version number for a project"""
        try:
            conn = self.get_connection()
            cursor = conn.execute(
                "SELECT MAX(version) as max_version FROM module_builds WHERE project_id = ?",
                (project_id,)
            )
            result = cursor.fetchone()
            conn.close()
            max_version = result['max_version'] if result and result['max_version'] else 0
            return max_version + 1
        except sqlite3.Error as e:
            print(f"Error getting next version: {str(e)}")
            return 1
    
    async def update_project_price(self, project_id: str, price: int) -> bool:
        """Update project final price"""
        try:
            conn = self.get_connection()
            conn.execute(
                "UPDATE projects SET final_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (price, project_id)
            )
            conn.commit()
            conn.close()
            return True
        except sqlite3.Error as e:
            print(f"Error updating project price: {str(e)}")
            return False
    
    # Convenience method aliases for compatibility
    async def get_project(self, project_id: str, user_id: str = None) -> Optional[Dict[str, Any]]:
        """Get project by ID, optionally filtered by user"""
        if user_id:
            return await self.get_project_by_id(project_id, user_id)
        else:
            # For internal use without user filtering
            conn = self.get_connection()
            cursor = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
            project = cursor.fetchone()
            conn.close()
            return dict(project) if project else None
    
    async def get_latest_module_build(self, project_id: str) -> Optional[Dict]:
        """Get the latest module build for a project"""
        try:
            conn = self.get_connection()
            cursor = conn.execute(
                "SELECT * FROM module_builds WHERE project_id = ? ORDER BY version DESC LIMIT 1",
                (project_id,)
            )
            build = cursor.fetchone()
            conn.close()
            if build:
                build_dict = dict(build)
                # Add download URL (in production this would be R2 URL)
                build_dict["download_url"] = f"http://localhost:8000/download/{project_id}/v{build_dict['version']}"
                build_dict["module_name"] = f"project_{project_id}_module"
                return build_dict
            return None
        except sqlite3.Error as e:
            print(f"Error getting latest module build: {str(e)}")
            return None
    
    async def get_module_files(self, build_id: str) -> Dict[str, str]:
        """Get module files from a build"""
        try:
            # In a real implementation, this would fetch files from R2 or database
            # For now, return empty dict
            return {}
        except Exception as e:
            print(f"Error getting module files: {e}")
            return {}
    
    # Testing-related methods
    async def create_test_session(self, session_data: Dict) -> str:
        """Create a new test session"""
        try:
            conn = self.get_connection()
            conn.execute("""
                INSERT INTO test_sessions (session_id, project_id, status, started_at)
                VALUES (?, ?, ?, ?)
            """, (
                session_data["session_id"],
                session_data["project_id"],
                session_data["status"],
                session_data["started_at"]
            ))
            conn.commit()
            conn.close()
            return session_data["session_id"]
        except sqlite3.Error as e:
            print(f"Error creating test session: {e}")
            raise
    
    async def update_test_session(self, session_id: str, updates: Dict):
        """Update test session data"""
        try:
            conn = self.get_connection()
            # Build dynamic update query
            set_clauses = []
            values = []
            
            for key, value in updates.items():
                set_clauses.append(f"{key} = ?")
                values.append(value)
            
            values.append(session_id)
            
            stmt = f"""
                UPDATE test_sessions 
                SET {', '.join(set_clauses)}
                WHERE session_id = ?
            """
            conn.execute(stmt, values)
            conn.commit()
            conn.close()
        except sqlite3.Error as e:
            print(f"Error updating test session: {e}")
            raise
    
    async def get_test_session(self, session_id: str) -> Optional[Dict]:
        """Get test session by ID"""
        try:
            conn = self.get_connection()
            cursor = conn.execute("SELECT * FROM test_sessions WHERE session_id = ?", (session_id,))
            row = cursor.fetchone()
            conn.close()
            return dict(row) if row else None
        except sqlite3.Error as e:
            print(f"Error getting test session: {e}")
            return None
    
    async def get_latest_test_session(self, project_id: str) -> Optional[Dict]:
        """Get the latest test session for a project"""
        try:
            conn = self.get_connection()
            cursor = conn.execute("""
                SELECT * FROM test_sessions 
                WHERE project_id = ? 
                ORDER BY started_at DESC 
                LIMIT 1
            """, (project_id,))
            row = cursor.fetchone()
            conn.close()
            return dict(row) if row else None
        except sqlite3.Error as e:
            print(f"Error getting latest test session: {e}")
            return None
    
    async def get_test_sessions_history(self, project_id: str) -> List[Dict]:
        """Get all test sessions for a project"""
        try:
            conn = self.get_connection()
            cursor = conn.execute("""
                SELECT * FROM test_sessions 
                WHERE project_id = ? 
                ORDER BY started_at DESC
            """, (project_id,))
            rows = cursor.fetchall()
            conn.close()
            return [dict(row) for row in rows]
        except sqlite3.Error as e:
            print(f"Error getting test sessions history: {e}")
            return []
    
    async def save_test_results(self, session_id: str, results: Dict):
        """Save test results to database"""
        try:
            import json
            conn = self.get_connection()
            
            # Save summary results
            conn.execute("""
                UPDATE test_sessions 
                SET results = ?, 
                    total_tests = ?, 
                    passed_tests = ?, 
                    failed_tests = ?,
                    success = ?
                WHERE session_id = ?
            """, (
                json.dumps(results),
                results.get("total_tests", 0),
                results.get("passed_tests", 0),
                results.get("failed_tests", 0),
                results.get("success", False),
                session_id
            ))
            
            # Save individual test cases
            if "test_cases" in results:
                for test_case in results["test_cases"]:
                    conn.execute("""
                        INSERT INTO test_cases (session_id, name, status, duration, error_message)
                        VALUES (?, ?, ?, ?, ?)
                    """, (
                        session_id,
                        test_case["name"],
                        test_case["status"],
                        test_case["duration"],
                        test_case.get("error_message")
                    ))
            
            conn.commit()
            conn.close()
        except sqlite3.Error as e:
            print(f"Error saving test results: {e}")
            raise
    
    async def get_test_results(self, session_id: str) -> Optional[Dict]:
        """Get test results for a session"""
        try:
            import json
            
            # Get session with results
            session = await self.get_test_session(session_id)
            if not session or not session.get("results"):
                return None
            
            # Parse results
            results = json.loads(session["results"])
            
            # Get individual test cases
            conn = self.get_connection()
            cursor = conn.execute("SELECT * FROM test_cases WHERE session_id = ?", (session_id,))
            test_cases = [dict(row) for row in cursor.fetchall()]
            conn.close()
            
            results["test_cases"] = test_cases
            return results
            
        except sqlite3.Error as e:
            print(f"Error getting test results: {e}")
            return None

    # UAT Session Management
    
    async def create_uat_session(self, session_id: str, project_id: str, user_id: str, status: str) -> str:
        """Create a new UAT session"""
        try:
            conn = self.get_connection()
            conn.execute("""
                INSERT INTO uat_sessions (id, project_id, user_id, status, created_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (session_id, project_id, user_id, status))
            conn.commit()
            conn.close()
            return session_id
        except sqlite3.Error as e:
            print(f"Error creating UAT session: {e}")
            raise
    
    async def get_uat_session(self, session_id: str) -> Optional[Dict]:
        """Get UAT session by ID"""
        try:
            conn = self.get_connection()
            cursor = conn.execute("SELECT * FROM uat_sessions WHERE id = ?", (session_id,))
            row = cursor.fetchone()
            conn.close()
            return dict(row) if row else None
        except sqlite3.Error as e:
            print(f"Error getting UAT session: {e}")
            return None
    
    async def update_uat_session_status(self, session_id: str, status: str):
        """Update UAT session status"""
        try:
            conn = self.get_connection()
            conn.execute("UPDATE uat_sessions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", 
                        (status, session_id))
            conn.commit()
            conn.close()
        except sqlite3.Error as e:
            print(f"Error updating UAT session status: {e}")
            raise
    
    # Adjustment Requests
    
    async def get_adjustment_count(self, project_id: str) -> int:
        """Get the number of adjustment requests for a project"""
        try:
            conn = self.get_connection()
            cursor = conn.execute("SELECT COUNT(*) as count FROM adjustment_requests WHERE project_id = ?", 
                                 (project_id,))
            result = cursor.fetchone()
            conn.close()
            return result["count"] if result else 0
        except sqlite3.Error as e:
            print(f"Error getting adjustment count: {e}")
            return 0
    
    async def create_adjustment_request(self, project_id: str, user_id: str, description: str, priority: str) -> str:
        """Create a new adjustment request"""
        try:
            adjustment_id = f"adj_{int(datetime.now().timestamp())}"
            conn = self.get_connection()
            conn.execute("""
                INSERT INTO adjustment_requests (id, project_id, user_id, description, priority, status, created_at)
                VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
            """, (adjustment_id, project_id, user_id, description, priority))
            conn.commit()
            conn.close()
            return adjustment_id
        except sqlite3.Error as e:
            print(f"Error creating adjustment request: {e}")
            raise
    
    # Pricing
    
    async def get_project_pricing(self, project_id: str) -> Optional[Dict]:
        """Get pricing information for a project"""
        try:
            conn = self.get_connection()
            cursor = conn.execute("SELECT * FROM project_pricing WHERE project_id = ?", (project_id,))
            row = cursor.fetchone()
            conn.close()
            if row:
                result = dict(row)
                # Parse JSON pricing breakdown
                if result.get("pricing_breakdown"):
                    import json
                    result["pricing_breakdown"] = json.loads(result["pricing_breakdown"])
                return result
            return None
        except sqlite3.Error as e:
            print(f"Error getting project pricing: {e}")
            return None
    
    async def save_project_pricing(self, project_id: str, pricing_data: Dict):
        """Save pricing information for a project"""
        try:
            import json
            conn = self.get_connection()
            conn.execute("""
                INSERT OR REPLACE INTO project_pricing 
                (project_id, base_price, complexity_score, final_price, pricing_breakdown, created_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (
                project_id,
                pricing_data["base_price"],
                pricing_data["complexity_score"],
                pricing_data["final_price"],
                json.dumps(pricing_data["pricing_breakdown"])
            ))
            conn.commit()
            conn.close()
        except sqlite3.Error as e:
            print(f"Error saving project pricing: {e}")
            raise
    
    async def get_project_fix_attempts(self, project_id: str) -> int:
        """Get the number of fix attempts for a project"""
        try:
            conn = self.get_connection()
            cursor = conn.execute("""
                SELECT COUNT(*) as count FROM test_sessions 
                WHERE project_id = ? AND status = 'completed' AND success = 0
            """, (project_id,))
            result = cursor.fetchone()
            conn.close()
            return result["count"] if result else 0
        except sqlite3.Error as e:
            print(f"Error getting fix attempts count: {e}")
            return 0
    
    # Payment Management
    
    async def create_payment_record(self, project_id: str, user_id: str, stripe_payment_intent_id: str, 
                                  amount: float, currency: str, status: str) -> str:
        """Create a payment record"""
        try:
            payment_id = f"pay_{int(datetime.now().timestamp())}"
            conn = self.get_connection()
            conn.execute("""
                INSERT INTO payments (id, project_id, user_id, stripe_payment_intent_id, amount, currency, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (payment_id, project_id, user_id, stripe_payment_intent_id, amount, currency, status))
            conn.commit()
            conn.close()
            return payment_id
        except sqlite3.Error as e:
            print(f"Error creating payment record: {e}")
            raise
    
    async def get_project_payment(self, project_id: str) -> Optional[Dict]:
        """Get payment record for a project"""
        try:
            conn = self.get_connection()
            cursor = conn.execute("SELECT * FROM payments WHERE project_id = ? ORDER BY created_at DESC LIMIT 1", 
                                 (project_id,))
            row = cursor.fetchone()
            conn.close()
            return dict(row) if row else None
        except sqlite3.Error as e:
            print(f"Error getting project payment: {e}")
            return None
    
    async def update_payment_status(self, stripe_payment_intent_id: str, status: str, paid_at=None):
        """Update payment status"""
        try:
            conn = self.get_connection()
            if paid_at:
                conn.execute("UPDATE payments SET status = ?, paid_at = ?, updated_at = CURRENT_TIMESTAMP WHERE stripe_payment_intent_id = ?", 
                            (status, paid_at.isoformat(), stripe_payment_intent_id))
            else:
                conn.execute("UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE stripe_payment_intent_id = ?", 
                            (status, stripe_payment_intent_id))
            conn.commit()
            conn.close()
        except sqlite3.Error as e:
            print(f"Error updating payment status: {e}")
            raise
    
    async def record_module_download(self, project_id: str, user_id: str, module_version_id: str):
        """Record a module download event"""
        try:
            download_id = f"dl_{int(datetime.now().timestamp())}"
            conn = self.get_connection()
            conn.execute("""
                INSERT INTO module_downloads (id, project_id, user_id, module_version_id, downloaded_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (download_id, project_id, user_id, module_version_id))
            conn.commit()
            conn.close()
        except sqlite3.Error as e:
            print(f"Error recording module download: {e}")
            raise
    
    # Module Version Management
    
    async def get_latest_module_version(self, project_id: str) -> Optional[Dict]:
        """Get the latest module version for a project"""
        try:
            conn = self.get_connection()
            cursor = conn.execute("""
                SELECT * FROM module_builds 
                WHERE project_id = ? 
                ORDER BY version DESC 
                LIMIT 1
            """, (project_id,))
            row = cursor.fetchone()
            conn.close()
            if row:
                result = dict(row)
                # Add necessary fields for UAT and download
                result["r2_url"] = f"http://localhost:8000/download/{project_id}/v{result['version']}"
                result["module_name"] = f"project_{project_id}_module"
                result["r2_key"] = f"modules/{project_id}/v{result['version']}.zip"
                return result
            return None
        except sqlite3.Error as e:
            print(f"Error getting latest module version: {e}")
            return None
    
    async def get_project_specification(self, project_id: str) -> Optional[Dict]:
        """Get the approved specification for a project"""
        try:
            conn = self.get_connection()
            cursor = conn.execute("SELECT * FROM specifications WHERE project_id = ? AND is_approved = 1", 
                                 (project_id,))
            row = cursor.fetchone()
            conn.close()
            return dict(row) if row else None
        except sqlite3.Error as e:
            print(f"Error getting project specification: {e}")
            return None

# Global database instance
db = DatabaseService() 