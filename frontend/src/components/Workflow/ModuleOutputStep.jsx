import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useModuleSession } from '../../hooks/useModuleSession';
import { MODULE_STEPS } from '../../stores/moduleSessionStore';

const ModuleOutputStep = () => {
  const { activeSession, update } = useModuleSession();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [moduleFiles, setModuleFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);

  useEffect(() => {
    // Check if module output has already been generated
    if (activeSession?.stepData?.[MODULE_STEPS.MODULE_OUTPUT]?.generated) {
      setIsGenerated(true);
      setModuleFiles(activeSession.stepData[MODULE_STEPS.MODULE_OUTPUT].files || []);
      
      // Select the first file by default if available
      if (activeSession.stepData[MODULE_STEPS.MODULE_OUTPUT].files?.length > 0) {
        const firstFile = activeSession.stepData[MODULE_STEPS.MODULE_OUTPUT].files[0];
        setSelectedFile(firstFile);
        setFileContent(firstFile.content);
      }
    } else {
      // Auto-generate the module when landing on this step
      handleGenerateModule();
    }
  }, [activeSession]);

  const handleGenerateModule = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      // This would typically be an API call to generate the module based on
      // the specification and development plan
      const requirementsData = activeSession?.stepData?.[MODULE_STEPS.REQUIREMENTS];
      const moduleName = requirementsData?.moduleName || 'new_module';
      
      // Simulate progressive generation with progress updates
      await simulateProgressiveGeneration();
      
      // Generate sample module files
      const generatedFiles = [
        {
          id: 'manifest',
          name: '__manifest__.py',
          path: `${moduleName}/__manifest__.py`,
          type: 'python',
          content: generateManifestContent(requirementsData),
        },
        {
          id: 'init',
          name: '__init__.py',
          path: `${moduleName}/__init__.py`,
          type: 'python',
          content: "from . import models\n",
        },
        {
          id: 'models_init',
          name: 'models/__init__.py',
          path: `${moduleName}/models/__init__.py`,
          type: 'python',
          content: "from . import models\n",
        },
        {
          id: 'models',
          name: 'models/models.py',
          path: `${moduleName}/models/models.py`,
          type: 'python',
          content: generateModelsContent(moduleName),
        },
        {
          id: 'views',
          name: 'views/views.xml',
          path: `${moduleName}/views/views.xml`,
          type: 'xml',
          content: generateViewsContent(moduleName),
        },
        {
          id: 'security',
          name: 'security/ir.model.access.csv',
          path: `${moduleName}/security/ir.model.access.csv`,
          type: 'csv',
          content: 'id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink\n' +
                  `access_${moduleName}_model,access_${moduleName}_model,model_${moduleName.replace('_', '.')}_model,base.group_user,1,1,1,1`,
        },
        {
          id: 'data',
          name: 'data/demo.xml',
          path: `${moduleName}/data/demo.xml`,
          type: 'xml',
          content: '<odoo>\n    <!-- Demo Data -->\n</odoo>',
        },
      ];
      
      setModuleFiles(generatedFiles);
      setSelectedFile(generatedFiles[0]);
      setFileContent(generatedFiles[0].content);
      setIsGenerated(true);
      
      // Update the step data with the generated module
      update({
        [MODULE_STEPS.MODULE_OUTPUT]: {
          generated: true,
          generatedAt: new Date().toISOString(),
          files: generatedFiles,
          moduleName: moduleName,
        },
      });
    } catch (error) {
      console.error('Error generating module:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Helper function to simulate progressive generation
  const simulateProgressiveGeneration = async () => {
    const totalSteps = 10;
    for (let step = 1; step <= totalSteps; step++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setGenerationProgress(Math.floor((step / totalSteps) * 100));
    }
  };
  
  // Helper function to generate manifest content
  const generateManifestContent = (requirements) => {
    return `# -*- coding: utf-8 -*-
{
    'name': "${requirements?.description || 'New Module'}",
    'version': "${requirements?.version || '1.0.0'}",
    'category': "${requirements?.category || 'Uncategorized'}",
    'summary': "A custom module for Odoo",
    'description': """
${requirements?.description || 'A custom module for Odoo.'}
    """,
    'author': "${requirements?.author || 'Odoo Module Builder'}",
    'website': "${requirements?.website || ''}",
    'depends': [${requirements?.depends ? `'${requirements.depends.split(',').join("', '")}'` : "'base'"}],
    'data': [
        'security/ir.model.access.csv',
        'views/views.xml',
        'data/demo.xml',
    ],
    'demo': [],
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': "${requirements?.license || 'LGPL-3'}",
}`;
  };
  
  // Helper function to generate models content
  const generateModelsContent = (moduleName) => {
    const modelName = moduleName.replace(/_/g, '.');
    return `# -*- coding: utf-8 -*-
from odoo import models, fields, api, _

class ${toPascalCase(moduleName)}Model(models.Model):
    _name = '${modelName}.model'
    _description = 'Model for ${toPascalCase(moduleName)}'

    name = fields.Char(string='Name', required=True)
    description = fields.Text(string='Description')
    date = fields.Date(string='Date', default=fields.Date.context_today)
    state = fields.Selection([
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('done', 'Done'),
    ], default='draft', string='Status')
    
    def action_confirm(self):
        for record in self:
            record.state = 'confirmed'
    
    def action_done(self):
        for record in self:
            record.state = 'done'
    
    def action_draft(self):
        for record in self:
            record.state = 'draft'
`;
  };
  
  // Helper function to generate views content
  const generateViewsContent = (moduleName) => {
    const modelName = moduleName.replace(/_/g, '.');
    return `<odoo>
    <data>
        <!-- tree view -->
        <record id="${moduleName}_view_tree" model="ir.ui.view">
            <field name="name">${modelName}.model.tree</field>
            <field name="model">${modelName}.model</field>
            <field name="arch" type="xml">
                <tree string="${toPascalCase(moduleName)}">
                    <field name="name"/>
                    <field name="date"/>
                    <field name="state"/>
                </tree>
            </field>
        </record>
        
        <!-- form view -->
        <record id="${moduleName}_view_form" model="ir.ui.view">
            <field name="name">${modelName}.model.form</field>
            <field name="model">${modelName}.model</field>
            <field name="arch" type="xml">
                <form string="${toPascalCase(moduleName)}">
                    <header>
                        <button name="action_confirm" string="Confirm" type="object" states="draft" class="oe_highlight"/>
                        <button name="action_done" string="Mark Done" type="object" states="confirmed" class="oe_highlight"/>
                        <button name="action_draft" string="Set to Draft" type="object" states="confirmed,done"/>
                        <field name="state" widget="statusbar"/>
                    </header>
                    <sheet>
                        <div class="oe_title">
                            <h1>
                                <field name="name" placeholder="Name"/>
                            </h1>
                        </div>
                        <group>
                            <field name="date"/>
                            <field name="description"/>
                        </group>
                    </sheet>
                </form>
            </field>
        </record>
        
        <!-- search view -->
        <record id="${moduleName}_view_search" model="ir.ui.view">
            <field name="name">${modelName}.model.search</field>
            <field name="model">${modelName}.model</field>
            <field name="arch" type="xml">
                <search string="${toPascalCase(moduleName)}">
                    <field name="name"/>
                    <field name="date"/>
                    <separator/>
                    <filter string="Draft" name="draft" domain="[('state','=','draft')]"/>
                    <filter string="Confirmed" name="confirmed" domain="[('state','=','confirmed')]"/>
                    <filter string="Done" name="done" domain="[('state','=','done')]"/>
                    <group expand="0" string="Group By">
                        <filter string="Status" name="status" context="{'group_by':'state'}"/>
                        <filter string="Date" name="date" context="{'group_by':'date'}"/>
                    </group>
                </search>
            </field>
        </record>
        
        <!-- actions -->
        <record id="action_${moduleName}_model" model="ir.actions.act_window">
            <field name="name">${toPascalCase(moduleName)}</field>
            <field name="res_model">${modelName}.model</field>
            <field name="view_mode">tree,form</field>
            <field name="context">{}</field>
            <field name="help" type="html">
                <p class="o_view_nocontent_smiling_face">
                    Create your first record!
                </p>
            </field>
        </record>
        
        <!-- menus -->
        <menuitem id="menu_${moduleName}_root" name="${toPascalCase(moduleName)}" sequence="10"/>
        <menuitem id="menu_${moduleName}_sub" name="${toPascalCase(moduleName)}" parent="menu_${moduleName}_root" sequence="10"/>
        <menuitem id="menu_${moduleName}_model" name="${toPascalCase(moduleName)}" parent="menu_${moduleName}_sub" action="action_${moduleName}_model" sequence="10"/>
    </data>
</odoo>`;
  };
  
  // Helper function to convert snake_case to PascalCase
  const toPascalCase = (str) => {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  };
  
  // Handle file selection with improved feedback
  const handleFileSelect = (file) => {
    console.log('Selected file:', file);
    setSelectedFile(file);
    setFileContent(file.content);
    
    // Add visual feedback for selection
    const fileElements = document.querySelectorAll('.file-item');
    fileElements.forEach(el => {
      if (el.dataset.fileId === file.id) {
        el.classList.add('bg-blue-100', 'dark:bg-blue-900');
      } else {
        el.classList.remove('bg-blue-100', 'dark:bg-blue-900');
      }
    });
  };
  
  const handleDownloadModule = () => {
    // In a real application, this would trigger a backend API call to
    // package and deliver the module as a zip file
    alert('In a real implementation, this would download the packaged module as a ZIP file.');
  };
  
  // Different views based on state
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-xl font-bold mb-4">Generating Your Module</h3>
        <div className="w-full max-w-md bg-gray-200 rounded-full h-4 mb-4">
          <div 
            className="bg-blue-500 h-4 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${generationProgress}%` }}
          ></div>
        </div>
        <div className="flex flex-col items-center text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            {generationProgress < 30 && "Analyzing requirements and specifications..."}
            {generationProgress >= 30 && generationProgress < 60 && "Creating module structure and files..."}
            {generationProgress >= 60 && generationProgress < 90 && "Implementing models and views..."}
            {generationProgress >= 90 && "Finalizing module generation..."}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {generationProgress}% complete
          </p>
        </div>
      </div>
    );
  }
  
  if (!isGenerated) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Module generation has not been started yet.
        </p>
        <button
          onClick={handleGenerateModule}
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Generate Module
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Generated Module</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Your Odoo module has been generated successfully. You can review the files below and download the complete module package.
      </p>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* File browser */}
        <div className="w-full md:w-1/3 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-96 overflow-auto">
          <h3 className="text-lg font-semibold mb-3">Module Files</h3>
          <div className="space-y-1">
            {moduleFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => handleFileSelect(file)}
                data-file-id={file.id}
                className={`file-item p-2 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center ${
                  selectedFile?.id === file.id ? 'bg-blue-100 dark:bg-blue-900' : ''
                }`}
              >
                <svg 
                  className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
                <span className="text-sm truncate">{file.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* File viewer */}
        <div className="w-full md:w-2/3">
          {selectedFile && (
            <div>
              <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-t-lg flex justify-between items-center">
                <span className="font-mono text-sm">{selectedFile.path}</span>
                <span className="text-xs px-2 py-1 bg-gray-300 dark:bg-gray-600 rounded">
                  {selectedFile.type}
                </span>
              </div>
              <pre className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-b-lg p-4 h-80 overflow-auto text-sm font-mono">
                {fileContent}
              </pre>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 flex justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Module has been created and is ready to download.
          </p>
        </div>
        
        <motion.button
          onClick={handleDownloadModule}
          className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg 
            className="w-5 h-5 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
            />
          </svg>
          Download Module
        </motion.button>
      </div>
    </div>
  );
};

export default ModuleOutputStep;
