// src/pages/Privacy.jsx

import ReactMarkdown from 'react-markdown';
import { Card, CardContent } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { ArrowLeft, FileText, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '@components/common/LoadingSpinner';
import {
  useMarkdownContent,
  PageHeader,
  PageFooter,
} from '@components/common/MarkdownRenderer';
import privacyPolicyContent from '@data/privacy-policy.md?raw';

export default function Privacy() {
  const { lastUpdated, isLoading, components, proseClasses } =
    useMarkdownContent(privacyPolicyContent);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Loading Privacy Policy..." />
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
        title="Privacy Policy"
        description="Learn how XXX protects your privacy and handles your data with transparency and care."
        icon={Shield}
        lastUpdated={lastUpdated}
      />

      {/* Content Card */}
      <Card className="shadow-sm">
        <CardContent className="p-8">
          <div className={proseClasses}>
            <ReactMarkdown components={components}>
              {privacyPolicyContent}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <PageFooter
        text="Questions about our privacy practices?"
        buttonText="Contact Us"
        buttonLink="/contact"
        icon={FileText}
      />
    </div>
  );
}
