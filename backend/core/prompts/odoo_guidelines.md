# Odoo Development Guidelines for AI Code Generation

## Module Structure and Organization

### 1. Module Directory Structure
```
my_module/
├── __init__.py
├── __manifest__.py
├── models/
│   ├── __init__.py
│   └── [model_files].py
├── views/
│   ├── [model_name]_views.xml
│   └── menu.xml
├── security/
│   ├── ir.model.access.csv
│   └── [model_name]_security.xml
├── data/
│   └── [data_files].xml
├── static/
│   ├── description/
│   │   ├── icon.png
│   │   └── index.html
│   └── src/
│       ├── css/
│       ├── js/
│       └── xml/
├── wizard/
│   ├── __init__.py
│   └── [wizard_files].py
└── report/
    ├── __init__.py
    └── [report_files].py
```

### 2. __manifest__.py Requirements
```python
{
    'name': 'Module Name',
    'version': '1.0.0',
    'category': 'Appropriate Category',
    'summary': 'Brief description',
    'description': 'Detailed description',
    'author': 'Odoo Module Builder',
    'website': 'https://www.odoomodulebuilder.com',
    'depends': ['base'],  # Minimal dependencies
    'data': [
        'security/ir.model.access.csv',
        'views/menu.xml',
        'views/model_views.xml',
    ],
    'installable': True,
    'auto_install': False,
    'application': False,
}
```

## Model Development Guidelines

### 3. Model Naming Conventions
- Model names: `snake_case` (e.g., `sale.order.line`)
- Class names: `CamelCase` (e.g., `SaleOrderLine`)
- Field names: `snake_case` (e.g., `order_date`)
- Database table names: Replace dots with underscores (e.g., `sale_order_line`)

### 4. Model Structure Template
```python
from odoo import models, fields, api
from odoo.exceptions import ValidationError

class ModelName(models.Model):
    _name = 'module.model'
    _description = 'Model Description'
    _order = 'name'
    _rec_name = 'name'
    
    # Fields
    name = fields.Char(string='Name', required=True)
    active = fields.Boolean(string='Active', default=True)
    
    # Computed fields
    @api.depends('field1', 'field2')
    def _compute_field(self):
        for record in self:
            record.computed_field = record.field1 + record.field2
    
    # Constraints
    @api.constrains('field_name')
    def _check_field_name(self):
        for record in self:
            if condition:
                raise ValidationError("Error message")
    
    # CRUD operations
    @api.model
    def create(self, vals):
        return super().create(vals)
    
    def write(self, vals):
        return super().write(vals)
    
    def unlink(self):
        return super().unlink()
```

### 5. Field Types and Best Practices
- Use appropriate field types: `Char`, `Text`, `Integer`, `Float`, `Boolean`, `Date`, `Datetime`
- Many2one relationships: Always include `ondelete` parameter
- One2many relationships: Include `inverse_name`
- Many2many relationships: Use explicit relation table when needed
- Selection fields: Define choices as class attributes

## View Development Guidelines

### 6. View Structure and Naming
- Form views: `model_name_view_form`
- Tree views: `model_name_view_tree`
- Search views: `model_name_view_search`
- Kanban views: `model_name_view_kanban`

### 7. Form View Template
```xml
<record id="model_name_view_form" model="ir.ui.view">
    <field name="name">model.name.form</field>
    <field name="model">model.name</field>
    <field name="arch" type="xml">
        <form string="Model Name">
            <header>
                <!-- Status bar and buttons -->
            </header>
            <sheet>
                <group>
                    <group>
                        <field name="field1"/>
                        <field name="field2"/>
                    </group>
                    <group>
                        <field name="field3"/>
                        <field name="field4"/>
                    </group>
                </group>
                <notebook>
                    <page string="Page Name">
                        <!-- Page content -->
                    </page>
                </notebook>
            </sheet>
            <div class="oe_chatter">
                <field name="message_follower_ids"/>
                <field name="activity_ids"/>
                <field name="message_ids"/>
            </div>
        </form>
    </field>
</record>
```

### 8. Tree View Template
```xml
<record id="model_name_view_tree" model="ir.ui.view">
    <field name="name">model.name.tree</field>
    <field name="model">model.name</field>
    <field name="arch" type="xml">
        <tree string="Model Names">
            <field name="name"/>
            <field name="field1"/>
            <field name="field2"/>
        </tree>
    </field>
</record>
```

## Security Guidelines

### 9. Access Rights (ir.model.access.csv)
```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_model_name_user,model.name.user,model_model_name,base.group_user,1,1,1,1
access_model_name_manager,model.name.manager,model_model_name,base.group_system,1,1,1,1
```

### 10. Record Rules Template
```xml
<record id="model_name_rule" model="ir.rule">
    <field name="name">Model Name Rule</field>
    <field name="model_id" ref="model_model_name"/>
    <field name="domain_force">[]</field>
    <field name="groups" eval="[(4, ref('base.group_user'))]"/>
</record>
```

## Code Quality Standards

### 11. Python Coding Standards
- Follow PEP 8 style guidelines
- Use meaningful variable and function names
- Add docstrings to methods and classes
- Implement proper error handling
- Use `@api.model`, `@api.multi`, `@api.one` decorators appropriately

### 12. Performance Best Practices
- Use `@api.depends` for computed fields
- Implement proper search methods
- Use SQL queries for complex operations
- Avoid unnecessary database calls
- Use `sudo()` sparingly and carefully

### 13. Odoo ORM Best Practices
- Use `browse()` for single records
- Use `search()` for multiple records
- Implement proper domain filters
- Use `filtered()` for post-processing
- Handle empty recordsets properly

## Integration Guidelines

### 14. Common Module Dependencies
- `base`: Core Odoo functionality
- `mail`: For messaging and activity features
- `portal`: For portal access
- `website`: For website integration
- `account`: For accounting features
- `sale`: For sales functionality
- `purchase`: For purchasing features
- `stock`: For inventory management

### 15. API and External Integration
- Use `@api.model` for static methods
- Implement proper validation
- Use Odoo's built-in serialization
- Handle exceptions gracefully
- Implement proper logging

## Workflow and Automation

### 16. Automated Actions
- Use server actions for simple automations
- Implement proper conditions
- Use Python code for complex logic
- Handle errors in automated actions

### 17. Email Templates
- Create proper email templates
- Use QWeb for dynamic content
- Include proper fallbacks
- Test email generation

## Testing and Validation

### 18. Data Validation
- Use `@api.constrains` for business rules
- Validate data at the model level
- Provide clear error messages
- Handle edge cases

### 19. User Experience
- Create intuitive form layouts
- Use appropriate field widgets
- Implement smart buttons
- Add helpful field labels and help text

## Version Compatibility

### 20. Odoo Version Considerations
- Use appropriate API methods for the target version
- Avoid deprecated methods
- Use version-specific features when available
- Maintain backward compatibility when possible

## Final Checklist

### 21. Pre-deployment Validation
- [ ] All models have proper access rights
- [ ] Views are properly structured
- [ ] Security rules are implemented
- [ ] Data files are valid
- [ ] Module installs without errors
- [ ] Basic functionality works as expected
- [ ] No Python errors in logs
- [ ] Follows Odoo coding standards

### 22. Code Generation Requirements
- Generate complete, working modules
- Include all necessary files
- Follow proper naming conventions
- Implement business logic correctly
- Include appropriate comments
- Handle edge cases
- Provide proper user experience 