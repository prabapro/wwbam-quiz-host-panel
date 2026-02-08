// src/pages/QuestionManagement.jsx

import { useState, useEffect } from 'react';
import { localStorageService } from '@services/localStorage.service';
import QuestionUploader from '@components/questions/QuestionUploader';
import QuestionSetList from '@components/questions/QuestionSetList';
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import { AlertCircle, FileJson } from 'lucide-react';

export default function QuestionManagement() {
  const [questionSets, setQuestionSets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  // Load question sets from localStorage on mount
  useEffect(() => {
    loadQuestionSets();
  }, []);

  const loadQuestionSets = () => {
    setIsLoading(true);
    try {
      const metadata = localStorageService.getQuestionSetsMetadata();
      setQuestionSets(metadata.sets || []);
    } catch (error) {
      console.error('Failed to load question sets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = (result) => {
    setUploadSuccess(result.setId);
    loadQuestionSets(); // Refresh list

    // Clear success message after 5 seconds
    setTimeout(() => {
      setUploadSuccess(null);
    }, 5000);
  };

  const handleDelete = (setId) => {
    const result = localStorageService.deleteQuestionSet(setId);

    if (result.success) {
      loadQuestionSets(); // Refresh list
    } else {
      console.error('Failed to delete question set:', result.error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileJson className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Question Management</h1>
        </div>
        <p className="text-muted-foreground">
          Upload and manage question sets for the quiz competition
        </p>
      </div>

      {/* Success Alert */}
      {uploadSuccess && (
        <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">Upload Successful</AlertTitle>
          <AlertDescription className="text-green-600">
            Question set "{uploadSuccess}" has been uploaded successfully.
          </AlertDescription>
        </Alert>
      )}

      {/* Uploader */}
      <div className="mb-8">
        <QuestionUploader onUploadSuccess={handleUploadSuccess} />
      </div>

      {/* Question Sets List */}
      <div>
        <QuestionSetList
          questionSets={questionSets}
          isLoading={isLoading}
          onDelete={handleDelete}
          onRefresh={loadQuestionSets}
        />
      </div>
    </div>
  );
}
