// src/utils/markdownUtils.js

/**
 * Utilities for processing markdown content and styling
 * Note: This file contains only pure JavaScript functions and data
 * JSX components are created in the consuming components
 */

/**
 * Extract last updated date from markdown content
 * @param {string} markdownContent - Raw markdown content
 * @returns {string|null} Extracted date or null if not found
 */
export const extractLastUpdatedDate = (markdownContent) => {
  try {
    const match = markdownContent.match(/Last updated:\s*(.+)/i);
    return match ? match[1].trim() : null;
  } catch (error) {
    console.error('Error extracting last updated date:', error);
    return null;
  }
};

/**
 * Get CSS classes for markdown components
 * Returns objects with className strings instead of JSX
 */
export const getMarkdownClasses = () => ({
  h1: 'text-3xl font-bold text-foreground mb-6 border-b border-border pb-3',
  h2: 'text-2xl font-semibold text-foreground mt-8 mb-4 border-l-4 border-primary pl-4',
  h3: 'text-xl font-semibold text-foreground mt-6 mb-3',
  h4: 'text-lg font-medium text-foreground mt-4 mb-2',
  h5: 'text-base font-medium text-foreground mt-3 mb-2',
  h6: 'text-sm font-medium text-foreground mt-2 mb-1',
  p: 'text-base text-muted-foreground leading-relaxed mb-4',
  ul: 'list-disc list-inside text-muted-foreground mb-4 space-y-2 ml-4',
  ol: 'list-decimal list-inside text-muted-foreground mb-4 space-y-2 ml-4',
  li: 'text-base leading-relaxed',
  strong: 'font-semibold text-foreground',
  em: 'italic text-foreground',
  link: 'text-primary hover:text-primary/80 underline underline-offset-2 transition-colors duration-200',
  blockquote:
    'border-l-4 border-primary/30 bg-muted/50 pl-6 py-4 my-6 italic text-muted-foreground rounded-r-md',
  inlineCode: 'bg-muted px-2 py-1 rounded text-sm font-mono text-primary',
  codeBlock:
    'bg-muted p-4 rounded-lg overflow-x-auto my-4 border border-border',
  codeText: 'text-sm font-mono text-foreground',
  hr: 'border-border my-8',
  table: 'overflow-x-auto my-6',
  tableInner: 'min-w-full border border-border rounded-lg',
  thead: 'bg-muted/50',
  tr: 'border-b border-border last:border-b-0',
  th: 'px-4 py-3 text-left text-sm font-semibold text-foreground',
  td: 'px-4 py-3 text-sm text-muted-foreground',
});

/**
 * Standard prose wrapper classes for markdown content
 * @returns {string} Tailwind classes for prose styling
 */
export const getProseClasses = () => {
  return 'prose prose-zinc dark:prose-invert max-w-none prose-headings:scroll-mt-4 prose-a:no-underline';
};

/**
 * Get page header configuration
 * @param {object} options - Header configuration
 * @returns {object} Configuration for creating header component
 */
export const getPageHeaderConfig = ({ title, description, lastUpdated }) => ({
  title,
  description,
  lastUpdated,
  classes: {
    container: 'text-center mb-8',
    headerRow: 'flex items-center justify-center space-x-3 mb-4',
    iconContainer:
      'w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center',
    icon: 'w-6 h-6 text-primary',
    title: 'text-3xl font-bold text-foreground',
    dateRow:
      'flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-4',
    dateIcon: 'w-4 h-4',
    description: 'text-lg text-muted-foreground mt-4 max-w-2xl mx-auto',
  },
});

/**
 * Get page footer configuration
 * @param {object} options - Footer configuration
 * @returns {object} Configuration for creating footer component
 */
export const getPageFooterConfig = ({
  text,
  buttonText = 'Contact Us',
  buttonLink = '/contact',
}) => ({
  text,
  buttonText,
  buttonLink,
  classes: {
    container:
      'mt-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 bg-muted/30 rounded-lg p-6',
    textRow: 'flex items-center space-x-2 text-sm text-muted-foreground',
    icon: 'w-4 h-4',
  },
});

/**
 * Processing state management for markdown content
 * @param {string} markdownContent - Raw markdown content
 * @returns {object} State management utilities
 */
export const processMarkdownContent = (markdownContent) => {
  const lastUpdated = extractLastUpdatedDate(markdownContent);
  const classes = getMarkdownClasses();
  const proseClasses = getProseClasses();

  return {
    lastUpdated,
    classes,
    proseClasses,
    isReady: true,
  };
};
