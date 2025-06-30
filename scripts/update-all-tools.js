/**
 * This script lists all tool files that need to be updated to use the new error handling approach.
 * It doesn't modify the files automatically but provides a checklist for manual updates.
 */

const fs = require('fs');
const path = require('path');

// Path to the tools directory
const toolsDir = path.join(__dirname, '..', 'lib', 'tools');

// Files that have already been updated
const updatedFiles = [
  'exception.tsx',
  'documents.tsx',
  'shipment.tsx'
];

// Check if a file has been updated
function isFileUpdated(fileName) {
  return updatedFiles.includes(fileName);
}

// Get all tool files
function getToolFiles() {
  return fs.readdirSync(toolsDir)
    .filter(file => file.endsWith('.tsx'))
    .map(file => ({
      name: file,
      path: path.join(toolsDir, file),
      updated: isFileUpdated(file)
    }));
}

// Check if a file uses the new approach
function checkFileContent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return {
    usesCreateTool: content.includes('createTool'),
    usesErrorHandler: content.includes('errorHandler'),
    usesODataHelpers: content.includes('odataHelpers'),
    usesFieldMappings: content.includes('fieldMappings')
  };
}

// Generate the report
function generateReport() {
  const files = getToolFiles();
  

  
  files.forEach(file => {
    const checks = checkFileContent(file.path);

  });
  

  const filesToUpdate = files.filter(file => !file.updated);
  
  if (filesToUpdate.length === 0) {

  } else {
    filesToUpdate.forEach(file => {
    });
  }
}

// Run the report
generateReport();