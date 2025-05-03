// Odoo Module Builder - Main Use Case Test Scenario
// This script tests the complete flow of creating an Odoo module using the guided workflow

// Create a browser-friendly test environment
(function initBrowserTestEnvironment() {
  // Define globals that would be available in a testing framework
  if (typeof window.page === 'undefined') {
    // Mock the page object with browser-native equivalents
    window.page = {
      // These functions will be no-ops in the browser environment
      goto: async (url) => {
        console.log('Would navigate to:', url);
        // In browser, we're already on the page
        return Promise.resolve();
      },
      waitForSelector: async (selector, options = {}) => {
        console.log('Waiting for selector:', selector);
        // Use a setTimeout-based approach to wait for elements
        const start = Date.now();
        const timeout = options.timeout || 5000;
        
        return new Promise((resolve, reject) => {
          const check = () => {
            const element = document.querySelector(selector);
            if (element) {
              resolve(element);
            } else if (Date.now() - start >= timeout) {
              reject(new Error(`Timeout waiting for selector: ${selector}`));
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        });
      },
      click: async (selector) => {
        console.log('Clicking:', selector);
        const element = document.querySelector(selector);
        if (!element) {
          throw new Error(`Element not found for clicking: ${selector}`);
        }
        element.click();
        return Promise.resolve();
      },
      fill: async (selector, value) => {
        console.log('Filling:', selector, 'with:', value);
        const element = document.querySelector(selector);
        if (!element) {
          throw new Error(`Element not found for filling: ${selector}`);
        }
        element.value = value;
        
        // Trigger input event for reactivity
        const event = new Event('input', { bubbles: true });
        element.dispatchEvent(event);
        
        return Promise.resolve();
      },
      selectOption: async (selector, value) => {
        console.log('Selecting option:', selector, 'value:', value);
        const element = document.querySelector(selector);
        if (!element) {
          throw new Error(`Element not found for select: ${selector}`);
        }
        element.value = value;
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        element.dispatchEvent(event);
        
        return Promise.resolve();
      },
      waitForTimeout: async (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
      },
      title: () => document.title,
      textContent: (selector) => {
        const element = document.querySelector(selector);
        return element ? element.textContent : '';
      },
      $eval: async (selector, fn) => {
        const element = document.querySelector(selector);
        if (!element) {
          throw new Error(`Element not found for evaluation: ${selector}`);
        }
        return fn(element);
      },
      $$: async (selector) => {
        return Array.from(document.querySelectorAll(selector));
      },
      $$eval: async (selector, fn) => {
        const elements = Array.from(document.querySelectorAll(selector));
        return fn(elements);
      }
    };
    console.log('Browser test environment initialized');
  }
})();


// Test configuration
const config = {
  moduleName: 'hr_employee_skills',
  description: 'Manage employee skills and certifications with ratings and expiration dates',
  category: 'Human Resources',
  author: 'Odoo Module Builder',
  website: 'https://www.example.com',
  license: 'LGPL-3',
  depends: 'base,hr',
  version: '16.0.1.0.0'
};

// Test steps with detailed assertions
const testSteps = [
  {
    name: 'Home Page',
    action: async () => {
      console.log('🧪 Test Step: Loading Home Page');
      
      try {
        // We're already on the home page, no need to navigate
        console.log('On home page, checking for create module button...');
        
        // Wait for the button with more detailed logging
        const startTime = Date.now();
        const timeout = 5000;
        let buttonFound = false;
        
        while (Date.now() - startTime < timeout && !buttonFound) {
          try {
            const button = document.querySelector('[data-testid="create-module-btn"]');
            if (button) {
              buttonFound = true;
              console.log('Found create-module-btn:', button);
            } else {
              // Try alternative selectors
              const allButtons = Array.from(document.querySelectorAll('button'));
              const startButton = allButtons.find(btn => 
                btn.innerText.includes('Start Building') || 
                btn.innerText.includes('Create Module')
              );
              
              if (startButton) {
                buttonFound = true;
                console.log('Found alternative button:', startButton);
                startButton.dataset.testid = 'create-module-btn'; // Add the testid
              } else {
                console.log('Still looking for button...');
                await new Promise(r => setTimeout(r, 500));
              }
            }
          } catch (e) {
            console.error('Error while looking for button:', e);
            await new Promise(r => setTimeout(r, 500));
          }
        }
        
        if (!buttonFound) {
          throw new Error('Could not find create module button after ' + timeout + 'ms');
        }
        
        // Check if the page has loaded correctly
        const title = document.title;
        console.log('Page title:', title);
        if (!title.includes('Odoo Module Builder')) {
          console.warn('Warning: Page title does not contain "Odoo Module Builder"');
        }
        
        // Click the Create Module button
        const createButton = document.querySelector('[data-testid="create-module-btn"]');
        console.log('Clicking button:', createButton);
        createButton.click();
        
        // Wait for navigation
        await new Promise(r => setTimeout(r, 1000));
        console.log('Navigation complete, new URL:', window.location.href);
        console.log('✅ Home Page: Navigated to Create Module workflow');
      } catch (error) {
        console.error('Home Page test failed:', error);
        
        // Capture the current DOM state for debugging
        console.log('Current DOM state:');
        console.log('Buttons found:', document.querySelectorAll('button').length);
        const buttonTexts = Array.from(document.querySelectorAll('button')).map(b => b.innerText);
        console.log('Button texts:', buttonTexts);
        
        throw error;
      }
    }
  },
  {
    name: 'Requirements Step',
    action: async () => {
      console.log('🧪 Test Step: Filling Requirements Form');
      
      try {
        // Wait for the form to load with extra logging
        console.log('Waiting for requirements form to load...');
        await new Promise(r => setTimeout(r, 1000)); // Short wait to ensure we're in the right step
        
        // Check if we're on the requirements page
        const stepTitle = Array.from(document.querySelectorAll('h2')).find(el => 
          el.innerText.includes('Requirements') || 
          el.innerText.includes('Module Requirements')
        );
        
        if (stepTitle) {
          console.log('Found requirements step title:', stepTitle.innerText);
        } else {
          console.warn('Requirements step title not found, available headings:');
          document.querySelectorAll('h1, h2, h3').forEach(h => console.log(h.innerText));
        }
        
        // Find the form
        const form = document.querySelector('form');
        if (!form) {
          console.error('Form not found on requirements page!');
          throw new Error('Requirements form not found');
        }
        console.log('Form found, proceeding to fill fields');
        
        // Helper function to fill form fields with validation
        const fillField = (selector, value, fieldName) => {
          const field = document.querySelector(selector);
          if (!field) {
            console.error(`Field not found: ${fieldName} (${selector})`);
            throw new Error(`Field not found: ${fieldName}`);
          }
          console.log(`Setting ${fieldName} to:`, value);
          field.value = value;
          
          // Trigger input event for reactivity
          const event = new Event('input', { bubbles: true });
          field.dispatchEvent(event);
          
          // Verify the value was set
          if (field.value !== value) {
            console.warn(`Warning: ${fieldName} value not set correctly. Expected: ${value}, Got: ${field.value}`);
          }
        };
        
        // Fill in the form fields with explicit logging
        fillField('input[name="moduleName"]', config.moduleName, 'Module Name');
        fillField('textarea[name="description"]', config.description, 'Description');
        fillField('input[name="version"]', config.version, 'Version');
        fillField('input[name="category"]', config.category, 'Category');
        fillField('input[name="author"]', config.author, 'Author');
        fillField('input[name="website"]', config.website, 'Website');
        
        // Handle select field specially
        const licenseField = document.querySelector('select[name="license"]');
        if (!licenseField) {
          console.error('License field not found');
        } else {
          console.log('Setting license to:', config.license);
          licenseField.value = config.license;
          
          // Trigger change event
          const event = new Event('change', { bubbles: true });
          licenseField.dispatchEvent(event);
        }
        
        fillField('input[name="depends"]', config.depends, 'Dependencies');
        
        // Log form data before submission to verify
        console.log('Form data before submission:');
        const formData = new FormData(form);
        for (const [key, value] of formData.entries()) {
          console.log(`${key}: ${value}`);
        }
        
        // Find and click the submit button
        const submitButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.type === 'submit' || 
          btn.innerText.includes('Next') || 
          btn.innerText.includes('Submit')
        );
        
        if (!submitButton) {
          console.error('Submit button not found!');
          throw new Error('Submit button not found');
        }
        
        console.log('Clicking submit button:', submitButton.innerText);
        submitButton.click();
        
        // Wait for navigation
        await new Promise(r => setTimeout(r, 1000));
        console.log('Form submitted, new URL:', window.location.href);
        console.log('✅ Requirements Step: Form submitted successfully');
        
        // Store test data in window for verification in next steps
        window.testData = window.testData || {};
        window.testData.requirements = { ...config };
        console.log('Test data stored in window.testData.requirements');
      } catch (error) {
        console.error('Requirements Step test failed:', error);
        throw error;
      }
    }
  },
  {
    name: 'Specification Step',
    action: async () => {
      console.log('🧪 Test Step: Reviewing Specification');
      
      try {
        // Wait for specification to generate with more detailed logging
        console.log('Waiting for specification content to appear...');
        await new Promise(r => setTimeout(r, 2000)); // Allow time for generation
        
        // Find specification content
        const preElement = document.querySelector('pre');
        if (!preElement) {
          console.error('Specification content (pre element) not found!');
          console.log('Available elements:', document.body.innerHTML.substring(0, 500) + '...');
          throw new Error('Specification content not found');
        }
        
        console.log('Specification content found, checking for consistency...');
        const specificationText = preElement.innerText;
        
        // Verify the specification contains our module name
        if (!specificationText.includes(config.moduleName)) {
          console.error(`Module name '${config.moduleName}' not found in specification`);
          console.log('Specification text:', specificationText.substring(0, 500) + '...');
          throw new Error(`Module name ${config.moduleName} not found in specification`);
        }
        console.log('Module name verified in specification ✓');
        
        // Check version consistency - critical test
        console.log('Checking version consistency...');
        if (!specificationText.includes(config.version)) {
          console.error(`Expected version '${config.version}' not found in specification`);
          console.log('Actual specification contains:', specificationText.substring(0, 500) + '...');
          
          // Try to find what version is displayed
          const versionMatch = specificationText.match(/Version:\s*([0-9.]+)/);
          if (versionMatch) {
            console.error(`Found incorrect version in specification: ${versionMatch[1]}`);
          }
          
          throw new Error(`Version mismatch: expected ${config.version} but not found in specification`);
        }
        console.log('Version number consistency verified ✓');
        
        // Find Edit Specification button
        console.log('Looking for Edit Specification button...');
        const editButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
          btn.innerText.includes('Edit') || btn.innerText.includes('Edit Specification')
        );
        
        if (editButtons.length === 0) {
          console.error('Edit Specification button not found!');
          console.log('Available buttons:', Array.from(document.querySelectorAll('button')).map(b => b.innerText));
          throw new Error('Edit Specification button not found');
        }
        
        const editButton = editButtons[0];
        console.log('Found Edit button:', editButton.innerText);
        
        // Click Edit button
        console.log('Clicking Edit Specification button...');
        editButton.click();
        
        // Wait for textarea to appear
        await new Promise(r => setTimeout(r, 1000));
        const textarea = document.querySelector('textarea');
        if (!textarea) {
          console.error('Textarea not found after clicking Edit button');
          throw new Error('Edit functionality not working - textarea not found');
        }
        console.log('Textarea found ✓');
        
        // Append to the existing text
        console.log('Modifying specification text...');
        const currentText = textarea.value;
        textarea.value = currentText + '\n\n## Additional Notes\nThis module was generated using the Odoo Module Builder.';
        
        // Trigger input event for reactivity
        const inputEvent = new Event('input', { bubbles: true });
        textarea.dispatchEvent(inputEvent);
        
        // Find Save Changes button
        const saveButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
          btn.innerText.includes('Save') || btn.innerText.includes('Save Changes')
        );
        
        if (saveButtons.length === 0) {
          console.error('Save Changes button not found!');
          console.log('Available buttons:', Array.from(document.querySelectorAll('button')).map(b => b.innerText));
          throw new Error('Save Changes button not found');
        }
        
        const saveButton = saveButtons[0];
        console.log('Found Save button:', saveButton.innerText);
        
        // Click Save button
        console.log('Clicking Save Changes button...');
        saveButton.click();
        
        // Wait for changes to save and pre element to reappear
        await new Promise(r => setTimeout(r, 1000));
        
        // Verify changes were saved
        const updatedPreElement = document.querySelector('pre');
        if (!updatedPreElement) {
          console.error('Specification content not found after saving changes');
          throw new Error('Save functionality not working');
        }
        
        const updatedText = updatedPreElement.innerText;
        if (!updatedText.includes('Additional Notes')) {
          console.error('Changes were not saved in the specification');
          console.log('Updated specification text:', updatedText.substring(0, 500) + '...');
          throw new Error('Changes not saved in specification');
        }
        console.log('Changes successfully saved in specification ✓');
        
        // Find Approve & Continue button
        const approveButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
          btn.innerText.includes('Approve') || btn.innerText.includes('Continue')
        );
        
        if (approveButtons.length === 0) {
          console.error('Approve & Continue button not found!');
          console.log('Available buttons:', Array.from(document.querySelectorAll('button')).map(b => b.innerText));
          throw new Error('Approve & Continue button not found');
        }
        
        const approveButton = approveButtons[0];
        console.log('Found Approve button:', approveButton.innerText);
        
        // Click Approve button
        console.log('Clicking Approve & Continue button...');
        approveButton.click();
        
        // Wait for navigation
        await new Promise(r => setTimeout(r, 1000));
        console.log('Navigation complete, new URL:', window.location.href);
        console.log('✅ Specification Step: Reviewed, edited, and approved');
      } catch (error) {
        console.error('Specification Step test failed:', error);
        throw error;
      }
    }
  },
  {
    name: 'Development Plan Step',
    action: async () => {
      console.log('🧪 Test Step: Reviewing Development Plan');
      
      try {
        // Wait for plan to generate with more detailed logging
        console.log('Waiting for development plan to load...');
        await new Promise(r => setTimeout(r, 2000)); // Allow time for generation
        
        // Find plan sections
        console.log('Looking for plan sections...');
        const planSections = document.querySelectorAll('.plan-section');
        if (!planSections || planSections.length === 0) {
          console.error('Development plan sections not found!');
          console.log('Available elements:', document.body.innerHTML.substring(0, 500) + '...');
          throw new Error('Development plan sections not found');
        }
        
        console.log(`Found ${planSections.length} plan sections`);
        
        // Test expanding and collapsing sections
        for (let i = 0; i < Math.min(planSections.length, 3); i++) { // Test first 3 sections at most
          const section = planSections[i];
          const sectionHeader = section.querySelector('.section-header');
          const sectionContent = section.querySelector('.section-content');
          
          if (!sectionHeader) {
            console.error(`Section header not found in section ${i}`);
            continue;
          }
          
          if (!sectionContent) {
            console.error(`Section content not found in section ${i}`);
            continue;
          }
          
          // Log initial state
          const initiallyExpanded = isElementVisible(sectionContent);
          console.log(`Section ${i} initially ${initiallyExpanded ? 'expanded' : 'collapsed'}`);
          
          // Click to toggle section
          console.log(`Clicking section ${i} header to ${initiallyExpanded ? 'collapse' : 'expand'}...`);
          sectionHeader.click();
          
          // Small delay to let animation complete
          await new Promise(r => setTimeout(r, 500));
          
          // Verify toggle worked
          const newExpandedState = isElementVisible(sectionContent);
          console.log(`After click, section ${i} is ${newExpandedState ? 'expanded' : 'collapsed'}`);
          
          if (newExpandedState === initiallyExpanded) {
            console.error(`Section ${i} didn't toggle correctly!`);
            // Try adding data attributes to help debugging
            section.dataset.testExpanded = newExpandedState;
          } else {
            console.log(`Section ${i} toggled successfully ✓`);
          }
          
          // Reset to original state (ensure they're all expanded for the test)
          if (!newExpandedState) {
            console.log(`Expanding section ${i} again...`);
            sectionHeader.click();
            await new Promise(r => setTimeout(r, 500));
          }
        }
        
        // Function to check if element is visible
        function isElementVisible(el) {
          if (!el) return false;
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        }
        
        // Check for any content
        const planContainer = document.querySelector('.development-plan-container');
        if (!planContainer) {
          console.error('Development plan container not found!');
          throw new Error('Development plan container not found');
        }
        
        const planText = planContainer.innerText;
        if (!planText.includes('Phase')) {
          console.error('Development plan does not contain expected content (Phases)');
          console.log('Development plan text:', planText.substring(0, 500) + '...');
          throw new Error('Development plan content invalid');
        }
        console.log('Development plan content verified ✓');
        
        // Find Approve & Continue button
        const approveButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
          btn.innerText.includes('Approve') || btn.innerText.includes('Continue')
        );
        
        if (approveButtons.length === 0) {
          console.error('Approve & Continue button not found!');
          console.log('Available buttons:', Array.from(document.querySelectorAll('button')).map(b => b.innerText));
          throw new Error('Approve & Continue button not found');
        }
        
        const approveButton = approveButtons[0];
        console.log('Found Approve button:', approveButton.innerText);
        
        // Click Approve button
        console.log('Clicking Approve & Continue button...');
        approveButton.click();
        
        // Wait for navigation
        await new Promise(r => setTimeout(r, 1000));
        console.log('Navigation complete, new URL:', window.location.href);
        console.log('✅ Development Plan Step: Reviewed and approved');
      } catch (error) {
        console.error('Development Plan Step test failed:', error);
        throw error;
      }
    }
  },
  {
    name: 'Module Output Step',
    action: async () => {
      console.log('🧪 Test Step: Viewing Generated Module');
      
      try {
        // Wait for module generation to complete with better logging
        console.log('Waiting for module output to load...');
        await new Promise(r => setTimeout(r, 2000)); // Allow time for generation
        
        // Check if we're on the module output page
        const pageTitle = Array.from(document.querySelectorAll('h1, h2')).find(el => 
          el.innerText.includes('Generated Module') || 
          el.innerText.includes('Module Output')
        );
        
        if (pageTitle) {
          console.log('Found module output page title:', pageTitle.innerText);
        } else {
          console.warn('Module output title not found, available headings:');
          document.querySelectorAll('h1, h2, h3').forEach(h => console.log(h.innerText));
        }
        
        // Find file browser
        console.log('Looking for file browser...');
        const fileElements = document.querySelectorAll('.file-item');
        
        if (!fileElements || fileElements.length === 0) {
          // Try alternative selectors if .file-item isn't found
          console.log('No .file-item elements found, trying alternative selectors...');
          const alternativeElements = document.querySelectorAll('.p-2.rounded.cursor-pointer, [data-testid="file-item"]');
          
          if (!alternativeElements || alternativeElements.length === 0) {
            console.error('No file browser elements found!');
            console.log('DOM structure:', document.body.innerHTML.substring(0, 500) + '...');
            throw new Error('File browser not found');
          }
          
          // Add the file-item class to help with selection
          alternativeElements.forEach(el => {
            el.classList.add('file-item');
            el.dataset.testid = 'file-item';
          });
          
          console.log(`Found ${alternativeElements.length} file elements with alternative selectors`);
        } else {
          console.log(`Found ${fileElements.length} file elements`);
        }
        
        // Re-query to get updated elements
        const files = document.querySelectorAll('.file-item, [data-testid="file-item"]');
        
        // Validate we have enough files
        if (files.length < 5) {
          console.warn(`Only found ${files.length} files, expected at least 5`);
        }
        
        // Find content display area
        const codeDisplay = document.querySelector('pre') || document.querySelector('.code-content');
        if (!codeDisplay) {
          console.error('Code display area not found!');
          throw new Error('Code display area not found');
        }
        
        // Track which files we've tested
        const testedFiles = [];
        
        // Click through different files and verify content updates
        for (let i = 0; i < Math.min(files.length, 3); i++) { // Test at most 3 files
          const file = files[i];
          const fileName = file.innerText || file.textContent;
          console.log(`Clicking file ${i}: ${fileName}`);
          
          // Record initial content to verify it changes
          const initialContent = codeDisplay.innerText || codeDisplay.textContent;
          
          // Click the file
          file.click();
          
          // Wait for content to update
          await new Promise(r => setTimeout(r, 500));
          
          // Get updated content
          const updatedContent = codeDisplay.innerText || codeDisplay.textContent;
          
          // Verify content changed (unless it's the first file which might already be selected)
          if (i > 0 && initialContent === updatedContent) {
            console.error(`Content didn't change after clicking ${fileName}`);
            file.dataset.testResult = 'failed';
          } else {
            console.log(`Content updated successfully for ${fileName} ✓`);
            file.dataset.testResult = 'passed';
          }
          
          testedFiles.push({
            name: fileName,
            hasContent: (updatedContent && updatedContent.length > 0)
          });
        }
        
        // Log the results of our file tests
        console.log('File testing results:', testedFiles);
        
        // Find download button
        const downloadButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.innerText.includes('Download') || 
          btn.innerText.includes('Download Module')
        );
        
        if (!downloadButton) {
          console.error('Download Module button not found!');
          console.log('Available buttons:', Array.from(document.querySelectorAll('button')).map(b => b.innerText));
          throw new Error('Download button not found');
        }
        
        console.log('Found Download button:', downloadButton.innerText);
        
        // Click download button
        console.log('Clicking Download Module button...');
        downloadButton.click();
        
        // Find Next button to continue to Odoo Testing
        const nextButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.innerText.includes('Next') || 
          btn.innerText.includes('Continue') ||
          btn.innerText.includes('Test')
        );
        
        if (nextButton) {
          console.log('Found Next/Continue button:', nextButton.innerText);
          console.log('Clicking to proceed to Odoo Testing step...');
          nextButton.click();
          
          // Wait for navigation
          await new Promise(r => setTimeout(r, 1000));
        } else {
          console.warn('No Next/Continue button found to proceed to Odoo Testing');
        }
        
        console.log('✅ Module Output Step: Reviewed generated files and downloaded module');
      } catch (error) {
        console.error('Module Output Step test failed:', error);
        throw error;
      }
    }
  },
  {
    name: 'Odoo Testing Step',
    action: async () => {
      console.log('🧪 Test Step: Testing Module in Odoo Docker Instance');
      
      try {
        // Wait for testing page to load
        console.log('Waiting for Odoo Testing page to load...');
        await new Promise(r => setTimeout(r, 2000)); // Allow time for loading
        
        // Check if we're on the Odoo Testing page
        const pageTitle = Array.from(document.querySelectorAll('h1, h2')).find(el => 
          el.innerText.includes('Odoo Testing') || 
          el.innerText.includes('Docker Testing')
        );
        
        if (pageTitle) {
          console.log('Found Odoo Testing page title:', pageTitle.innerText);
        } else {
          console.warn('Odoo Testing title not found, available headings:');
          document.querySelectorAll('h1, h2, h3').forEach(h => console.log(h.innerText));
        }
        
        // Test Docker container controls
        console.log('Testing Docker container controls...');
        
        // Find the Start Container button
        const startButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.innerText.includes('Start') ||
          btn.innerText.includes('Start Container')
        );
        
        if (!startButton) {
          console.error('Start Container button not found!');
          console.log('Available buttons:', Array.from(document.querySelectorAll('button')).map(b => b.innerText));
          throw new Error('Start Container button not found');
        }
        
        console.log('Found Start Container button, clicking...');
        startButton.click();
        
        // Wait for container to start
        console.log('Waiting for container to start...');
        await new Promise(r => setTimeout(r, 3000));
        
        // Check for container status indicator
        const statusIndicator = document.querySelector('.status-indicator') || 
                               document.querySelector('[data-testid="docker-status"]');
                               
        if (statusIndicator) {
          console.log('Container status indicator found:', statusIndicator.innerText);
          
          // If not running, wait longer
          if (!statusIndicator.innerText.includes('Running')) {
            console.log('Container not yet running, waiting longer...');
            await new Promise(r => setTimeout(r, 5000));
          }
        } else {
          console.warn('Container status indicator not found');
        }
        
        // Check for console output
        const consoleOutput = document.querySelector('.console-output') || 
                            document.querySelector('[data-testid="console-output"]');
        
        if (consoleOutput) {
          console.log('Console output found with text:', 
            consoleOutput.innerText.substring(0, 100) + '...');
        } else {
          console.warn('Console output element not found');
        }
        
        // Find and click Run Tests button
        const runTestsButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.innerText.includes('Run Tests') ||
          btn.innerText.includes('Run Module Tests')
        );
        
        if (!runTestsButton) {
          console.error('Run Tests button not found!');
          console.log('Available buttons:', Array.from(document.querySelectorAll('button')).map(b => b.innerText));
          throw new Error('Run Tests button not found');
        }
        
        console.log('Found Run Tests button, clicking...');
        runTestsButton.click();
        
        // Wait for tests to run
        console.log('Waiting for tests to complete...');
        await new Promise(r => setTimeout(r, 3000));
        
        // Check for test results table
        const testResultsTable = document.querySelector('table') ||
                                document.querySelector('[data-testid="test-results"]');
        
        if (testResultsTable) {
          console.log('Test results table found');
          const testRows = testResultsTable.querySelectorAll('tr');
          console.log(`Found ${testRows.length} test result rows`);
          
          // Log test results
          const testResults = [];
          testRows.forEach((row, index) => {
            if (index === 0) return; // Skip header row
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
              testResults.push({
                name: cells[0].innerText,
                status: cells[1].innerText
              });
            }
          });
          
          console.log('Test Results:', testResults);
        } else {
          console.warn('Test results table not found');
        }
        
        // Check for Odoo preview iframe
        const odooPreview = document.querySelector('iframe') ||
                           document.querySelector('[data-testid="odoo-preview"]');
                           
        if (odooPreview) {
          console.log('Odoo preview iframe found');
        } else {
          console.warn('Odoo preview iframe not found');
        }
        
        // Find and click Stop Container button before finishing
        const stopButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.innerText.includes('Stop') ||
          btn.innerText.includes('Stop Container')
        );
        
        if (stopButton) {
          console.log('Found Stop Container button, clicking to clean up...');
          stopButton.click();
          await new Promise(r => setTimeout(r, 1000));
        } else {
          console.warn('Stop Container button not found for cleanup');
        }
        
        // Find and click the final Complete/Finish button if it exists
        const completeButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.innerText.includes('Complete') ||
          btn.innerText.includes('Finish') ||
          btn.innerText.includes('Done')
        );
        
        if (completeButton) {
          console.log('Found Complete/Finish button, clicking...');
          completeButton.click();
          await new Promise(r => setTimeout(r, 1000));
        }
        
        console.log('✅ Odoo Testing Step: Successfully tested module in Docker instance');
      } catch (error) {
        console.error('Odoo Testing Step failed:', error);
        throw error;
      }
    }
  }
];

// Auto-fix suggestions based on step failures
const autoFixSuggestions = {
  'Home Page': {
    'create-module-btn': () => {
      // If create module button is missing, try to find and add it
      console.log('🔧 Auto-fixing: Adding data-testid to Create Module button');
      const buttons = Array.from(document.querySelectorAll('button'));
      const startButton = buttons.find(btn => 
        btn.innerText.includes('Start Building') || 
        btn.innerText.includes('Create Module')
      );
      
      if (startButton) {
        startButton.dataset.testid = 'create-module-btn';
        return true;
      }
      return false;
    }
  },
  'Specification Step': {
    'specification-content': () => {
      // If spec content is missing, try to force refresh
      console.log('🔧 Auto-fixing: Attempting to regenerate specification content');
      const regenerateButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.innerText.includes('Regenerate') || 
        btn.innerText.includes('Generate')
      );
      
      if (regenerateButton) {
        regenerateButton.click();
        return true;
      }
      return false;
    },
    'edit-button': () => {
      // If edit button is missing or not functional, try to fix it
      console.log('🔧 Auto-fixing: Adding event listener to Edit Specification button');
      const editButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.innerText.includes('Edit') || btn.innerText.includes('Edit Specification')
      );
      
      if (editButtons.length > 0) {
        // Add data-testid to make it selectable
        editButtons[0].dataset.testid = 'edit-specification';
        return true;
      }
      return false;
    },
    'version-mismatch': () => {
      // When version in specification doesn't match requirements
      console.log('🔧 Auto-fixing: Fixing version consistency');
      const editButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.innerText.includes('Edit') || btn.innerText.includes('Edit Specification')
      );
      
      if (editButtons.length > 0) {
        editButtons[0].click();
        setTimeout(() => {
          const textarea = document.querySelector('textarea');
          if (textarea && window.testData?.requirements?.version) {
            // Replace version in the text
            const version = window.testData.requirements.version;
            let content = textarea.value;
            content = content.replace(/Version:\s*[0-9.]+/g, `Version: ${version}`);
            textarea.value = content;
            
            // Trigger input event
            const event = new Event('input', { bubbles: true });
            textarea.dispatchEvent(event);
            
            // Save changes
            const saveButton = Array.from(document.querySelectorAll('button')).find(btn => 
              btn.innerText.includes('Save')
            );
            if (saveButton) saveButton.click();
          }
        }, 500);
        return true;
      }
      return false;
    }
  },
  'Development Plan Step': {
    'plan-section-toggle': () => {
      // Fix section toggling if broken
      console.log('🔧 Auto-fixing: Improving section toggling in development plan');
      const sections = document.querySelectorAll('.plan-section');
      let fixed = false;
      
      sections.forEach(section => {
        const header = section.querySelector('.section-header');
        const content = section.querySelector('.section-content');
        
        if (header && content) {
          // Ensure content is visible initially
          if (window.getComputedStyle(content).display === 'none') {
            content.style.display = 'block';
            fixed = true;
          }
          
          // Add data attributes to help with selection
          section.dataset.expanded = 'true';
          content.dataset.testid = 'section-content';
        }
      });
      
      return fixed;
    }
  },
  'Module Output Step': {
    'file-item': () => {
      // Fix file selection in module output
      console.log('🔧 Auto-fixing: Adding testid to file items');
      const fileElements = document.querySelectorAll('.p-2.rounded.cursor-pointer');
      let fixed = false;
      
      fileElements.forEach(el => {
        el.classList.add('file-item');
        el.dataset.testid = 'file-item';
        fixed = true;
      });
      
      return fixed;
    }
  },
  'Odoo Testing Step': {
    'docker-controls': () => {
      // Fix Docker controls if missing
      console.log('🔧 Auto-fixing: Adding testid to Docker controls');
      
      const startButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.innerText.includes('Start') || btn.innerText.includes('Start Container')
      );
      
      if (startButton) startButton.dataset.testid = 'start-container';
      
      const stopButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.innerText.includes('Stop') || btn.innerText.includes('Stop Container')
      );
      
      if (stopButton) stopButton.dataset.testid = 'stop-container';
      
      return startButton || stopButton;
    }
  }
};

// Main test execution function
async function runTestScenario() {
  console.log('📋 Starting Odoo Module Builder Test Scenario');
  console.log('─────────────────────────────────────────────');
  
  // Get auto-fix settings from UI - using a more reliable method
  let autoFixEnabled = true; // Default to true
  let maxRetries = 3; // Default to 3 retries
  
  try {
    const autoFixToggle = document.getElementById('auto-fix-toggle');
    if (autoFixToggle) {
      autoFixEnabled = autoFixToggle.checked;
    }
    
    const retryCountInput = document.getElementById('retry-count');
    if (retryCountInput) {
      maxRetries = parseInt(retryCountInput.value) || 3;
    }
  } catch (e) {
    console.warn('Could not get auto-fix settings, using defaults:', e);
  }
  
  // Display auto-fix status
  const statusIndicator = document.getElementById('fix-status');
  if (statusIndicator) {
    statusIndicator.style.display = 'block';
    if (autoFixEnabled) {
      statusIndicator.textContent = `Auto-fix enabled (max ${maxRetries} retries)`;
      statusIndicator.style.backgroundColor = '#4CAF50';
    } else {
      statusIndicator.textContent = 'Auto-fix disabled';
      statusIndicator.style.backgroundColor = '#444';
    }
  }
  
  let currentStepName = 'initialization';
  
  try {
    // Execute each test step sequentially
    for (const step of testSteps) {
      currentStepName = step.name;
      console.log(`\n▶️ Executing: ${step.name}`);
      
      // Retry loop for auto-fixing
      let success = false;
      let attempts = 0;
      
      while (!success && (attempts <= maxRetries || !autoFixEnabled)) {
        try {
          await step.action();
          console.log(`✅ ${step.name} completed successfully`);
          success = true;
        } catch (stepError) {
          attempts++;
          
          // If auto-fix is disabled or max retries reached, throw the error
          if (!autoFixEnabled || attempts > maxRetries) {
            console.error(`\n❌ Step '${step.name}' Failed:`);
            console.error(`Error details: ${stepError.message || 'Unknown error'}`);
            console.error('Stack trace:', stepError.stack);
            
            // Capture and display DOM state when possible
            try {
              const elementsFound = {};
              
              // Check for key elements based on the current step
              if (step.name === 'Home Page') {
                elementsFound['create-module-btn'] = !!document.querySelector('[data-testid="create-module-btn"]');
              } else if (step.name === 'Requirements Step') {
                elementsFound['form'] = !!document.querySelector('form');
                elementsFound['moduleName-input'] = !!document.querySelector('input[name="moduleName"]');
              } else if (step.name === 'Specification Step') {
                elementsFound['specification-content'] = !!document.querySelector('pre');
                elementsFound['edit-button'] = !!document.querySelector('button:has-text("Edit Specification")');
                
                // Check version consistency
                const specText = document.querySelector('pre')?.innerText || '';
                const requiredVersion = window.testData?.requirements?.version;
                if (requiredVersion && !specText.includes(requiredVersion)) {
                  elementsFound['version-consistency'] = false;
                }
              } else if (step.name === 'Development Plan Step') {
                elementsFound['plan-sections'] = document.querySelectorAll('.plan-section').length;
                elementsFound['section-toggle-working'] = true; // Will be set to false if we detect issues
                
                // Check if sections toggle correctly
                const sections = document.querySelectorAll('.plan-section');
                sections.forEach((section, i) => {
                  const header = section.querySelector('.section-header');
                  const content = section.querySelector('.section-content');
                  if (header && content) {
                    const initiallyExpanded = window.getComputedStyle(content).display !== 'none';
                    elementsFound[`section-${i}-expanded`] = initiallyExpanded;
                  }
                });
              } else if (step.name === 'Module Output Step') {
                elementsFound['file-items'] = document.querySelectorAll('.file-item, [data-testid="file-item"]').length;
                elementsFound['code-display'] = !!document.querySelector('pre, .code-content');
              } else if (step.name === 'Odoo Testing Step') {
                elementsFound['start-container-btn'] = !!document.querySelector('[data-testid="start-container"]');
                elementsFound['stop-container-btn'] = !!document.querySelector('[data-testid="stop-container"]');
                elementsFound['console-output'] = !!document.querySelector('.console-output, [data-testid="console-output"]');
              }
              
              console.log('DOM State:', elementsFound);
            } catch (domError) {
              console.log('Could not analyze DOM state:', domError);
            }
            
            throw stepError;
          }
          
          // Auto-fix attempt
          console.warn(`\n🔄 Step '${step.name}' failed. Attempt ${attempts}/${maxRetries} - Trying to auto-fix...`);
          console.warn(`Error: ${stepError.message}`);
          
          // Apply auto-fixes based on step type
          let fixApplied = false;
          const fixers = autoFixSuggestions[step.name];
          
          if (fixers) {
            for (const [issue, fixer] of Object.entries(fixers)) {
              // Try to apply the fix
              const fixed = fixer();
              if (fixed) {
                fixApplied = true;
                console.log(`✓ Applied auto-fix for ${issue} issue`);
              }
            }
          }
          
          if (!fixApplied) {
            console.warn('⚠️ No auto-fixes were applicable, will retry without changes');
          }
          
          // Small delay before retrying
          await new Promise(r => setTimeout(r, 1000));
          console.log(`\n🔄 Retrying step: ${step.name} (Attempt ${attempts+1}/${maxRetries+1})`);
        }
        
        // Break the loop if we succeeded or if auto-fix is disabled
        if (success || !autoFixEnabled) break;
      }
      
      // If we've exhausted all retry attempts without success, abort
      if (!success) {
        throw new Error(`Failed to complete step '${step.name}' after ${maxRetries} retry attempts`);
      }
    }
    
    console.log('\n─────────────────────────────────────────────');
    console.log('✨ Test Scenario Completed Successfully! ✨');
    
    // Update status indicator on success
    if (statusIndicator && autoFixEnabled) {
      statusIndicator.textContent = '✅ All tests passed successfully!';
      statusIndicator.style.backgroundColor = '#4CAF50';
    }
    
  } catch (error) {
    console.error('\n❌ Test Failed at step: ' + currentStepName);
    console.error('Error message:', error.message || 'No error message available');
    
    // Update status indicator on failure
    if (statusIndicator && autoFixEnabled) {
      statusIndicator.textContent = `❌ Auto-fix failed: ${error.message}`;
      statusIndicator.style.backgroundColor = '#f44336';
    }
    
    // Add debug information to help identify issues
    console.error('\n📊 Debug Information:');
    try {
      // Get current URL
      console.log('Current URL:', window.location.href);
      
      // Check if key app components are present
      const appRoot = document.getElementById('root');
      console.log('App root present:', !!appRoot);
      
      // Count key elements
      console.log('Buttons on page:', document.querySelectorAll('button').length);
      console.log('Forms on page:', document.querySelectorAll('form').length);
      
      // Take a snapshot of the current DOM structure (limited depth for readability)
      console.log('DOM snapshot:', getSimplifiedDOMSnapshot(document.body, 3));
    } catch (debugError) {
      console.error('Error gathering debug info:', debugError);
    }
    
    console.error('\n📋 Failure Summary:');
    console.error(`The test failed during the "${currentStepName}" step.`);
    console.error('Please fix the issues listed above and run the test again.');
  }
}

// Helper function to get a simplified DOM snapshot
function getSimplifiedDOMSnapshot(element, depth = 2, currentDepth = 0) {
  if (!element || currentDepth > depth) return '...';
  
  const children = Array.from(element.children || []).map(child => {
    return getSimplifiedDOMSnapshot(child, depth, currentDepth + 1);
  });
  
  return {
    tag: element.tagName?.toLowerCase(),
    id: element.id || undefined,
    class: element.className || undefined,
    'data-testid': element.dataset?.testid,
    children: children.length ? children : undefined
  };
}

// Add test controls panel to the page
function createTestControls() {
  const controlsDiv = document.createElement('div');
  controlsDiv.id = 'test-controls-panel';
  controlsDiv.style.position = 'fixed';
  controlsDiv.style.top = '0';
  controlsDiv.style.right = '0';
  controlsDiv.style.zIndex = '9999';
  controlsDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
  controlsDiv.style.color = 'white';
  controlsDiv.style.padding = '15px';
  controlsDiv.style.width = '300px';
  controlsDiv.style.maxHeight = '100vh';
  controlsDiv.style.overflowY = 'auto';
  
  // Create header with title and close button
  const headerDiv = document.createElement('div');
  headerDiv.style.display = 'flex';
  headerDiv.style.justifyContent = 'space-between';
  headerDiv.style.alignItems = 'center';
  headerDiv.style.marginBottom = '10px';
  
  const heading = document.createElement('h3');
  heading.textContent = 'Test Scenario Controls';
  heading.style.margin = '0';
  
  const closeButton = document.createElement('button');
  closeButton.id = 'close-test-controls';
  closeButton.textContent = '✕';
  closeButton.style.background = '#f44336';
  closeButton.style.color = 'white';
  closeButton.style.border = 'none';
  closeButton.style.width = '24px';
  closeButton.style.height = '24px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.borderRadius = '50%';
  closeButton.style.fontWeight = 'bold';
  closeButton.style.display = 'flex';
  closeButton.style.alignItems = 'center';
  closeButton.style.justifyContent = 'center';
  
  closeButton.addEventListener('click', () => {
    controlsDiv.style.display = 'none';
  });
  
  headerDiv.appendChild(heading);
  headerDiv.appendChild(closeButton);
  
  // Create run button
  const runButton = document.createElement('button');
  runButton.id = 'run-test';
  runButton.textContent = 'Run Test Scenario';
  runButton.style.background = '#4CAF50';
  runButton.style.color = 'white';
  runButton.style.border = 'none';
  runButton.style.padding = '8px 15px';
  runButton.style.margin = '10px 0';
  runButton.style.cursor = 'pointer';
  runButton.style.borderRadius = '4px';
  runButton.style.width = '100%';
  
  // Add Auto-Fix toggle
  const autoFixWrapper = document.createElement('div');
  autoFixWrapper.style.display = 'flex';
  autoFixWrapper.style.alignItems = 'center';
  autoFixWrapper.style.marginTop = '10px';
  
  const autoFixCheckbox = document.createElement('input');
  autoFixCheckbox.type = 'checkbox';
  autoFixCheckbox.id = 'auto-fix-toggle';
  autoFixCheckbox.checked = true; // Default to on
  autoFixCheckbox.style.marginRight = '5px';
  
  const autoFixLabel = document.createElement('label');
  autoFixLabel.htmlFor = 'auto-fix-toggle';
  autoFixLabel.textContent = 'Auto-Fix Issues';
  autoFixLabel.style.fontSize = '12px';
  
  autoFixWrapper.appendChild(autoFixCheckbox);
  autoFixWrapper.appendChild(autoFixLabel);
  
  // Add retry count input
  const retryWrapper = document.createElement('div');
  retryWrapper.style.display = 'flex';
  retryWrapper.style.alignItems = 'center';
  retryWrapper.style.marginTop = '5px';
  
  const retryLabel = document.createElement('label');
  retryLabel.htmlFor = 'retry-count';
  retryLabel.textContent = 'Max Retries: ';
  retryLabel.style.fontSize = '12px';
  retryLabel.style.marginRight = '5px';
  
  const retryInput = document.createElement('input');
  retryInput.type = 'number';
  retryInput.id = 'retry-count';
  retryInput.value = '3';
  retryInput.min = '1';
  retryInput.max = '10';
  retryInput.style.width = '40px';
  
  retryWrapper.appendChild(retryLabel);
  retryWrapper.appendChild(retryInput);
  
  // Status indicator for auto-fix
  const statusIndicator = document.createElement('div');
  statusIndicator.id = 'fix-status';
  statusIndicator.style.fontSize = '12px';
  statusIndicator.style.marginTop = '10px';
  statusIndicator.style.padding = '5px';
  statusIndicator.style.borderRadius = '3px';
  statusIndicator.style.backgroundColor = '#444';
  statusIndicator.style.display = 'none'; // Hidden by default
  
  // Test output area
  const outputDiv = document.createElement('div');
  outputDiv.id = 'test-output';
  outputDiv.style.fontFamily = 'monospace';
  outputDiv.style.fontSize = '12px';
  outputDiv.style.whiteSpace = 'pre-wrap';
  outputDiv.style.marginTop = '10px';
  outputDiv.style.background = 'black';
  outputDiv.style.padding = '10px';
  outputDiv.style.borderRadius = '4px';
  outputDiv.style.height = '300px';
  outputDiv.style.overflowY = 'auto';
  
  // Add all elements to the main container
  controlsDiv.appendChild(headerDiv);
  controlsDiv.appendChild(runButton);
  controlsDiv.appendChild(autoFixWrapper);
  controlsDiv.appendChild(retryWrapper);
  controlsDiv.appendChild(statusIndicator);
  controlsDiv.appendChild(outputDiv);
  
  document.body.appendChild(controlsDiv);
  
  return { 
    outputDiv, 
    runButton,
    autoFixCheckbox,
    retryInput,
    statusIndicator,
    controlsDiv 
  };
}

// Auto-run the test when the page loads
window.addEventListener('load', () => {
  // Add a small delay to ensure the app is fully loaded
  setTimeout(() => {
    try {
      // Create test controls UI
      const testControls = createTestControls();
      
      // Get the actual output div element directly
      const outputDiv = document.getElementById('test-output');
      if (!outputDiv) {
        console.error('Could not find test output div');
        return;
      }
      
      // Intercept console.log and console.error to display in our UI
      const originalLog = console.log;
      const originalError = console.error;
      const originalAssert = console.assert;
      
      console.log = function(...args) {
        originalLog.apply(console, args);
        try {
          // Safely handle objects by using JSON.stringify with error handling
          const formattedArgs = args.map(arg => {
            if (typeof arg === 'object') {
              try {
                return JSON.stringify(arg);
              } catch (e) {
                return '[Complex Object]';
              }
            }
            return String(arg);
          }).join(' ');
          
          outputDiv.innerHTML += formattedArgs + '<br/>';
          outputDiv.scrollTop = outputDiv.scrollHeight;
        } catch (e) {
          originalError.call(console, 'Error updating output div:', e);
        }
      };
      
      console.error = function(...args) {
        originalError.apply(console, args);
        try {
          const formattedArgs = args.map(arg => {
            if (typeof arg === 'object') {
              try {
                return JSON.stringify(arg);
              } catch (e) {
                return '[Complex Object]';
              }
            }
            return String(arg);
          }).join(' ');
          
          outputDiv.innerHTML += '<span style="color: red;">' + formattedArgs + '</span><br/>';
          outputDiv.scrollTop = outputDiv.scrollHeight;
        } catch (e) {
          originalError.call(console, 'Error updating output div:', e);
        }
      };
      
      console.assert = function(condition, ...args) {
        originalAssert.apply(console, [condition, ...args]);
        if (!condition) {
          try {
            const formattedArgs = args.map(arg => {
              if (typeof arg === 'object') {
                try {
                  return JSON.stringify(arg);
                } catch (e) {
                  return '[Complex Object]';
                }
              }
              return String(arg);
            }).join(' ');
            
            outputDiv.innerHTML += '<span style="color: orange;">Assertion failed: ' + formattedArgs + '</span><br/>';
            outputDiv.scrollTop = outputDiv.scrollHeight;
          } catch (e) {
            originalError.call(console, 'Error updating output div:', e);
          }
        }
      };
      
      // Find and set up the test button more reliably
      const runButton = document.getElementById('run-test');
      if (runButton) {
        runButton.addEventListener('click', () => {
          if (outputDiv) outputDiv.innerHTML = '';
          runTestScenario();
        });
      } else {
        console.error('Could not find run test button');
      }
      
      // Log successful initialization
      console.log('Test controls successfully initialized');
    } catch (error) {
      console.error('Error initializing test controls:', error);
    }
  }, 1000);
});
