// src/components/questions/QuestionUploader.jsx

import { useState, useRef } from 'react';
import { localStorageService } from '@services/localStorage.service';
import { getValidationSummary } from '@utils/validation';
import { QUESTIONS_PER_SET } from '@constants/config';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import { Progress } from '@components/ui/progress';
import {
  Upload,
  FileJson,
  AlertCircle,
  CheckCircle2,
  Download,
  Info,
} from 'lucide-react';

export default function QuestionUploader({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const jsonFiles = files.filter((file) => file.type === 'application/json');

    if (jsonFiles.length === 0) {
      setError('Please drop JSON files only');
      return;
    }

    handleFiles(jsonFiles);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Read file
        const text = await file.text();
        const questionSet = JSON.parse(text);

        // Simulate progress
        setUploadProgress(((i + 0.5) / files.length) * 100);

        // Save to localStorage (includes validation)
        const result = localStorageService.saveQuestionSet(questionSet);

        if (!result.success) {
          // Validation failed
          if (result.validationErrors) {
            const summary = getValidationSummary(result.validationErrors);
            setError(`Validation failed for "${file.name}":\n\n${summary}`);
          } else {
            setError(result.error || `Failed to upload "${file.name}"`);
          }
          setIsUploading(false);
          return;
        }

        // Success
        setUploadProgress(((i + 1) / files.length) * 100);

        // Notify parent
        if (onUploadSuccess) {
          onUploadSuccess(result);
        }
      } catch (err) {
        setError(`Failed to parse "${file.name}": ${err.message}`);
        setIsUploading(false);
        return;
      }
    }

    // All files processed successfully
    setIsUploading(false);
    setUploadProgress(0);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="w-5 h-5" />
          Upload Question Sets
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Upload Failed</AlertTitle>
            <AlertDescription className="whitespace-pre-wrap">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Uploading...
              </span>
              <span className="text-sm font-medium">
                {Math.round(uploadProgress)}%
              </span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}
            ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-primary hover:bg-primary/5'}
          `}
          onClick={handleBrowseClick}>
          <Upload
            className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}
          />

          <h3 className="text-lg font-semibold mb-2">
            {isDragging ? 'Drop files here' : 'Upload Question Set'}
          </h3>

          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop JSON files here, or click to browse
          </p>

          <Button
            variant="outline"
            disabled={isUploading}
            onClick={(e) => {
              e.stopPropagation();
              handleBrowseClick();
            }}>
            Browse Files
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* JSON Structure */}
        <div className="mt-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>JSON Structure Required</AlertTitle>
            <AlertDescription>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                {`{
  "setId": "sample-set-1",
  "setName": "Sample Set 1",
  "questions": [
    {
      "id": "q1",
      "number": 1,
      "text": "What is the capital of France?",
      "options": {
        "A": "London",
        "B": "Paris",
        "C": "Berlin",
        "D": "Rome"
      },
      "correctAnswer": "B",
      "difficulty": "easy",
      "category": "Geography"
    }
    // ... ${QUESTIONS_PER_SET - 1} more questions
  ]
}`}
              </pre>
            </AlertDescription>
          </Alert>
        </div>

        {/* Requirements */}
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Upload Requirements
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• File format: JSON (.json)</li>
            <li>• Exactly {QUESTIONS_PER_SET} questions per set</li>
            <li>
              • Each question must have: text, 4 options (A/B/C/D), correct
              answer
            </li>
            <li>
              • Valid <code>setId</code> and <code>setName</code> required
            </li>
          </ul>
        </div>

        {/* Sample Files Download */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Download className="w-5 h-5" />
            <h4 className="text-sm font-semibold">Sample Templates</h4>
          </div>

          <p className="text-xs text-blue-800 dark:text-blue-200">
            Download sample question sets to use as templates:
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href="/sample-data/sample-question-set-01.json"
              download
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-md transition-colors">
              <FileJson className="w-4 h-4" />
              Single Question Set (.json)
            </a>

            <a
              href="/sample-data/sample-question-sets.zip"
              download
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-md transition-colors">
              <Download className="w-4 h-4" />
              Multiple Sets (.zip)
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
