// tools/update-tree.js
/* eslint-disable */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default excluded directories and files
const DEFAULT_EXCLUDES = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.DS_Store',
  '.cache',
  '.npm',
  '.next',
  'coverage',
  '.vscode',
  'out',
  'npm-debug.log',
  'yarn-debug.log',
  'yarn-error.log',
  '.yarn',
  '.pnp',
  '.pnpm-store',
  '.venv',
  'venv',
  'env',
  '__pycache__',
  '*.pyc',
  '.idea',
  '*.swp',
  '*.swo',
  '.github',
  'resources',
  '.editorconfig',
  '.eslintignore',
  '.eslintrc',
  '.prettierignore',
  '.prettierrc',
  '.env*',
  '*.code-workspace',
  'pnpm*',
  '.firebase',
  'emulator-data',
  'database-debug.log',
  'firebase-debug.log',
];

// Configuration
const config = {
  rootDir: path.resolve(__dirname, '..'), // Go up one level from the tools directory
  outputFile: path.resolve(__dirname, '..', 'file-tree.txt'), // Save to project root
  maxDepth: Infinity,
  indentation: '  ',
  excludes: [...DEFAULT_EXCLUDES],
};

// Parse command line arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--output' || arg === '-o') {
    config.outputFile = args[++i];
  } else if (arg === '--max-depth' || arg === '-d') {
    config.maxDepth = parseInt(args[++i], 10);
  } else if (arg === '--exclude' || arg === '-e') {
    config.excludes.push(args[++i]);
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Generate File Tree Script

Usage:
  node generate-file-tree.js [options]

Options:
  --output, -o        Output file name (default: file-tree.txt in project root)
  --max-depth, -d     Maximum directory depth (default: unlimited)
  --exclude, -e       Additional patterns to exclude (can be used multiple times)
  --help, -h          Show this help message

Default excluded patterns:
  ${DEFAULT_EXCLUDES.join(', ')}
    `);
    process.exit(0);
  }
}

// Function to check if a path should be excluded
function shouldExclude(itemPath) {
  const basename = path.basename(itemPath);

  for (const pattern of config.excludes) {
    // Handle glob pattern with wildcard at the beginning or end
    if (pattern.startsWith('*') && basename.endsWith(pattern.slice(1))) {
      return true;
    }
    if (pattern.endsWith('*') && basename.startsWith(pattern.slice(0, -1))) {
      return true;
    }
    // Handle exact match
    if (pattern === basename) {
      return true;
    }
    // Match any path component
    if (
      itemPath.includes('/' + pattern + '/') ||
      itemPath.includes('\\' + pattern + '\\')
    ) {
      return true;
    }
  }

  return false;
}

// Generate the file tree recursively
function generateTree(dir, prefix = '', depth = 0) {
  if (depth > config.maxDepth) {
    return '';
  }

  let output = '';
  const items = fs.readdirSync(dir, { withFileTypes: true });

  // Sort items: directories first, then files
  items.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemPath = path.join(dir, item.name);
    const relativePath = path.relative(config.rootDir, itemPath);

    if (shouldExclude(relativePath) || shouldExclude(item.name)) {
      continue;
    }

    const isLast = i === items.length - 1;
    const itemPrefix = isLast ? '└── ' : '├── ';
    const nextPrefix = isLast ? '    ' : '│   ';

    output += `${prefix}${itemPrefix}${item.name}\n`;

    if (item.isDirectory()) {
      output += generateTree(itemPath, prefix + nextPrefix, depth + 1);
    }
  }

  return output;
}

// Main function
function main() {
  try {
    console.log(`Generating file tree for ${config.rootDir}`);
    console.log(`Excluding: ${config.excludes.join(', ')}`);

    // Generate the file tree
    const tree = `.
${generateTree(config.rootDir)}`;

    // Write to file
    fs.writeFileSync(config.outputFile, tree);

    console.log(`File tree generated successfully: ${config.outputFile}`);
    console.log(`Total lines: ${tree.split('\n').length}`);
  } catch (error) {
    console.error('Error generating file tree:', error);
    process.exit(1);
  }
}

main();
