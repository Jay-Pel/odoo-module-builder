# N8N Workflows for Odoo Module Builder

This document details the n8n workflows used in the Odoo Module Builder application. These workflows are responsible for handling various aspects of the module building process, from specification generation to testing.

## Workflow Overview

The Odoo Module Builder uses four primary n8n workflows:

1. **Specification Agent Workflow** - Generates module specifications based on user requirements
2. **Coding Agent Workflow** - Converts specifications into actual Odoo module code
3. **Testing Agent Workflow** - Performs automated tests on the generated modules
4. **User Testing Workflow** - Executes user-defined test scenarios on running Odoo instances

These workflows work together sequentially to create a complete Odoo module development pipeline.

## Individual Workflows

### 1. Specification Agent Workflow

**File**: `specification-agent.json`

**Purpose**: Generate detailed Odoo module specifications based on user requirements.

**Workflow Endpoints**:
- `/webhook/specification-agent` - Generates a new specification
- `/webhook/specification-feedback` - Processes user feedback on a specification

**Process Flow**:
1. The workflow receives a webhook call with user requirements.
2. It prepares a context and prompt for the LLM. The context has to contain the version of Odoo for which the module has to be coded.
3. The LLM (Gemini 2.5) generates a structured specification document containing the purpose of the module, the fields, menus, relations, user stories, access rights, etc, just as a senior business analyst would write it.
4. The specification is formatted in html and returned to the application
5. User feedback is processed through a separate endpoint, the specification is modified according to the feedback, and then returned again to the application. This cycle can be done as many times as required by the user of the application.
6. If the specification is approved, it can trigger the Coding Agent workflow

**Inputs**:
- User requirements
- Module name
- Module version

**Outputs**:
- Specification ID
- Detailed module specification (Markdown)
- Status and metadata

### 2. Coding Agent Workflow

**File**: `coding-agent.json`

**Purpose**: Generate Odoo module code based on approved specifications.

**Workflow Endpoints**:
- `/webhook/coding-agent` - Generates module code
- `/webhook/coding-status` - Checks the status of a code generation process

**Process Flow**:
1. The workflow receives a webhook call with an approved specification
2. It analyzes the specification to understand required components
3. The LLM (Claude 3.7 Sonnet) generates code for models, views, security, and other components
4. Files are organized into the proper Odoo module structure
5. The completed module code is returned to the application
6. Status checks can be performed through the status endpoint

**Inputs**:
- Approved specification
- Development plan ID
- Module name and version

**Outputs**:
- Generated code files
- Module structure
- Status and progress updates

### 3. Testing Agent Workflow

**File**: `testing-agent-rewrote.json`

**Purpose**: Perform automated tests on generated Odoo modules to verify functionality and find errors.

**Workflow Endpoint**:
- `/webhook/testing-agent` - Runs automated tests on a module

**Process Flow**:
1. The workflow receives a webhook call with the path to a generated module
2. It sets up a test environment for the module. The test environment needs to be a full installation of the right version of odoo, and the right licence (enterprise or community).
3. Backend tests are executed to verify model functionality
4. Frontend tests check view rendering and UI components, using an LLM and a headless browser.
5. Any errors are identified and documented
6. The workflow attempts to fix common issues automatically using claude 3.7 sonnet thinking.
7. Once all tests are passed or once the final threshold of tokens is reached, the module is returned to the application. There needs to be an explanation if the functionnality had to be modified to fit the tests requirements.

**Inputs**:
- Module path
- Generation ID

**Outputs**:
- Test results (passed/failed)
- Identified errors
- Applied fixes
- Updated module files (if fixes were applied)

### 4. User Testing Workflow

**File**: `user-testing.json`

**Purpose**: Execute user-defined test scenarios on running Odoo instances with the generated module.

**Workflow Endpoint**:
- `/webhook/user-testing` - Runs user-defined test scenarios

**Process Flow**:
1. The workflow receives a webhook call which will generate a url for an iframe which will be displayed in the application.
2. The iframe needs to display the home page of odoo, already connected as an admin user. The user of the app will then be able to click and navigate the odoo instance which have the custom module already installed. The users need to be able to do all the tests they want.
3. The user will have a feedback multi-line text box under the iframe in the app, to explain problems or corrections they noticed during their tests. They should also be able to input images.
4. The feedback will then be sent to the coding agent workflow. It needs to be analysed by the agent to make sure the request still fits the original requirements. No additionnal feature will be accepted at this step.
5. The agent will then generate a new module version and deploy it to the odoo instance, then send a signal to the app to refresh the iframe.


**Inputs**:
- Odoo container URL
- Test scenario (steps to execute)
- Generation ID

**Outputs**:
- Step-by-step results
- Screenshots
- Identified errors
- Overall test status

## Sequential Workflow Process

The n8n workflows form a sequential pipeline for Odoo module development:

1. **Requirements to Specification**:
   - User provides requirements
   - Specification Agent generates a detailed specification
   - User reviews and provides feedback on the specification
   - User approves the final specification
   
2. **Specification to Code**:
   - Approved specification is sent to the Coding Agent
   - Coding Agent generates all necessary module files
   - The generated module code is stored for testing
   
3. **Code to Verification**:
   - Generated module is sent to the Testing Agent
   - Automated tests verify functionality and identify issues
   - Fixes are applied when possible
   - Final validated module is prepared for deployment
   
4. **Deployment to User Testing**:
   - Module is deployed to a Docker container running Odoo
   - User manually tests the module using the iframe in the app
   - User provides feedback on the module
   - Feedback is sent to the Coding Agent
   - Coding Agent generates a new module version and deploys it to the odoo instance, then sends a signal to the app to refresh the iframe.
   - The process can be repeated as many times as required.

## Integration Points

The n8n workflows integrate with the Odoo Module Builder application through:

1. **N8nService** - A service class that handles communication with the workflows
2. **Environment Variables** - Configuration for connecting to the n8n server
3. **Fallback Mechanisms** - Direct implementation methods if workflows are unavailable

## Customizing Workflows

To modify these workflows:

1. Access the n8n editor interface
2. Import the workflow JSON files
3. Make necessary changes to nodes, connections, or processing logic
4. Save and deploy the updated workflows
5. Ensure webhook endpoints remain consistent with the application expectations

## Error Handling

All workflows include error handling mechanisms:

1. Input validation to ensure required parameters are provided
2. Try-catch blocks to handle processing errors
3. Fallback options for LLM or external service failures
4. Detailed error reporting for debugging

---

This documentation provides a high-level overview of the n8n workflows. Each workflow JSON file contains detailed configuration that can be viewed and modified in the n8n editor.
