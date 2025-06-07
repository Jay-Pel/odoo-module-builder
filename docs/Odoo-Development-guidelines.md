# Odoo v18 Module Development Guidelines

## Development Process & Role

### **Module Developer Responsibilities**
- **Transform requests into module specifications** for approval before development
- **Program Odoo modules** following official Odoo documentation: https://www.odoo.com/documentation/18.0/
- **Test modules thoroughly** before delivery with detailed testing scenarios
- **Create specification.md files** for functional documentation in the root directory
- **Ask confirmation** before updating specifications with new content
- **Maintain only ONE specification file** per project in the custom addons module root

### **Documentation Requirements**
- **ALWAYS create `specification.md`** in module root for functional documentation
- **ALWAYS include `static/description/index.html`** describing module config and features
- **Update documentation** with every version increment
- **Keep documentation synchronized** with actual functionality

## Critical Rules for Error Prevention

### 1. **Module Dependencies & Registry Loading**

#### ✅ **Dependency Management**
- **ALWAYS verify module dependencies** in `__manifest__.py` before referencing external models or views
- **Add required modules to `depends` list** rather than modifying menu parents or using fallback solutions
- **Ensure ALL necessary Odoo apps** are in dependencies for error-free installation
- **Example**: If using `sale.product_menu_catalog`, ensure `'sale'` is in dependencies

#### ❌ **Common Mistakes**
```python
# BAD: Changing menu parent to avoid dependency
'parent': 'stock.menu_stock_inventory_control'

# GOOD: Adding proper dependency
'depends': ['base', 'product', 'mrp', 'stock', 'sale']
```

#### 🔧 **Import Consistency**
- **ALWAYS keep `models/__init__.py` synchronized** with actual model files
- **Remove imports when deleting model files** to prevent registry load failures
- **Example**: Deleting `res_config_settings.py` requires removing `from . import res_config_settings`

### 2. **XPath Selectors in View Inheritance** ⚠️ CRITICAL

#### ✅ **Safe Selector Practices**
- **NEVER use text-based attributes** like `@string`, `@title`, `@help` as XPath selectors
- **ALWAYS use structural selectors**: `@name`, `@id`, element names
- **Use `position="after"/"before"` with named elements** instead of targeting by text

#### ❌ **Forbidden Patterns**
```xml
<!-- BAD: Text-based selectors -->
<xpath expr="//group[@string='Group By']" position="inside">
<xpath expr="//filter[@title='Consumable']" position="after">

<!-- GOOD: Structural selectors -->
<xpath expr="//filter[@name='categ_id']" position="after">
<xpath expr="//field[@name='type']" position="after">
```

### 3. **Field References & Module Compatibility** ⚠️ CRITICAL

#### ✅ **Field Validation**
- **ALWAYS verify field existence** in target models before referencing in views or code
- **Check field deprecation** in Odoo version changelog before using
- **Verify required modules** are in dependencies when fields come from optional modules
- **Add stub field definitions** for optional module fields using safe model references

#### 🔧 **Handling Optional Module Fields**
When fields from optional modules cause errors:

**OPTION A: View Inheritance (Preferred)**
```xml
<!-- Hide problematic settings when module not available -->
<xpath expr="//setting[@id='problematic_setting']" position="attributes">
    <attribute name="invisible">1</attribute>
</xpath>
```

**OPTION B: Safe Model References** (Only when necessary)
```python
# Use safe model references
stock_sms_template_id = fields.Many2one(
    'mail.template',  # Safe: mail module always available
    string='SMS Template'
)
```

### 4. **Odoo v18 Compatibility Standards** 🚀

#### ✅ **API Decorators**
- **Use `@api.model_create_multi`** for create methods to handle batch operations
- **Avoid deprecated `@api.model` + single record pattern**

```python
# GOOD: Odoo v18 pattern
@api.model_create_multi
def create(self, vals_list):
    results = super().create(vals_list)
    for result in results:
        result.custom_logic()
    return results

# BAD: Deprecated pattern
@api.model
def create(self, vals):
    result = super().create(vals)
    result.custom_logic()
    return result
```

#### ✅ **View Syntax & Deprecated Features**
- **NEVER use `attrs` in Odoo v17+** - completely decommissioned
- **Use modern `invisible` syntax** instead of deprecated patterns
- **Use OWL framework** for modules v16+ (consult Odoo Web Library documentation)
- **Verify filter names** match current Odoo version (e.g., 'goods' instead of 'consumable')

#### ⚠️ **Critical Odoo v18 Changes**
- **Product type 'product' REMOVED** - No longer exists in Odoo v18
- **ACTUAL product type values in v18** (from `odoo/addons/product/models/product_template.py`):
  ```python
  type = fields.Selection([
      ('consu', "Goods"),      # Tangible materials and merchandise
      ('service', "Service"),  # Non-material product
      ('combo', "Combo"),      # Product combinations (requires POS)
  ])
  ```
- **IMPORTANT**: Database stores `'consu'` but UI displays `"Goods"`
- **For domain filters**: Use database values (`'consu'`, `'service'`, `'combo'`)
- **Inventory tracking**: Separate `track_inventory` boolean field controls this
- **Always verify field values** by checking actual Odoo source code before implementation

#### 🔍 **CRITICAL RULE: Always Check Source Code First**
- **NEVER assume field selection values** based on documentation or external sources
- **ALWAYS check `odoo/addons/` source code** for actual field definitions
- **ALWAYS check `odoo-enterprise/` addons** when using Enterprise features
- **Look for**: `selection=[...]` in field definitions to get exact values
- **Verify field existence** in target models before referencing in domains/code
- **Check field deprecation** in version-specific commits and changelogs

#### 🔗 **Version Validation Resources**
- **GitHub commits**: https://github.com/odoo/odoo/commits/18.0/
- **ORM changelog**: https://www.odoo.com/documentation/18.0/fr/developer/reference/backend/orm/changelog.html
- **Backend tutorial**: https://www.odoo.com/documentation/18.0/developer/tutorials/backend.html

### 5. **Error Resolution Priority** 🎯

When encountering module errors, follow this **exact priority**:

0. **Source Code Verification** → Check actual Odoo source code for field definitions and values
1. **Dependency Issues** → Add missing modules to `depends`
2. **Import Errors** → Synchronize `__init__.py` files
3. **XPath Failures** → Use structural selectors, avoid text-based
4. **Field Undefined** → Verify field existence, add to dependencies or create stubs
5. **API Warnings** → Update to modern API patterns

### 6. **Code Quality & Standards**

#### ✅ **Code Standards**
- **ALWAYS fix warnings** and refactor code to follow PEP8
- **Follow best practices** for Python and Odoo development
- **Never modify main Odoo app code** - only create custom addons with inheritance
- **Use proper inheritance patterns** for extending existing modules

#### ✅ **Module Structure Requirements**
```
custom_module/
├── __init__.py                 # Only import existing modules
├── __manifest__.py            # Complete dependency list, e3k branding
├── specification.md           # Functional documentation (REQUIRED)
├── models/
│   ├── __init__.py           # Sync with actual files
│   └── your_model.py         # Main functionality
├── views/
│   ├── model_views.xml       # Main views
│   └── config_views.xml      # Compatibility fixes
├── data/
├── security/
└── static/description/
    └── index.html            # Module description (REQUIRED)
```

### 7. **Version Management & Branding** 📋

#### ✅ **Version Control**
- **Increment version** with EVERY modification for proper Odoo updates
- **Update ALL version references**: `__manifest__.py`, `index.html`, documentation
- **Use semantic versioning**: Major.Minor.Patch (e.g., 1.1.2)

#### ✅ **Branding Standards**
- **Author**: ALWAYS `e3k`
- **Website**: ALWAYS `e3k.co`
- **NO other company or trademark** in manifest or files

```python
# REQUIRED in __manifest__.py
'author': 'e3k',
'website': 'e3k.co',
```

### 8. **Source Control & Git Management**

#### ✅ **Branch Management**
- **NEVER create new GitHub branches** without explicit user request
- **ALWAYS ask confirmation** before pushing to any branch
- **Follow user's source control preferences**

### 9. **Testing & Validation**

#### ✅ **Pre-deployment Checklist**
- [ ] **SOURCE CODE VERIFIED**: All field values and definitions checked against actual Odoo source
- [ ] All imports in `__init__.py` files match existing model files
- [ ] All dependencies in manifest match referenced external models/views
- [ ] XPath selectors use `@name`/`@id` only, no text attributes
- [ ] API decorators follow Odoo v18 patterns (`@api.model_create_multi`)
- [ ] No hardcoded filter names without version verification
- [ ] No `attrs` usage in v17+ modules
- [ ] OWL framework used for frontend in v16+ modules
- [ ] PEP8 compliance and no warnings
- [ ] `specification.md` exists and is current
- [ ] `index.html` describes all features
- [ ] Proper e3k branding in manifest

#### ✅ **Code Tidiness Analysis**
- **After every modification**, analyze folder and file organization
- **Assess usefulness** of all files to the module
- **Remove unnecessary files** and clean up structure
- **Ensure logical organization** of components

### 10. **Module Architecture Best Practices**

#### ✅ **Inheritance Principles**
- **Only inherit and extend** existing Odoo modules/apps
- **Never modify core Odoo code** directly
- **Use proper inheritance patterns** for models, views, and data
- **Create custom addons** following official documentation

#### ✅ **Separation of Concerns**
- **Main functionality** in primary model files
- **Compatibility fixes** in separate view files
- **Configuration overrides** clearly documented and isolated
- **Testing scenarios** documented in separate files

---

## Quick Reference: Common Error Patterns

| Error Type | Root Cause | Solution | Priority |
|------------|------------|----------|----------|
| `Incorrect field values` | Wrong selection value | Check Odoo source code | 0 |
| `External ID not found` | Missing dependency | Add module to `depends` | 1 |
| `Registry load failed` | Import mismatch | Sync `__init__.py` with files | 2 |
| `cannot be located in XPath` | Text-based selector | Use `@name`/`@id` selectors | 3 |
| `Field is undefined` | Optional module field | Add dependency or create stub | 4 |
| `Batch create warning` | Old API pattern | Use `@api.model_create_multi` | 5 |
| `attrs not supported` | Deprecated v17+ | Remove `attrs`, use modern syntax | 5 |

---

## Essential Resources

### **Official Documentation**
- **Main Documentation**: https://www.odoo.com/documentation/18.0/
- **Backend Tutorial**: https://www.odoo.com/documentation/18.0/developer/tutorials/backend.html
- **ORM Changelog**: https://www.odoo.com/documentation/18.0/fr/developer/reference/backend/orm/changelog.html

### **Version Validation**
- **GitHub Commits**: https://github.com/odoo/odoo/commits/18.0/
- **Odoo Web Library**: Check for current version documentation

### **Development Standards**
- **PEP8**: Python coding standards
- **Odoo Guidelines**: Follow official development patterns
- **OWL Framework**: For v16+ frontend development

---

## Version History
- **v1.1.2**: Fixed registry load error (removed orphaned import)
- **v1.1.1**: Fixed batch creation API deprecation warning
- **v1.1.0**: Implemented proper SMS configuration fix
- **v1.0.9**: Fixed XPath selector issues and field references
- **v1.0.8**: Initial working version with all core functionality

---

## Testing Scenarios Template

For every module, create detailed testing scenarios covering:

1. **Installation Testing**
   - Fresh installation process
   - Dependency resolution
   - Database migration

2. **Functional Testing**
   - Core feature validation
   - Edge case handling
   - User workflow testing

3. **Integration Testing**
   - Interaction with dependent modules
   - View inheritance verification
   - Data consistency checks

4. **Performance Testing**
   - Load testing with large datasets
   - Memory usage optimization
   - Query performance validation 