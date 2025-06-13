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
   5. Start backend: `uvicorn main:app --reload --host 0.0.0.0 --port 8000 > server.log 2>&1 &`
   - If server doesn't respond, check logs: `cat server.log`
   - Wait 3-5 seconds for startup before testing endpoints
   6. Start frontend: `npm run dev`
   7. Test both servers are accessible
   8. **MANDATORY: Test authentication system**
      - Test login: `curl -X POST http://localhost:8000/auth/login -H "Content-Type: application/json" -d '{"email":"demo@example.com","password":"demo123"}'`
      - Should return JWT token, not error
      - If fails, check API URL and reset demo password hash
   9. Test the specific functionality that was failing

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

## Authentication & Login Rules
15. **ALWAYS verify authentication system after restart:**
    - Check API URL configuration: `cat frontend/.env | grep VITE_API_URL`
    - Must be: `VITE_API_URL=http://localhost:8000` (NOT 8001)
    - Test auth endpoints: `curl -X POST http://localhost:8000/auth/login -H "Content-Type: application/json" -d '{"email":"demo@example.com","password":"demo123"}'`
    - Should return JWT token, not "Incorrect email or password"

16. **Demo user credentials must be working:**
    - Email: `demo@example.com`
    - Password: `demo123`
    - If login fails, reset password hash: 
      ```bash
      python3 -c "from passlib.context import CryptContext; pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto'); print(pwd_context.hash('demo123'))"
      sqlite3 local_dev.db "UPDATE users SET hashed_password = 'NEW_HASH' WHERE email = 'demo@example.com';"
      ```

17. **Authentication troubleshooting sequence after restart:**
    1. **FIRST: Check database initialization**
       - Database auto-initializes on first connection via DatabaseService.__init__()
       - Check if demo user exists: `sqlite3 backend/local_dev.db "SELECT email FROM users WHERE email = 'demo@example.com';"`
       - If empty, database was reinitialized and demo user is missing
    
    2. **Test backend auth directly:**
       - `curl -X POST http://localhost:8000/auth/login -H "Content-Type: application/json" -d '{"email":"demo@example.com","password":"demo123"}'`
       - Should return JWT token, not error
    
    3. **Common restart issues and fixes:**
       - **"Could not validate credentials"** → API URL mismatch (check frontend/.env VITE_API_URL)
       - **"Incorrect email or password"** → Demo user password hash corrupted/wrong
       - **"User not found"** → Database reinitialized, need to recreate demo user
       - **Connection refused** → Backend not running or wrong port
    
    4. **Fix database/user issues:**
       ```bash
       # Create demo user if missing
       python3 -c "
       from services.database import DatabaseService
       import bcrypt, asyncio
       async def create_demo():
           db = DatabaseService()
           hash = bcrypt.hashpw('demo123'.encode(), bcrypt.gensalt()).decode()
           await db.create_user('demo-user-id', 'demo@example.com', hash)
           print('Demo user created')
       asyncio.run(create_demo())
       "
       
       # Or reset existing password
       python3 -c "
       import sqlite3, bcrypt
       hash = bcrypt.hashpw('demo123'.encode(), bcrypt.gensalt()).decode()
       conn = sqlite3.connect('backend/local_dev.db')
       conn.execute('UPDATE users SET hashed_password = ? WHERE email = ?', (hash, 'demo@example.com'))
       conn.commit()
       conn.close()
       print('Password reset')
       "
       ```
    
    5. **Always verify after fixing:**
       - Test login endpoint again
       - Check frontend can connect to backend
       - Test actual UI login flow

18. **Database state verification and auto-recovery:**
    - **Check database exists and has data:**
      ```bash
      ls -la backend/local_dev.db  # Should be >4KB, not 0 bytes
      sqlite3 backend/local_dev.db "SELECT count(*) FROM users;"  # Should be >0
      sqlite3 backend/local_dev.db "SELECT email FROM users LIMIT 5;"
      ```
    
    - **Verify demo user specifically:**
      ```bash
      sqlite3 backend/local_dev.db "SELECT email, hashed_password FROM users WHERE email = 'demo@example.com';"
      # Should return demo@example.com with valid bcrypt hash
      ```
    
    - **Auto-recovery for empty database:**
      ```bash
      # DatabaseService automatically initializes schema on first connection
      # But demo user must be manually created
      python3 -c "
      from services.database import DatabaseService
      import bcrypt, asyncio
      async def setup():
          db = DatabaseService()
          # Database schema auto-created
          # Create demo user
          hash = bcrypt.hashpw('demo123'.encode(), bcrypt.gensalt()).decode()
          success = await db.create_user('demo-user-id', 'demo@example.com', hash)
          print(f'Demo user created: {success}')
          # Create demo project
          await db.create_project('demo-proj-id', 'demo-user-id', 'Demo Project', 17, 'Test project')
          print('Demo project created')
      asyncio.run(setup())
      "
      ```

19. **Server startup troubleshooting:**
    - If uvicorn process exists but endpoints don't respond: `ps aux | grep uvicorn`
    - Always check server logs first: `cat backend/server.log`
    - Server needs 3-5 seconds to fully start up
    - Kill hung processes: `kill -9 <PID>` before restarting

## Authentication Recovery Checklist (Post-Restart)
20. **Systematic authentication verification:**
    - [ ] Database file exists and has content (`ls -la backend/local_dev.db`)
    - [ ] Demo user exists (`sqlite3 backend/local_dev.db "SELECT email FROM users WHERE email = 'demo@example.com';"`)
    - [ ] API URL correct in frontend/.env (`VITE_API_URL=http://localhost:8000`)
    - [ ] Backend responds (`curl http://localhost:8000/health`)
    - [ ] Auth endpoint works (`curl -X POST http://localhost:8000/auth/login -H "Content-Type: application/json" -d '{"email":"demo@example.com","password":"demo123"}'`)
    - [ ] Frontend can login through UI

21. **Root cause patterns:**
    - **Most common**: Database reinitialized, demo user missing
    - **Second most**: API URL mismatch (8001 vs 8000)
    - **Third most**: Password hash corruption
    - **Solution**: Always run database setup script after confirming restart

## Communication Rules
22. **Be honest about issues:**
    - Don't claim success without verification
    - Admit when something isn't working
    - Focus on solving problems, not optimistic reporting

23. **Take immediate action:**
    - Fix problems as soon as they're identified
    - Don't ask for permission for obvious fixes
    - Follow through completely on each issue

These rules ensure systematic problem-solving and prevent the frustrating issues that occurred where old processes interfered with the application AND the recurring authentication failures that happen on every restart. The key insight is that database auto-initialization creates schema but NOT demo data, which must be recreated manually. 