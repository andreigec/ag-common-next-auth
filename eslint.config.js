const e7config = require('eslint-config-e7npm');

module.exports = [
  ...e7config,
  {
    files: ['**/*.ts', '**/*.tsx']    
  }
];