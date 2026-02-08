// src/components/teams/TeamUploader.jsx

import { useState, useRef } from 'react';
import { useTeamsStore } from '@stores/useTeamsStore';
import { validateTeamsJSON, getValidationSummary } from '@utils/teamValidation';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import { Progress } from '@components/ui/progress';
import { Upload, Users, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export default function TeamUploader({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedTeamIds, setUploadedTeamIds] = useState([]);
  const fileInputRef = useRef(null);

  const teams = useTeamsStore((state) => state.teams);
  const addTeam = useTeamsStore((state) => state.addTeam);
  const deleteTeam = useTeamsStore((state) => state.deleteTeam);

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

  /**
   * Rollback all uploaded teams on failure
   */
  const rollbackUploadedTeams = async (teamIds) => {
    console.log('🔄 Rolling back uploaded teams:', teamIds);

    for (const teamId of teamIds) {
      try {
        await deleteTeam(teamId);
        console.log(`✅ Rolled back team: ${teamId}`);
      } catch (error) {
        console.error(`❌ Failed to rollback team ${teamId}:`, error);
      }
    }
  };

  /**
   * Handle file uploads with validation and atomic batch processing
   */
  const handleFiles = async (files) => {
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadedTeamIds([]);

    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const file = files[fileIndex];
      const uploadedIds = [];

      try {
        // Read file
        const text = await file.text();
        const jsonData = JSON.parse(text);

        // Update progress - parsing complete
        setUploadProgress(((fileIndex + 0.2) / files.length) * 100);

        // Validate entire file before uploading
        const validation = validateTeamsJSON(jsonData, teams);

        if (!validation.isValid) {
          // Validation failed - show errors
          const summary = getValidationSummary(validation);
          setError(`Validation failed for "${file.name}":\n\n${summary}`);
          setIsUploading(false);
          return;
        }

        // Update progress - validation complete
        setUploadProgress(((fileIndex + 0.4) / files.length) * 100);

        // All teams valid - upload to Firebase sequentially
        const teamsToUpload = validation.teams;
        const totalTeams = teamsToUpload.length;

        console.log(`📤 Uploading ${totalTeams} teams from ${file.name}...`);

        for (let teamIndex = 0; teamIndex < totalTeams; teamIndex++) {
          const teamData = teamsToUpload[teamIndex];

          try {
            // Upload team to Firebase
            const result = await addTeam({
              name: teamData.name,
              participants: teamData.participants,
              contact: teamData.contact,
            });

            if (!result.success) {
              // Upload failed - rollback all previously uploaded teams
              console.error(
                `❌ Failed to upload team "${teamData.name}":`,
                result.error,
              );

              await rollbackUploadedTeams(uploadedIds);

              setError(
                `Upload failed for team "${teamData.name}" in file "${file.name}". All teams from this file have been rolled back.\n\nError: ${result.error}`,
              );
              setIsUploading(false);
              return;
            }

            // Track uploaded team ID for potential rollback
            uploadedIds.push(result.teamId);
            setUploadedTeamIds((prev) => [...prev, result.teamId]);

            console.log(
              `✅ Uploaded team ${teamIndex + 1}/${totalTeams}: ${teamData.name} (ID: ${result.teamId})`,
            );

            // Update progress
            const fileProgress =
              (fileIndex + 0.4 + 0.6 * ((teamIndex + 1) / totalTeams)) /
              files.length;
            setUploadProgress(fileProgress * 100);
          } catch (uploadError) {
            // Unexpected error during upload - rollback
            console.error(
              `❌ Unexpected error uploading team "${teamData.name}":`,
              uploadError,
            );

            await rollbackUploadedTeams(uploadedIds);

            setError(
              `Unexpected error uploading team "${teamData.name}" in file "${file.name}". All teams from this file have been rolled back.\n\nError: ${uploadError.message}`,
            );
            setIsUploading(false);
            return;
          }
        }

        // All teams from this file uploaded successfully
        console.log(
          `✅ Successfully uploaded all ${totalTeams} teams from ${file.name}`,
        );

        // Update progress - file complete
        setUploadProgress(((fileIndex + 1) / files.length) * 100);

        // Notify parent of successful upload
        if (onUploadSuccess) {
          onUploadSuccess({
            fileName: file.name,
            teamCount: totalTeams,
            teamIds: uploadedIds,
          });
        }
      } catch (err) {
        // JSON parse error or other unexpected error
        console.error(`❌ Failed to process file "${file.name}":`, err);

        // Rollback any teams uploaded before error
        if (uploadedIds.length > 0) {
          await rollbackUploadedTeams(uploadedIds);
        }

        setError(
          `Failed to process "${file.name}": ${err.message}\n\nPlease ensure the file is valid JSON with correct structure.`,
        );
        setIsUploading(false);
        return;
      }
    }

    // All files processed successfully
    setIsUploading(false);
    setUploadProgress(0);
    setUploadedTeamIds([]);

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
          <Users className="w-5 h-5" />
          Bulk Upload Teams
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
                Uploading teams...
              </span>
              <span className="text-sm font-medium">
                {Math.round(uploadProgress)}%
              </span>
            </div>
            <Progress value={uploadProgress} />
            {uploadedTeamIds.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Uploaded {uploadedTeamIds.length} team(s) so far...
              </p>
            )}
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
            {isDragging ? 'Drop files here' : 'Upload Teams JSON'}
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

        {/* Info Box */}
        <div className="mt-4 space-y-3">
          {/* JSON Structure */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>JSON Structure Required</AlertTitle>
            <AlertDescription>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                {`{
  "teams": [
    {
      "name": "Team Alpha",
      "participants": "John, Sarah",
      "contact": "+94 77 123 4567"
    }
  ]
}`}
              </pre>
            </AlertDescription>
          </Alert>

          {/* Requirements */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Upload Requirements
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• File format: JSON (.json)</li>
              <li>• Must contain a "teams" array</li>
              <li>
                • Each team requires: name, participants, contact (phone number)
              </li>
              <li>• Team names must be unique</li>
              <li>• Valid phone number format required</li>
              <li>
                • All teams validated before upload (atomic batch - all or
                nothing)
              </li>
            </ul>
          </div>

          {/* Sample File Link */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 Need a template?{' '}
              <a
                href="/sample-data/sample-teams.json"
                download
                className="font-medium underline hover:no-underline">
                Download sample-teams.json
              </a>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
