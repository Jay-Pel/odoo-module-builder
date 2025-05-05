# Odoo Module Builder - Backend Implementation Plan

This document outlines the plan for implementing the backend architecture for the Odoo Module Builder application, leveraging n8n for agent workflows, Model Context Protocol (MCP) servers for automated testing, and AWS Lightsail for hosting. **This plan considers the need for concurrency and scalability to support multiple simultaneous users.**

## 1. Hosting Environment Setup (AWS Lightsail)

1.  **Provision Lightsail Instances:**
    *   Set up a dedicated Lightsail instance for running the main n8n process. Consider instance size based on anticipated concurrent workflow load.
    *   Set up **multiple** Lightsail instances (or a potentially auto-scaling group if using a different AWS service later) capable of running Docker. These will form a pool of hosts for running isolated, temporary Odoo environments for testing and user acceptance.
    *   Determine hosting for the main application frontend/backend (potentially scalable instances or container services like ECS/EKS if migrating from Lightsail later for higher scalability).
2.  **Install Dependencies:**
    *   Install Docker and Docker Compose on all designated Odoo/testing host instances.
    *   Install Node.js on the n8n instance.
3.  **Networking & Security:**
    *   Configure Lightsail firewalls and potentially a Load Balancer (if using multiple Docker hosts) to route traffic correctly (HTTP/S for UI, n8n webhooks, Odoo instances, MCP server communication).
    *   Secure access to instances (SSH keys, security groups).
    *   Set up DNS records.
4.  **Resource Management:**
    *   Implement a mechanism (e.g., within the backend API or a dedicated service) to manage the pool of Docker hosts, assigning test/acceptance containers to available hosts to distribute load.

## 2. n8n Setup & Configuration

1.  **Install n8n:** Install n8n on its dedicated Lightsail instance.
2.  **Configure n8n for Concurrency:**
    *   **Crucially, configure n8n to run in `queue` mode.** This utilizes a message queue (like Redis, required setup) and allows multiple worker processes to execute workflows in parallel, essential for handling concurrent user requests. Refer to n8n documentation on scaling and queue mode.
    *   Potentially run multiple n8n worker processes/instances depending on load.
    *   Set up admin user/password.
    *   Configure necessary credentials securely (LLM API keys, AWS credentials, etc.).
    *   Secure the n8n instance (e.g., basic auth, HTTPS).

## 3. Agent Implementation (n8n Workflows) - Concurrency Considerations

Develop distinct n8n workflows for each agent's responsibilities. **Ensure each workflow execution is independent and stateless where possible, relying on unique identifiers passed in the trigger (e.g., `userId`, `sessionId`, `moduleId`).**

### 3.1. Specification Agent Workflow

*   **Trigger:** HTTP Request node triggered by the frontend UI (includes unique session/user identifier).
*   **Input:** Raw user request details + unique ID.
*   **Processing:**
    *   Use an LLM node.
    *   Format the output as a modifiable specification document.
*   **Storage:** Store the specification draft **keyed by the unique ID** (e.g., database record with `sessionId`, S3 object name including ID `specs/<sessionId>/spec_v1.md`).
*   **User Modification & Approval Loop:**
    *   Return draft to frontend.
    *   Webhook endpoint receives modified spec + unique ID.
    *   User approves via UI action -> triggers webhook with unique ID.
    *   Store final approved specification **keyed by the unique ID**.
    *   Trigger the Coding Agent workflow, passing the unique ID and reference to the approved specification.

### 3.2. Coding Agent Workflow

*   **Trigger:** Webhook or n8n sub-workflow call (includes unique ID).
*   **Input:** Final, approved specification document reference (retrieved using unique ID).
*   **Processing:**
    *   Use an LLM node.
    *   Generate Odoo module code.
*   **Output:** Generate the complete module file structure and code.
*   **Storage:** Package and store the generated code **keyed by the unique ID** (e.g., `s3://bucket/modules/<sessionId>/version_1.zip`).
*   **Trigger Testing:** Initiate the Testing Agent workflow, passing the unique ID and reference to the code package.
*   **Feedback Loop Integration:**
    *   Webhook endpoint receives feedback + unique ID.
    *   **If feedback:** Retrieve context using ID, re-run LLM, store new code version (`.../version_2.zip`), re-trigger Testing Agent with unique ID and new version reference.
    *   **If no feedback:** Trigger User Testing workflow with unique ID.

### 3.3. Testing Agent Workflow

*   **Trigger:** Webhook or n8n sub-workflow call (includes unique ID).
*   **Input:** Reference to the module code version to test (retrieved using unique ID). Specification reference (using unique ID).
*   **Environment Setup (Isolated & Concurrent):**
    *   Request a Docker host from the pool manager.
    *   Spin up a **new, isolated Docker container** on the assigned host, potentially using unique container names/ports derived from the session ID (`odoo-test-<sessionId>`).
    *   Copy/mount the specific module code version into the container.
*   **Module Installation:** Execute install command within the isolated container.
*   **Automated UI & Logic Testing (Concurrent MCP):**
    *   **MCP Server Strategy:**
        *   Option A (Simpler): Run a single Playwright MCP Server instance. Ensure it can handle concurrent browser sessions controlled via Playwright's BrowserContexts. This might become a bottleneck.
        *   Option B (More Scalable): Run multiple instances of the MCP Server, perhaps one per Docker host or managed dynamically. n8n would need logic to select an available MCP server instance.
        *   Option C (Integrated): Explore if the MCP server can be launched *dynamically within* the n8n workflow or alongside the Odoo container specifically for that test run (more complex setup).
    *   **Execute Scenarios:** Use HTTP Request node targeting the appropriate MCP server instance. All interactions (navigation, clicks, logs) are scoped to the specific browser context associated with this test session.
*   **Feedback Generation & Reporting:**
    *   Aggregate results specific to this session ID.
    *   **If Failure:** Send feedback report + unique ID back to Coding Agent webhook.
    *   **If Success:** Send success signal + unique ID to trigger User Acceptance.
*   **Cleanup:** Shut down and remove the specific Docker container (`odoo-test-<sessionId>`) and release the Docker host back to the pool.

## 4. User Testing & Delivery Workflow

*   **Trigger:** Success signal + unique ID from the Testing Agent.
*   **Environment Setup (Isolated):**
    *   Request a Docker host from the pool manager.
    *   Spin up a *new*, clean, **isolated** Dockerized Odoo instance dedicated to this user's session (`odoo-accept-<userId>-<sessionId>`).
    *   Install the final, tested module version.
*   **Frontend Integration & Iframe Display:**
    *   Provide the unique URL/port of this dedicated Odoo instance back to the backend API (associated with the user/session ID).
    *   Backend relays URL to the correct user's frontend.
    *   Frontend displays the instance in the sandboxed `<iframe>`.
    *   Apply strict sandboxing attributes and potentially proxy rules.
*   **User Acceptance:** User interacts via iframe. UI actions (Approve/Reject) send results + unique ID to backend API.
*   **Cleanup:** Automatically shut down and remove the dedicated Odoo instance (`odoo-accept-...`) after policy timeout or user action.

## 5. Monetization & User Accounts

Integrate these steps primarily into the backend API. **Ensure database operations (user lookup, payment status updates) are atomic and handle concurrent requests safely.**

1.  **User Authentication:** Standard practices, ensure session management scales.
2.  **Payment Integration:** Stripe handles concurrency well. Ensure backend webhook handler can process multiple concurrent payment confirmations correctly, associating them with the right user ID.
3.  **Access Control & Download:** S3 provides scalable storage. Ensure download link generation is tied to the specific authenticated user and their paid module ID.

## 6. Technology Stack Summary - Scalability Notes

*   **Cloud Hosting:** AWS Lightsail (Consider upgrade paths like ECS/EKS/Fargate for higher Docker host scalability if needed).
*   **Orchestration:** n8n (**Queue Mode is essential**).
*   **Containerization:** Docker, Docker Compose.
*   **Testing Automation:** MCP Server (Consider multi-instance or context-based concurrency).
*   **AI:** LLM APIs (Managed services, generally scalable).
*   **Database:** (Choose scalable options like PostgreSQL on RDS, DynamoDB. Ensure proper indexing for queries based on session/user IDs).
*   **Storage:** AWS S3 (Highly scalable).
*   **Authentication:** Dedicated service (Generally scalable).
*   **Payment:** Payment Gateway (Stripe - Scalable).
*   **Queue (for n8n):** Redis (Consider managed Redis like ElastiCache).
*   **(Optional) Load Balancer:** AWS ELB (if using multiple Docker hosts or n8n workers).
*   **(Optional) Pool Manager:** Custom logic in backend API or dedicated microservice to manage Docker host allocation.

## 7. Key Integration Points - Concurrency Notes

*   All interactions involving state must use unique identifiers (session/user/module IDs) to ensure correct context.
*   Backend API needs to handle concurrent requests from multiple users.
*   n8n workflows rely on queue mode for parallel execution.
*   Docker host management needs to distribute load.
*   MCP server interaction needs a concurrent strategy.

## 8. Security Considerations - Concurrency Notes

*   Ensure strict isolation between user data and processes (containers, storage paths, database records).
*   Prevent race conditions in state management and resource allocation.
*   Rate limiting might be necessary for API endpoints and LLM calls to prevent abuse and manage costs.

## 9. Concurrency & Scalability Strategy Summary

*   **n8n:** Use `queue` mode with multiple workers backed by Redis.
*   **Workflows:** Design workflows to be stateless where possible, using unique IDs passed via triggers.
*   **State Management:** Use unique IDs (session, user, module) to key all stored data (specs, code, database records).
*   **Testing/Acceptance Environments:** Use a pool of Docker hosts, dynamically provisioning isolated containers per session.
*   **MCP Server:** Implement a strategy for concurrent test execution (BrowserContexts, multiple instances, or dynamic launch).
*   **Database/Storage:** Choose scalable cloud services (S3, RDS/DynamoDB) and use appropriate indexing.
*   **Resource Management:** Implement logic to manage Docker host allocation and potentially MCP server instances.
