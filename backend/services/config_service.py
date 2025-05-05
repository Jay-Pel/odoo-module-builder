import os
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConfigService:
    """
    Service for managing configuration and environment settings
    """
    
    def __init__(self):
        """
        Initialize the config service
        """
        # Default configuration values
        self.defaults = {
            'N8N_BASE_URL': 'http://localhost:3001',
            'N8N_API_KEY': '',
            'ODOO_DEFAULT_VERSION': '16.0',
            'ODOO_DEFAULT_EDITION': 'community',
            'LLM_GEMINI_API_KEY': '',
            'LLM_CLAUDE_API_KEY': '',
            'APP_PORT': '3000'
        }
        
        self.config = {}
        self._load_config()
    
    def _load_config(self):
        """
        Load configuration from environment variables
        """
        # Load from environment variables
        for key in self.defaults:
            self.config[key] = os.environ.get(key, self.defaults[key])
        
        logger.info(f"Configuration loaded with N8N base URL: {self.config['N8N_BASE_URL']}")
    
    def get(self, key, default=None):
        """
        Get a configuration value
        
        Args:
            key (str): Configuration key
            default: Default value if key is not found
            
        Returns:
            The configuration value
        """
        return self.config.get(key, default)
    
    def set(self, key, value):
        """
        Set a configuration value
        
        Args:
            key (str): Configuration key
            value: Configuration value
        """
        self.config[key] = value
    
    def get_n8n_config(self):
        """
        Get n8n-specific configuration
        
        Returns:
            dict: n8n configuration
        """
        return {
            'base_url': self.get('N8N_BASE_URL'),
            'api_key': self.get('N8N_API_KEY')
        }
    
    def get_odoo_defaults(self):
        """
        Get Odoo default configuration
        
        Returns:
            dict: Odoo default configuration
        """
        return {
            'version': self.get('ODOO_DEFAULT_VERSION'),
            'edition': self.get('ODOO_DEFAULT_EDITION')
        }
    
    def get_llm_config(self):
        """
        Get LLM configuration
        
        Returns:
            dict: LLM configuration
        """
        return {
            'gemini_api_key': self.get('LLM_GEMINI_API_KEY'),
            'claude_api_key': self.get('LLM_CLAUDE_API_KEY')
        }
