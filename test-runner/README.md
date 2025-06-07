# OMB Test Runner Service

The Test Runner service provides automated testing capabilities for Odoo modules using Docker and Playwright.

## Features

- **Docker Environment Management**: Automated setup of Odoo and PostgreSQL containers
- **AI Test Generation**: Uses Claude 3.5 Sonnet to generate comprehensive Playwright test scripts
- **Module Installation Testing**: Validates module installation in clean Odoo environments
- **UI Automation**: Playwright-based testing for user interface validation
- **Results Processing**: Detailed test reports with screenshots and traces

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Main OMB API  │───▶│  Test Runner    │───▶│  Docker Engine  │
│                 │    │   Service       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Anthropic     │    │ Odoo + PostgreSQL│
                       │   Claude API    │    │   Containers    │
                       └─────────────────┘    └─────────────────┘
```

## Setup

### Prerequisites

- Docker and Docker Compose
- Python 3.11+
- Anthropic API key

### Installation

1. **Clone and navigate to test-runner directory**
   ```bash
   cd test-runner
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Playwright browsers**
   ```bash
   playwright install chromium
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start the service**
   ```bash
   # Development
   uvicorn main:app --host 0.0.0.0 --port 8001 --reload
   
   # Production with Docker Compose
   docker-compose up -d
   ```

## API Endpoints

### Health Check
```
GET /health
```

### Start Testing
```
POST /test/start
Content-Type: application/json

{
  "project_id": "string",
  "module_url": "string",
  "module_name": "string", 
  "module_code": {},
  "specification": "string",
  "odoo_version": 17,
  "quick_mode": false
}
```

### Get Test Status
```
GET /test/status/{session_id}
```

### Get Test Results
```
GET /test/results/{session_id}
```

### Stop Testing
```
POST /test/stop/{session_id}
```

## Testing Workflow

1. **Environment Preparation**
   - Download module ZIP from provided URL
   - Start PostgreSQL container
   - Start Odoo container with module mounted
   - Wait for services to be ready

2. **Module Installation**
   - Install module in Odoo using CLI
   - Capture installation logs
   - Validate successful installation

3. **Test Generation**
   - Analyze module code and specification
   - Generate Playwright test script using Claude AI
   - Create pytest configuration and fixtures

4. **Test Execution**
   - Run Playwright tests against Odoo instance
   - Capture screenshots and traces on failures
   - Generate detailed test reports

5. **Cleanup**
   - Stop and remove Docker containers
   - Clean up temporary files
   - Upload results to main API

## Configuration

### Environment Variables

- `ANTHROPIC_API_KEY`: Required for AI test generation
- `DOCKER_HOST`: Docker daemon socket path
- `TEST_EXECUTION_TIMEOUT`: Maximum test execution time (seconds)
- `ARTIFACTS_PATH`: Directory for test artifacts storage

### Docker Configuration

The service requires access to the Docker daemon to create isolated testing environments. Ensure the Docker socket is properly mounted when running in containers.

### Security Considerations

- The service requires Docker access - run in isolated environments
- Module code is temporarily stored during testing
- Test artifacts may contain sensitive information
- Implement proper network isolation for test containers

## Monitoring

The service provides health checks and logging for monitoring:

- Health endpoint: `GET /health`
- Structured logging with configurable levels
- Docker container lifecycle tracking
- Test session metrics

## Troubleshooting

### Common Issues

1. **Docker connection failed**
   - Verify Docker daemon is running
   - Check Docker socket permissions
   - Ensure proper volume mounting in containers

2. **Module installation failed**
   - Check module ZIP format and structure
   - Verify Odoo version compatibility
   - Review installation logs in test results

3. **Test generation failed**
   - Verify Anthropic API key is valid
   - Check module code format and completeness
   - Review specification content

4. **Playwright tests failed**
   - Check browser installation
   - Verify Odoo instance accessibility
   - Review test script syntax and logic

### Logs

Service logs are available through standard output and can be configured for different levels:

```bash
# View logs in Docker Compose
docker-compose logs -f test-runner

# View logs in development
tail -f test-runner.log
```

## Development

### Running Tests

```bash
# Unit tests
pytest tests/

# Integration tests (requires Docker)
pytest tests/integration/

# Load testing
k6 run tests/load/test-runner-load.js
```

### Code Structure

```
test-runner/
├── main.py              # FastAPI application
├── models/
│   └── schemas.py       # Pydantic models
├── services/
│   ├── docker_manager.py    # Docker container management
│   ├── test_executor.py     # Playwright test execution
│   └── test_generator.py    # AI test generation
├── tests/               # Test suite
├── requirements.txt     # Python dependencies
├── Dockerfile          # Container configuration
└── docker-compose.yml  # Service orchestration
```

## Contributing

1. Follow Python PEP 8 style guidelines
2. Add tests for new functionality
3. Update documentation for API changes
4. Ensure Docker compatibility
5. Test with multiple Odoo versions 