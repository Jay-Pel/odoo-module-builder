# n8n Implementation for Odoo Module Builder

This directory contains all the necessary configurations and workflows to implement the backend of the Odoo Module Builder application using n8n as described in the backend plan.

## Overview

The implementation provides a complete workflow orchestration system using n8n to power the agent-based module generation, testing, and user acceptance features of the Odoo Module Builder application. It's designed to scale with multiple users and provides isolated testing environments for each session.

## Directory Structure

```
deployment/n8n/
├── configs/           # Configuration files
│   ├── deployment.conf       # AWS and deployment configuration
│   ├── n8n.env              # n8n environment variables
│   └── nginx-n8n.conf       # Nginx configuration for n8n
├── scripts/           # Setup and installation scripts
│   ├── install-dependencies.sh  # Installs all required software
│   └── setup-n8n.sh            # Configures n8n and services
├── workflows/         # n8n workflow definitions
│   ├── specification-agent.json  # Specification generation workflow
│   ├── coding-agent.json        # Module code generation workflow
│   ├── testing-agent.json       # Automated testing workflow
│   └── user-testing.json        # User acceptance testing workflow
└── deploy.sh          # Main deployment script for AWS Lightsail
```

## Implementation Details

### 1. AWS Lightsail Setup

The implementation uses AWS Lightsail to host:
- A dedicated n8n instance for workflow orchestration
- Multiple Odoo Docker hosts for testing and user acceptance

The deployment is designed with concurrency in mind, supporting multiple simultaneous users running tests in isolated environments.

### 2. n8n Workflow Engine

n8n is configured in queue mode with Redis to support parallel workflow execution, which is critical for handling concurrent user requests. The implementation includes:

- Security hardening with SSL and basic authentication
- PostgreSQL database for persistent workflow state
- Multiple worker processes for load distribution
- Automatic backup procedures

### 3. Agent Workflows

#### 3.1 Specification Agent

- Receives user requirements through HTTP webhook
- Uses an LLM to generate a structured module specification
- Supports user feedback and modification loop
- Triggers the Coding Agent when specification is approved

#### 3.2 Coding Agent

- Generates complete Odoo module code based on approved specifications
- Produces all necessary files (Python, XML, CSV) with proper structure
- Packages the module for installation
- Handles feedback loops for code improvements
- Triggers automated testing when code is ready

#### 3.3 Testing Agent

- Manages isolated Docker containers for testing
- Automatically installs and tests the generated module
- Uses MCP server for UI and functionality testing
- Provides detailed feedback on test failures
- Triggers user acceptance testing upon success

#### 3.4 User Testing & Delivery

- Creates dedicated Odoo instances for user acceptance testing
- Provides iframe integration for the frontend
- Manages the user feedback and approval process
- Prepares the final module for download upon approval
- Handles resource cleanup after testing

## Docker Integration

The implementation includes full Docker integration for:
- Running isolated Odoo test environments for each user session
- Automatically installing and testing modules
- Providing user acceptance environments
- Resource cleanup when testing is complete

## Security Considerations

- Isolated containers for each test session
- Secure credential management
- HTTPS throughout with proper SSL certificates
- Firewall configuration
- Access controls for n8n and Odoo instances

## Deployment Instructions

1. Edit configuration files in the `configs` directory, particularly:
   - Set your AWS region and credentials
   - Configure domain names if using custom domains
   - Set secure passwords for all services

2. Run the deployment script:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. After deployment, access n8n at:
   - http://your-instance-ip:5678 or
   - https://your-domain (if configured)

4. Import the workflows manually if they weren't imported automatically

## Monitoring and Maintenance

- n8n is configured to use PM2 for monitoring
- Logs are available in the standard systemd journal
- Automated backups run daily at 2 AM

## Scaling Considerations

The implementation includes considerations for scaling:
- n8n queue mode for workflow distribution
- Docker host pool management
- Concurrent test execution

For higher scale deployment, consider:
- Moving to AWS ECS/EKS for container orchestration
- Implementing a more sophisticated Docker host pool manager
- Setting up proper load balancing for n8n workers

## Integration with Frontend

The frontend should communicate with n8n endpoints:
- `/specification-agent` - For submitting requirements
- `/specification-feedback` - For approving or modifying specifications
- `/coding-feedback` - For providing feedback on generated code
- `/user-acceptance-result` - For approving or rejecting the final module

Each request must include a unique `sessionId` to maintain state throughout the process.
