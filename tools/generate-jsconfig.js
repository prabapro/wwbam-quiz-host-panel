// tools/generate-jsconfig.js

/**
 * Vite to JSConfig Alias Synchronization Script
 *
 * ROOT CAUSE:
 * VS Code requires path aliases to be defined in jsconfig.json for proper "Go to Definition"
 * functionality and IntelliSense support. However, Vite uses its own alias configuration in
 * vite.config.js, leading to a duplication problem where aliases must be maintained in both files.
 *
 * THE PROBLEM:
 * - Vite resolves imports using aliases defined in vite.config.js (e.g., '@/components/Button')
 * - VS Code needs the same aliases in jsconfig.json to provide navigation and autocomplete
 * - Manual synchronization is error-prone and easy to forget when adding new aliases
 * - Mismatched aliases cause VS Code to show "Cannot find module" errors despite working builds
 *
 * WHY THIS SCRIPT IS USEFUL:
 * ✅ Eliminates manual duplication of alias definitions
 * ✅ Ensures VS Code can navigate to aliased imports (Ctrl/Cmd + Click)
 * ✅ Provides proper IntelliSense and autocomplete for aliased paths
 * ✅ Prevents "module not found" errors in VS Code editor
 * ✅ Automatically stays in sync when Vite aliases are updated
 * ✅ Creates backups and shows detailed change comparisons
 * ✅ Integrates into development workflow (can run before dev/build)
 *
 * USAGE:
 * Run this script whenever you modify aliases in vite.config.js to keep jsconfig.json in sync.
 * Best practice: Add to package.json scripts and run automatically before dev/build commands.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  viteConfigPath: path.resolve(__dirname, '../vite.config.js'),
  jsconfigPath: path.resolve(__dirname, '../jsconfig.json'),
  backupPath: path.resolve(__dirname, '../jsconfig.json.backup'),
};

/**
 * Extract aliases from Vite config file
 * @param {string} viteConfigPath - Path to vite.config.js
 * @returns {Object} Extracted aliases
 */
async function extractViteAliases(viteConfigPath) {
  try {
    const viteConfigContent = await fs.readFile(viteConfigPath, 'utf8');

    // Extract the resolve.alias section using regex
    const aliasMatch = viteConfigContent.match(
      /resolve:\s*{[^}]*alias:\s*{([^}]+)}/s,
    );

    if (!aliasMatch) {
      throw new Error('Could not find resolve.alias section in vite.config.js');
    }

    const aliasSection = aliasMatch[1];
    const aliases = {};

    // Extract individual alias entries
    const aliasRegex =
      /['"`]?([^'"`:\s]+)['"`]?\s*:\s*resolve\(__dirname,\s*['"`]([^'"`]+)['"`]\)/g;
    let match;

    while ((match = aliasRegex.exec(aliasSection)) !== null) {
      const [, aliasKey, aliasPath] = match;
      aliases[aliasKey] = aliasPath;
    }

    return aliases;
  } catch (error) {
    throw new Error(
      `Failed to extract aliases from Vite config: ${error.message}`,
    );
  }
}

/**
 * Convert Vite aliases to jsconfig.json path format
 * @param {Object} viteAliases - Aliases from Vite config
 * @returns {Object} Formatted paths for jsconfig.json
 */
function convertToJsconfigPaths(viteAliases) {
  const jsconfigPaths = {};

  Object.entries(viteAliases).forEach(([alias, targetPath]) => {
    // Convert absolute path to relative path from project root
    let relativePath = targetPath;

    // Handle different path formats from Vite config
    if (relativePath.startsWith('./')) {
      // Remove leading './'
      relativePath = relativePath.slice(2);
    } else if (relativePath.startsWith('/')) {
      // Remove leading '/'
      relativePath = relativePath.slice(1);
    }

    // Don't add extra 'src/' prefix if it's already there
    // The path from Vite should already be correct (e.g., './src' becomes 'src')

    // Add trailing /* for both alias and path for proper TypeScript resolution
    const aliasPattern = alias.endsWith('/*') ? alias : `${alias}/*`;
    const pathPattern = relativePath.endsWith('/*')
      ? relativePath
      : `${relativePath}/*`;

    jsconfigPaths[aliasPattern] = [pathPattern];
  });

  return jsconfigPaths;
}

/**
 * Read existing jsconfig.json or create default structure
 * @param {string} jsconfigPath - Path to jsconfig.json
 * @returns {Object} Existing jsconfig content
 */
async function readExistingJsconfig(jsconfigPath) {
  try {
    const content = await fs.readFile(jsconfigPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return default structure
      return {
        compilerOptions: {
          baseUrl: '.',
          paths: {},
        },
        include: ['src'],
      };
    }
    throw error;
  }
}

/**
 * Create backup of existing jsconfig.json
 * @param {string} jsconfigPath - Original jsconfig path
 * @param {string} backupPath - Backup file path
 */
async function createBackup(jsconfigPath, backupPath) {
  try {
    await fs.access(jsconfigPath);
    await fs.copyFile(jsconfigPath, backupPath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false; // File doesn't exist, no backup needed
    }
    throw error;
  }
}

/**
 * Update jsconfig.json with new aliases
 * @param {Object} jsconfig - Existing jsconfig content
 * @param {Object} newPaths - New path mappings
 * @returns {Object} Updated jsconfig
 */
function updateJsconfig(jsconfig, newPaths) {
  return {
    ...jsconfig,
    compilerOptions: {
      ...jsconfig.compilerOptions,
      baseUrl: '.',
      paths: {
        ...newPaths,
      },
    },
    include: jsconfig.include || ['src'],
  };
}

/**
 * Write updated jsconfig.json
 * @param {string} jsconfigPath - Path to jsconfig.json
 * @param {Object} jsconfig - Updated jsconfig content
 */
async function writeJsconfig(jsconfigPath, jsconfig) {
  const formattedContent = JSON.stringify(jsconfig, null, 2);
  await fs.writeFile(jsconfigPath, formattedContent, 'utf8');
}

/**
 * Display comparison between old and new aliases
 * @param {Object} oldPaths - Previous path mappings
 * @param {Object} newPaths - New path mappings
 */
function displayComparison(oldPaths = {}, newPaths = {}) {
  console.log(chalk.cyan('\n📊 Alias Changes:'));

  const allKeys = new Set([...Object.keys(oldPaths), ...Object.keys(newPaths)]);

  allKeys.forEach((key) => {
    const oldPath = oldPaths[key]?.[0];
    const newPath = newPaths[key]?.[0];

    if (!oldPath && newPath) {
      console.log(chalk.green(`  + ${key} → ${newPath}`));
    } else if (oldPath && !newPath) {
      console.log(chalk.red(`  - ${key} → ${oldPath}`));
    } else if (oldPath !== newPath) {
      console.log(chalk.yellow(`  ~ ${key} → ${newPath} (was: ${oldPath})`));
    } else {
      console.log(chalk.gray(`  = ${key} → ${newPath}`));
    }
  });
}

/**
 * Main sync function
 */
async function syncAliases() {
  const spinner = ora('Syncing aliases from Vite to jsconfig...').start();

  try {
    // Step 1: Extract aliases from Vite config
    spinner.text = 'Reading Vite configuration...';
    const viteAliases = await extractViteAliases(config.viteConfigPath);

    if (Object.keys(viteAliases).length === 0) {
      spinner.warn('No aliases found in Vite config');
      return;
    }

    // Step 2: Convert to jsconfig format
    spinner.text = 'Converting aliases to jsconfig format...';
    const jsconfigPaths = convertToJsconfigPaths(viteAliases);

    // Step 3: Read existing jsconfig
    spinner.text = 'Reading existing jsconfig...';
    const existingJsconfig = await readExistingJsconfig(config.jsconfigPath);
    const oldPaths = existingJsconfig.compilerOptions?.paths || {};

    // Step 4: Create backup
    spinner.text = 'Creating backup...';
    const backupCreated = await createBackup(
      config.jsconfigPath,
      config.backupPath,
    );

    // Step 5: Update jsconfig
    spinner.text = 'Updating jsconfig...';
    const updatedJsconfig = updateJsconfig(existingJsconfig, jsconfigPaths);

    // Step 6: Write updated jsconfig
    spinner.text = 'Writing updated jsconfig...';
    await writeJsconfig(config.jsconfigPath, updatedJsconfig);

    spinner.succeed(chalk.green('Aliases synced successfully!'));

    // Display results
    console.log(chalk.cyan('\n📁 Files:'));
    console.log(
      chalk.white(
        `  Source: ${path.relative(process.cwd(), config.viteConfigPath)}`,
      ),
    );
    console.log(
      chalk.white(
        `  Target: ${path.relative(process.cwd(), config.jsconfigPath)}`,
      ),
    );
    if (backupCreated) {
      console.log(
        chalk.gray(
          `  Backup: ${path.relative(process.cwd(), config.backupPath)}`,
        ),
      );
    }

    console.log(chalk.cyan('\n🔗 Extracted Aliases:'));
    Object.entries(viteAliases).forEach(([alias, target]) => {
      console.log(chalk.white(`  ${alias} → ${target}`));
    });

    // Show comparison
    displayComparison(oldPaths, jsconfigPaths);

    console.log(chalk.cyan('\n✨ Next Steps:'));
    console.log(
      chalk.gray('  • Restart VS Code to apply the new path mappings'),
    );
    console.log(chalk.gray('  • Test "Go to Definition" on aliased imports'));
    console.log(
      chalk.gray('  • Run this script whenever you update Vite aliases'),
    );
  } catch (error) {
    spinner.fail('Failed to sync aliases');
    console.error(chalk.red('\nError:'), error.message);

    if (error.message.includes('resolve.alias')) {
      console.log(
        chalk.yellow(
          '\nTip: Make sure your vite.config.js has a resolve.alias section',
        ),
      );
    }

    process.exit(1);
  }
}

/**
 * Validate Vite config format
 */
async function validateViteConfig() {
  try {
    const content = await fs.readFile(config.viteConfigPath, 'utf8');

    if (!content.includes('resolve:') || !content.includes('alias:')) {
      console.log(
        chalk.yellow(
          '⚠️  Warning: Could not find resolve.alias section in vite.config.js',
        ),
      );
      console.log(chalk.gray('Expected format:'));
      console.log(
        chalk.gray(`
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      // ... other aliases
    }
  }
      `),
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(chalk.red('Could not read vite.config.js:'), error.message);
    return false;
  }
}

/**
 * CLI interface
 */
async function main() {
  console.log(chalk.cyan('🔄 Vite to JSConfig Alias Sync\n'));

  // Validate Vite config first
  const isValid = await validateViteConfig();
  if (!isValid) {
    process.exit(1);
  }

  await syncAliases();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export for testing or programmatic use
export { syncAliases, extractViteAliases, convertToJsconfigPaths };
