#!/usr/bin/env python3
"""
Generate .env files from centralized configuration
Usage: python scripts/generate_env.py [--env development|production]
"""

import yaml
import os
import sys
import argparse
from pathlib import Path
import secrets
import string

def generate_secret_key(length=64):
    """Generate a secure random secret key"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def load_config(config_path="config.yml"):
    """Load configuration from YAML file"""
    try:
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    except FileNotFoundError:
        print(f"Error: Configuration file '{config_path}' not found")
        sys.exit(1)
    except yaml.YAMLError as e:
        print(f"Error parsing YAML file: {e}")
        sys.exit(1)

def generate_backend_env(config, env_name="development"):
    """Generate backend .env file"""
    env_config = config[env_name]
    
    env_content = f"""# Odoo Module Builder v3 - Backend Environment
# Generated from config.yml - DO NOT EDIT MANUALLY
# Run 'python scripts/generate_env.py' to regenerate

# Application settings
APP_NAME="{config['app']['name']}"
APP_VERSION="{config['app']['version']}"

# Server settings
HOST={env_config['backend']['host']}
PORT={env_config['backend']['port']}
RELOAD={str(env_config['backend']['reload']).lower()}
LOG_LEVEL={env_config['backend']['log_level']}

# Database settings
DATABASE_PATH={config['database'][env_name]['path']}

# Authentication settings
ALGORITHM={config['auth']['algorithm']}
ACCESS_TOKEN_EXPIRE_MINUTES={config['auth']['access_token_expire_minutes']}

# AI Services settings
GEMINI_MODEL={config['ai_services']['gemini']['model']}
ANTHROPIC_MODEL={config['ai_services']['anthropic']['model']}
ANTHROPIC_MAX_TOKENS={config['ai_services']['anthropic']['max_tokens']}
ANTHROPIC_TEMPERATURE={config['ai_services']['anthropic']['temperature']}

# REQUIRED: Add these sensitive environment variables manually
# JWT_SECRET_KEY=your-super-secret-jwt-key-here
# GEMINI_API_KEY=your-gemini-api-key-here
# ANTHROPIC_API_KEY=your-anthropic-api-key-here
# STRIPE_SECRET_KEY=your-stripe-secret-key-here
# STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret-here
"""
    
    # Check if backend/.env exists and preserve existing secrets
    backend_env_path = Path("backend/.env")
    existing_secrets = {}
    
    if backend_env_path.exists():
        print("Found existing backend/.env file. Preserving secret values...")
        with open(backend_env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    if key.strip() in config['required_env_vars']:
                        existing_secrets[key.strip()] = value.strip()
    
    # Add existing secrets to the content
    if existing_secrets:
        env_content += "\n# Preserved from existing .env file\n"
        for key, value in existing_secrets.items():
            env_content += f"{key}={value}\n"
    else:
        # Generate a sample JWT secret key
        sample_jwt_key = generate_secret_key()
        env_content += f"\n# SAMPLE VALUES - REPLACE WITH YOUR OWN\n"
        env_content += f"JWT_SECRET_KEY={sample_jwt_key}\n"
        env_content += "# GEMINI_API_KEY=your-gemini-api-key-here\n"
        env_content += "# ANTHROPIC_API_KEY=your-anthropic-api-key-here\n"
        env_content += "# STRIPE_SECRET_KEY=your-stripe-secret-key-here\n"
        env_content += "# STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret-here\n"
    
    # Write to backend/.env
    backend_env_path.parent.mkdir(exist_ok=True)
    with open(backend_env_path, 'w') as f:
        f.write(env_content)
    
    print(f"Generated backend/.env for {env_name} environment")

def generate_frontend_env(config, env_name="development"):
    """Generate frontend .env file"""
    env_config = config[env_name]
    
    env_content = f"""# Odoo Module Builder v3 - Frontend Environment
# Generated from config.yml - DO NOT EDIT MANUALLY
# Run 'python scripts/generate_env.py' to regenerate

# API Configuration
VITE_API_URL={env_config['frontend']['api_url']}

# Application settings
VITE_APP_NAME="{config['app']['name']}"
VITE_APP_VERSION="{config['app']['version']}"

# REQUIRED: Add these environment variables manually
# VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key-here
"""
    
    # Check if frontend/.env exists and preserve existing secrets
    frontend_env_path = Path("frontend/.env")
    existing_secrets = {}
    
    if frontend_env_path.exists():
        print("Found existing frontend/.env file. Preserving secret values...")
        with open(frontend_env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    if key.strip().startswith('VITE_STRIPE_'):
                        existing_secrets[key.strip()] = value.strip()
    
    # Add existing secrets to the content
    if existing_secrets:
        env_content += "\n# Preserved from existing .env file\n"
        for key, value in existing_secrets.items():
            env_content += f"{key}={value}\n"
    else:
        env_content += "\n# SAMPLE VALUES - REPLACE WITH YOUR OWN\n"
        env_content += "# VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key-here\n"
    
    # Write to frontend/.env
    frontend_env_path.parent.mkdir(exist_ok=True)
    with open(frontend_env_path, 'w') as f:
        f.write(env_content)
    
    print(f"Generated frontend/.env for {env_name} environment")

def main():
    parser = argparse.ArgumentParser(description="Generate .env files from centralized configuration")
    parser.add_argument("--env", choices=["development", "production"], 
                       default="development", help="Environment to generate")
    parser.add_argument("--config", default="config.yml", 
                       help="Path to configuration file")
    
    args = parser.parse_args()
    
    print(f"Generating environment files for {args.env} environment...")
    
    # Load configuration
    config = load_config(args.config)
    
    # Generate environment files
    generate_backend_env(config, args.env)
    generate_frontend_env(config, args.env)
    
    print("\nEnvironment files generated successfully!")
    print("\nNext steps:")
    print("1. Review and update the generated .env files with your actual API keys")
    print("2. Ensure all required environment variables are set")
    print("3. Run the application with the new configuration")
    
    # Check for missing required variables
    print(f"\nRequired environment variables for {args.env}:")
    for var in config['required_env_vars']:
        print(f"  - {var}")

if __name__ == "__main__":
    main() 