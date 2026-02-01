// src/components/common/MarkdownRenderer.jsx
/* eslint-disable */

import { useState, useEffect } from 'react';
import { Button } from '@components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import {
  extractLastUpdatedDate,
  getMarkdownClasses,
  getProseClasses,
} from '@utils/markdownUtils';

/**
 * Get standardized ReactMarkdown component overrides
 * Provides consistent styling across all markdown pages
 * @returns {object} ReactMarkdown components object
 */
export const getMarkdownComponents = () => {
  const classes = getMarkdownClasses();

  return {
    // Headings with consistent hierarchy
    h1: ({ children }) => <h1 className={classes.h1}>{children}</h1>,
    h2: ({ children }) => <h2 className={classes.h2}>{children}</h2>,
    h3: ({ children }) => <h3 className={classes.h3}>{children}</h3>,
    h4: ({ children }) => <h4 className={classes.h4}>{children}</h4>,
    h5: ({ children }) => <h5 className={classes.h5}>{children}</h5>,
    h6: ({ children }) => <h6 className={classes.h6}>{children}</h6>,

    // Text content
    p: ({ children }) => <p className={classes.p}>{children}</p>,

    // Lists
    ul: ({ children }) => <ul className={classes.ul}>{children}</ul>,
    ol: ({ children }) => <ol className={classes.ol}>{children}</ol>,
    li: ({ children }) => <li className={classes.li}>{children}</li>,

    // Text formatting
    strong: ({ children }) => (
      <strong className={classes.strong}>{children}</strong>
    ),
    em: ({ children }) => <em className={classes.em}>{children}</em>,

    // Links with smart external detection
    a: ({ href, children }) => {
      const isExternal = href?.startsWith('http');
      return (
        <a
          href={href}
          className={classes.link}
          target={isExternal ? '_blank' : '_self'}
          rel={isExternal ? 'noopener noreferrer' : undefined}>
          {children}
        </a>
      );
    },

    // Special content blocks
    blockquote: ({ children }) => (
      <blockquote className={classes.blockquote}>{children}</blockquote>
    ),

    // Code blocks (inline and block)
    code: ({ children, className }) => {
      const isInline = !className;
      return isInline ? (
        <code className={classes.inlineCode}>{children}</code>
      ) : (
        <pre className={classes.codeBlock}>
          <code className={classes.codeText}>{children}</code>
        </pre>
      );
    },

    // Horizontal rule
    hr: () => <hr className={classes.hr} />,

    // Tables
    table: ({ children }) => (
      <div className={classes.table}>
        <table className={classes.tableInner}>{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className={classes.thead}>{children}</thead>
    ),
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className={classes.tr}>{children}</tr>,
    th: ({ children }) => <th className={classes.th}>{children}</th>,
    td: ({ children }) => <td className={classes.td}>{children}</td>,
  };
};

/**
 * Page Header Component for documentation/legal pages
 */
export const PageHeader = ({ title, description, icon: Icon, lastUpdated }) => {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center space-x-3 mb-4">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      </div>

      {lastUpdated && (
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-4">
          <Calendar className="w-4 h-4" />
          <span>Last updated: {lastUpdated}</span>
        </div>
      )}

      <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
        {description}
      </p>
    </div>
  );
};

/**
 * Page Footer Component for documentation/legal pages
 */
export const PageFooter = ({
  text,
  buttonText = 'Contact Us',
  buttonLink = '/contact',
  icon: Icon,
}) => {
  return (
    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 bg-muted/30 rounded-lg p-6">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        {Icon && <Icon className="w-4 h-4" />}
        <span>{text}</span>
      </div>
      <Button asChild>
        <Link to={buttonLink}>{buttonText}</Link>
      </Button>
    </div>
  );
};

/**
 * Hook for processing markdown content with date extraction
 * @param {string} markdownContent - Raw markdown content
 * @returns {object} Processed content and loading state
 */
export const useMarkdownContent = (markdownContent) => {
  const [lastUpdated, setLastUpdated] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const date = extractLastUpdatedDate(markdownContent);
      setLastUpdated(date || '');
    } catch (error) {
      console.error('Error processing markdown content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [markdownContent]);

  return {
    lastUpdated,
    isLoading,
    components: getMarkdownComponents(),
    proseClasses: getProseClasses(),
  };
};
