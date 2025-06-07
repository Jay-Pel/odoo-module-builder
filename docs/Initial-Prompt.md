# ODOO MODULE BUILDER v3 - PROJECT SPECIFICATION

## ROADMAP

### 1. User Interface Requirements

The UI should provide the following capabilities:

#### a. Specification Generation
- Generate detailed specifications for an Odoo module as requested by the user
- Include the following details:
  - Version
  - Community or enterprise license
  - Author
  - Access rights
  - User stories
  - Testing scenarios
- The specification file must be:
  - Modifiable by the user
  - Approved by the user before proceeding
  - Editable in a text editor
- Display a message informing the user this is their last chance to include requirements
- Consider the module complete according to the approved specification version

#### b. Module Development
- Code the module according to the approved specifications
- Follow Odoo standards and the `development_guidelines.md` file
- Meet all requirements specified in the specification file
- Ensure compatibility with the specified Odoo version and license

#### c. Automated Testing
- Test the module using a testing agent with browser automation (Playwright)
- Verify the module can be installed on an Odoo environment without errors
- Confirm it satisfies all requirements and test scenarios from the specification
- Testing environment requirements:
  - Ephemeral virtual machine using Odoo runbot docker image
  - Deployed on Cloudflare server (cost-effective)
  - Pre-loaded with demo data
  - Accessible without login (like runbot)
- Error reporting process:
  - Testing agent reports errors to coding agent in structured manner
  - Include text descriptions and screenshots
  - Coding agent corrects code and redeploys to test instance
  - Testing agent reinstalls and retests
  - Continue feedback loop until all tests pass

#### d. User Acceptance Testing
- Present the docker instance to user via iframe on the website
- Allow user interaction (click and type) within the iframe
- Restrict navigation to single browser tab only
- User testing process:
  - Maximum 5 adjustment requests allowed
  - Validate adjustments against specifications (no additional features)
  - Coding agent approves/rejects adjustment requests
  - Send approved adjustments to testing agent for bug fixing loop
- Payment and completion:
  - User confirms functional testing acceptance
  - Module cost: $50-100 USD based on complexity (judged by coding agent)
  - User pays before accessing module

### 2. LLM Agent Assignment

#### a. Specification Agent
- **Purpose**: Writing specification documents
- **Model**: Gemini 2.5 Flash

#### b. Coding Agent
- **Purpose**: Coding the module
- **Model**: Claude 4 Sonnet

#### c. Testing Agent
- **Purpose**: Testing the module (traditional testing + Playwright + iframe)
- **Model**: Claude 4 Sonnet

### 3. Monetization Strategy

- Payment required before module download or code access
- User account system mandatory for:
  - Module downloads
  - Payment processing
- Associate each public user session with unique account ID before download

## TECHNICAL REQUIREMENTS

- **Workflow Management**: Python scripts with MCP on CloudFlare
- **Code Organization**: Keep directory clean with only necessary files
- **Quick Testing Mode**: Toggle for pre-generated data up to testing phase
- **User Architecture**: Account system with sessions and saved module projects
- **Payment Integration**: Link payments to user accounts

## TESTING EXAMPLES

### Sample Module Request
**Name**: `sale_product_code`

**Requirements**: 
- Allow different product codes per client for the same product
- Version 18 compatibility
- Add table in product's sale tab for client-specific code configuration
- Manual code input capability
- Display correct code to client on sales orders
- Replicate Odoo enterprise supplier functionality but for clients
- Support multiple product names and codes per client
- Automatic code selection on sales orders based on client

## AGENT PROMPTS

### Specification Agent Prompt
```
You are a senior software architect. You are mandated to write a development specification for an Odoo ERP module which will be completely compatible with the Odoo community and Odoo enterprise version {{ $json.moduleVersion }}

You need to make sure the user can validate all important aspects of the development like:
- User access groups level
- Testing scenarios/user stories
- Configurations
- Workflow modifications
- etc.

Use this requirement from the client to generate the module development specification:
{{ $json.prompt }}

The name of the module will be: {{ $json.moduleName }}
```

### Specification Agent Service Requirements
- **API Service**: Separate service called via API
- **Input**: Requirements, name, and version information from step-by-step questions
- **Output**: Markdown file of module development specification
- **Additional Endpoint**: Handle specification document modification requests
- **User Capabilities**:
  - Visualize specification file
  - Edit manually before approval
  - Request modifications
  - Confirm specification completion
- **Model**: Gemini 2.5 Flash

### Coding Agent Requirements
- **Service Type**: API-based service (similar to specifications agent)
- **Input**: 
  - Approved specifications
  - Coding-agent-context file (backend only, invisible to user)
- **Process**:
  - Create folder named after the module
  - Generate all necessary code files
  - Follow Odoo development standards
  - Ensure compatibility with specified Odoo version
- **Output**: 
  - Complete module folder
  - File tree display to user (without code visibility)
- **Reference**: [16. Development_guidelines]

## FRONTEND INSPIRATION
- **Design Reference**: https://threejs.org/examples/#webgl_points_waves for loadings