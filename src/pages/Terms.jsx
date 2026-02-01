// src/pages/Terms.jsx

import ReactMarkdown from 'react-markdown';
import { Card, CardContent } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { ArrowLeft, FileText, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '@components/common/LoadingSpinner';
import {
  useMarkdownContent,
  PageHeader,
  PageFooter,
} from '@components/common/MarkdownRenderer';
import termsContent from '@data/terms.md?raw';

export default function Terms() {
  const { lastUpdated, isLoading, components, proseClasses } =
    useMarkdownContent(termsContent);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Loading Terms of Service..." />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Navigation */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/" className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </Button>
      </div>

      {/* Header */}
      <PageHeader
        title="Terms of Service"
        description="Please read these terms carefully before using XXX. By using our service, you agree to these terms."
        icon={Scale}
        lastUpdated={lastUpdated}
      />

      {/* Content Card */}
      <Card className="shadow-sm">
        <CardContent className="p-8">
          <div className={proseClasses}>
            <ReactMarkdown components={components}>
              {termsContent}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <PageFooter
        text="Need clarification on our terms?"
        buttonText="Contact Us"
        buttonLink="/contact"
        icon={FileText}
      />
    </div>
  );
}
