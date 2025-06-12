# Odoo Module Builder - Development Setup Guide

## Prerequisites & Setup Requirements

### 1. System Requirements
- **Python 3.10+** (for backend)
- **Node.js 18+** (for frontend)
- **Git** (for version control)

### 2. Required API Keys & Accounts

#### 2.1 AI/LLM API Keys (CRITICAL - App won't work without these)
The application uses multiple AI services for different functions:

**Anthropic Claude API** (Primary - for code generation):
- Sign up at: https://console.anthropic.com/
- Create API key in dashboard
- Required for: Module code generation (CodingAgent)
- Cost: ~$0.03-0.15 per request depending on complexity

**Google Gemini API** (Secondary - for specifications):
- Sign up at: https://makersuite.google.com/app/apikey
- Create API key (free tier available)
- Required for: Specification generation (SpecificationAgent)
- Cost: Free tier available, then usage-based

#### 2.2 Payment Processing (Optional for testing)
**Stripe API**:
- Sign up at: https://stripe.com/
- Get test keys from dashboard
- Required for: Payment processing for module downloads
- Can use test mode for development

### 3. Environment Configuration

#### 3.1 Backend Environment Setup
1. Copy environment template:
   ```bash
   cp backend/env.example backend/.env
   ```

2. Fill in your API keys in `backend/.env`:
   ```env
   # JWT Configuration
   JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production-use-long-random-string

   # Database Configuration
   DATABASE_PATH=./local_dev.db

   # AI API Keys (REQUIRED)
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ANTHROPIC_API_KEY=your_actual_anthropic_api_key_here

   # Stripe Configuration (Optional for development)
   STRIPE_SECRET_KEY=sk_test_your_stripe_test_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here

   # Development Mode
   ENVIRONMENT=development

   # CORS Origins
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

#### 3.2 Frontend Environment Setup
1. Copy environment template:
   ```bash
   cp frontend/env.example frontend/.env
   ```

2. Configure frontend environment variables if needed.

### 4. Installation & Startup

#### 4.1 Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 4.2 Frontend Setup
```bash
# Navigate to frontend directory (in new terminal)
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

#### 4.3 Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### 5. Common Issues & Solutions

#### 5.1 Code Generation Fails (500 Error)
**Symptoms**: "Failed to start code generation" error in UI
**Causes & Solutions**:
- ❌ Missing `ANTHROPIC_API_KEY` → Add valid Anthropic API key to `.env`
- ❌ Invalid API key → Verify key is correct and has sufficient credits
- ❌ Missing `anthropic` package → Run `pip install anthropic` in backend venv
- ❌ Network connectivity → Check firewall/proxy settings

#### 5.2 Specification Generation Fails
**Symptoms**: Specification generation gets stuck or fails
**Causes & Solutions**:
- ❌ Missing `GEMINI_API_KEY` → Add valid Google Gemini API key to `.env`
- ❌ API quota exceeded → Check Google AI Studio quota limits
- ❌ Invalid prompt → Verify specification requirements are clear

#### 5.3 Authentication Issues
**Symptoms**: "Not authenticated" errors
**Causes & Solutions**:
- ❌ Missing `JWT_SECRET_KEY` → Add a secure random string to `.env`
- ❌ Token expired → Clear browser storage and login again

#### 5.4 Database Issues
**Symptoms**: Database connection errors
**Causes & Solutions**:
- ❌ Missing database file → Will be created automatically on first run
- ❌ Permission issues → Ensure write permissions in backend directory

### 6. Development Workflow

#### 6.1 Format & Planning
1. **Format prompt** - Structure development requirements clearly
2. **Taskmaster plan by Claude 4** - Segment tasks by sprints, formulate user stories and epics
3. **Task refinement by Gemini** - Refine and detail the planned tasks
4. **Step-by-step execution by Claude** - Implement features systematically

#### 6.2 AI Agent Prompt Customization
The application uses customizable prompt templates for both AI agents:

**Specification Agent (Gemini):**
- **File**: `backend/core/prompts/specification_template.md`
- **Purpose**: Controls how module specifications are generated
- **Customizable**: Section structure, detail level, quality requirements

**Coding Agent (Claude):**
- **File**: `backend/core/prompts/odoo_guidelines.md` 
- **Purpose**: Defines Odoo development standards and coding guidelines
- **Customizable**: Coding standards, module structure, security requirements

**How to customize:**
1. Edit the appropriate `.md` file in `backend/core/prompts/`
2. Changes take effect immediately (no restart required)
3. Test with sample projects to verify customizations
4. See `backend/core/prompts/README.md` for detailed customization guide

#### 6.3 Testing the Full Workflow
1. Start both backend and frontend servers
2. Register/login to create user account
3. Create a new Odoo project
4. Generate specification from requirements
5. Edit and approve specification
6. Generate module code
7. Download generated module

### 7. API Key Cost Estimates

#### 7.1 Development Usage (per module generation)
- **Anthropic Claude**: $0.03-0.15 per module (depending on complexity)
- **Google Gemini**: Free tier covers ~1000 requests/month
- **Total monthly cost for active development**: $5-20

#### 7.2 Production Usage
- Scale based on user volume
- Consider implementing usage limits and billing
- Monitor API costs through provider dashboards

### 8. Security Considerations

#### 8.1 API Key Security
- ✅ Never commit `.env` files to git
- ✅ Use different keys for development/production
- ✅ Rotate keys regularly
- ✅ Monitor usage for suspicious activity

#### 8.2 JWT Security
- ✅ Use long, random JWT secret (256+ bits)
- ✅ Set appropriate token expiration times
- ✅ Consider refresh token implementation

### 9. Deployment Considerations

#### 9.1 Environment Variables
- Use secure secret management (AWS Secrets Manager, etc.)
- Separate configurations for staging/production
- Monitor API usage and set billing alerts

#### 9.2 Database
- Consider migrating from SQLite to PostgreSQL for production
- Implement proper backup strategies
- Set up database migrations

---

## Quick Start Checklist

- [ ] Python 3.10+ installed
- [ ] Node.js 18+ installed
- [ ] Anthropic API key obtained and added to `backend/.env`
- [ ] Google Gemini API key obtained and added to `backend/.env`
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Backend server running on port 8000
- [ ] Frontend server running on port 5173
- [ ] Test module generation workflow end-to-end

**⚠️ Critical**: The application will not work without valid `ANTHROPIC_API_KEY` and `GEMINI_API_KEY` in the backend `.env` file. 