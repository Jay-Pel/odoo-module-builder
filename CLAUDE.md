# Odoo Module Builder - Cursor Rules

## Critical Process Management Rules
1. **ALWAYS kill ALL old processes before starting new ones**
   - Check for old processes with: `ps aux | grep -E "(uvicorn|vite|python|node)" | grep -v grep`
   - Kill ALL processes from ANY related projects (OMBv3, Odoo-module-builder-v2, etc.)
   - Wait 3 seconds after killing processes before starting new ones

2. **ALWAYS verify the correct working directory**
   - Backend must run from: `/Users/jeremipelletier/Documents/GitHub/odoo-module-builder/backend`
   - Frontend must run from: `/Users/jeremipelletier/Documents/GitHub/odoo-module-builder/frontend`
   - NEVER use paths from old projects like `/Users/jeremipelletier/Documents/AI/OMBv3/`

3. **ALWAYS use the correct virtual environment**
   - Backend venv: `/Users/jeremipelletier/Documents/GitHub/odoo-module-builder/backend/venv`
   - Activate with: `source backend/venv/bin/activate`
   - NEVER use venv from other projects

## Systematic Problem-Solving Rules
4. **When identifying a problem, FIX IT IMMEDIATELY before moving on**
   - Don't just identify and mention - take action
   - Don't claim "everything is working" without testing

5. **ALWAYS test the actual functionality, not just server startup**
   - Test health endpoints: `curl http://localhost:8000/health`
   - Test actual API endpoints that were failing
   - Check browser access to frontend

6. **Follow this exact startup sequence:**
   1. Kill all old processes
   2. Navigate to correct directories
   3. Activate correct virtual environment
   4. Install missing dependencies if any
   5. Start backend: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
   6. Start frontend: `npm run dev`
   7. Test both servers are accessible
   8. Test the specific functionality that was failing

## AI Model Configuration Rules
7. **ALWAYS use the exact model names specified in user rules:**
   - Claude: `claude-sonnet-4-20250514` (NOT claude-3-5-sonnet-latest)
   - Gemini: Use web search to verify the correct 2.5 Pro API name

8. **NEVER arbitrarily change model versions**
   - Check user rules before any model configuration
   - Use web search to verify current API model names

## Dependency Management Rules
9. **ALWAYS check and install ALL missing dependencies**
   - Backend: Check requirements.txt and install any missing packages
   - Frontend: Check package.json and install any missing packages
   - Don't assume dependencies are installed

10. **Environment File Rules**
    - NEVER remove anything from .env files without explicit user permission
    - Always regenerate .env files after config changes
    - Verify API keys are present and correctly formatted

## Testing and Verification Rules
11. **ALWAYS verify claims with actual tests**
    - Don't say "working perfectly" without testing
    - Test the specific endpoints/features that were failing
    - Show actual curl/browser test results

12. **When fixing frontend issues:**
    - Install missing packages: `npm install <package>`
    - Check tailwind.config.js for required plugins
    - Restart dev server after installing packages

## Error Handling Rules
13. **For 500 errors, ALWAYS:**
    - Check backend logs for actual error messages
    - Identify the root cause (missing imports, wrong models, etc.)
    - Fix the root cause, not just symptoms

14. **For import errors:**
    - Install the missing package immediately
    - Verify it's in the correct virtual environment
    - Don't continue until import errors are resolved

## Communication Rules
15. **Be honest about issues:**
    - Don't claim success without verification
    - Admit when something isn't working
    - Focus on solving problems, not optimistic reporting

16. **Take immediate action:**
    - Fix problems as soon as they're identified
    - Don't ask for permission for obvious fixes
    - Follow through completely on each issue

These rules ensure systematic problem-solving and prevent the frustrating issues that occurred where old processes interfered with the application. 