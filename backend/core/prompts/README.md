# AI Agent Prompt Customization Guide

This directory contains the prompt templates used by the AI agents in the Odoo Module Builder application.

## 📁 Available Prompt Files

### 1. **`specification_template.md`**
- **Used by**: SpecificationAgent (Gemini)
- **Purpose**: Template for generating module specifications from user requirements
- **Customizable**: ✅ Yes - Edit this file to change how specifications are generated

### 2. **`odoo_guidelines.md`** 
- **Used by**: CodingAgent (Claude)
- **Purpose**: Comprehensive Odoo development guidelines for code generation
- **Customizable**: ✅ Yes - Edit this file to add your coding standards and preferences

## 🛠️ How to Customize Prompts

### **For Specification Generation (`specification_template.md`)**

**What you can customize:**
- ✅ Section structure and order
- ✅ Level of detail required for each section
- ✅ Quality requirements and standards
- ✅ Output format preferences
- ✅ Business-specific guidelines
- ✅ Industry-specific requirements

**Example customizations:**
```markdown
## Custom Business Requirements
- Always include ROI analysis
- Consider regulatory compliance
- Include integration with SAP
- Focus on manufacturing workflows
```

### **For Code Generation (`odoo_guidelines.md`)**

**What you can customize:**
- ✅ Coding standards and conventions
- ✅ Module structure preferences
- ✅ Security requirements
- ✅ Performance guidelines
- ✅ Company-specific best practices
- ✅ Custom field types and patterns

**Example customizations:**
```markdown
## Company-Specific Guidelines
- All models must include audit trail fields
- Use company_id field for multi-company support
- Follow our custom naming convention: prefix_module_name
- Include automated tests for all business logic
```

## 🔄 How Changes Take Effect

### **Automatic Updates**
- ✅ **Specification changes**: Take effect immediately when you save `specification_template.md`
- ✅ **Coding changes**: Take effect immediately when you save `odoo_guidelines.md`
- ✅ **No server restart required** - Files are loaded fresh for each request

### **Testing Your Changes**
1. Edit the prompt file
2. Save the changes  
3. Generate a new specification or module code
4. Verify the output follows your customizations

## 📝 Best Practices for Prompt Customization

### **Do's**
- ✅ Be specific and clear in your instructions
- ✅ Provide examples for complex requirements
- ✅ Test changes with sample projects
- ✅ Keep backups of working versions
- ✅ Document your customizations

### **Don'ts**
- ❌ Remove essential structure requirements
- ❌ Make prompts too restrictive (may reduce quality)
- ❌ Include conflicting instructions
- ❌ Remove error handling guidelines
- ❌ Make prompts too lengthy (may hit token limits)

## 🚨 Important Notes

### **Token Limits**
- **Gemini**: ~30K tokens input limit
- **Claude**: ~200K tokens input limit
- Keep prompts concise but comprehensive

### **File Loading**
- Files are loaded when the AI agents are initialized
- Changes require the backend to reload (auto-reload is enabled in development)
- For production deployments, restart the backend service after changes

### **Backup Strategy**
```bash
# Create backups before major changes
cp specification_template.md specification_template.md.backup
cp odoo_guidelines.md odoo_guidelines.md.backup
```

## 🔧 Advanced Customization

### **Adding New Prompt Files**
If you want to add new prompt templates:

1. Create the new `.md` file in this directory
2. Update the appropriate AI agent class to load the new file
3. Modify the prompt building methods to use the new template

### **Multi-Language Support**
To support multiple languages:
- Create language-specific versions: `specification_template_en.md`, `specification_template_fr.md`
- Modify the AI agent to load the appropriate language file based on user preferences

### **Environment-Specific Prompts**
For different environments (dev/staging/prod):
- Use environment variables to load different prompt files
- Maintain separate prompt versions for different deployment targets

---

## 🆘 Troubleshooting

**Issue**: Changes not taking effect
**Solution**: Restart the backend server or check for syntax errors in the prompt files

**Issue**: Generated content is too verbose/brief
**Solution**: Adjust the quality requirements and output format sections in the templates

**Issue**: AI agent errors after prompt changes
**Solution**: Check file permissions and syntax, restore from backup if needed 