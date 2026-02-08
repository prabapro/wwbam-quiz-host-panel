// src/pages/TeamManagement.jsx

import { useState, useMemo, useEffect } from 'react';
import { useTeamsStore } from '@stores/useTeamsStore';
import TeamForm from '@components/teams/TeamForm';
import TeamConfigList from '@components/teams/TeamConfigList';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Alert, AlertDescription } from '@components/ui/alert';
import { Users, AlertCircle } from 'lucide-react';

export default function TeamManagement() {
  const [editingTeam, setEditingTeam] = useState(null);
  const [formKey, setFormKey] = useState(0); // Force form re-render on cancel

  // Select teams object and actions
  const teamsObject = useTeamsStore((state) => state.teams);
  const deleteTeam = useTeamsStore((state) => state.deleteTeam);
  const syncTeamsFromFirebase = useTeamsStore(
    (state) => state.syncTeamsFromFirebase,
  );
  const startTeamsListener = useTeamsStore((state) => state.startTeamsListener);
  const isLoading = useTeamsStore((state) => state.isLoading);

  // Convert to array using useMemo to prevent unnecessary recalculations
  const teams = useMemo(() => Object.values(teamsObject), [teamsObject]);

  // Sync teams from Firebase on mount and setup real-time listener
  useEffect(() => {
    // Initial sync
    syncTeamsFromFirebase();

    // Start real-time listener
    const unsubscribe = startTeamsListener();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [syncTeamsFromFirebase, startTeamsListener]);

  const handleEditTeam = (team) => {
    setEditingTeam(team);
  };

  const handleCancelEdit = () => {
    setEditingTeam(null);
    setFormKey((prev) => prev + 1);
  };

  const handleFormSuccess = () => {
    setEditingTeam(null);
    setFormKey((prev) => prev + 1);
  };

  const handleDeleteTeam = async (teamId) => {
    const result = await deleteTeam(teamId);

    if (!result.success) {
      console.error('Failed to delete team:', result.error);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Team Management</h1>
        </div>
        <p className="text-muted-foreground">
          Configure teams that will participate in the quiz competition
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Add all participating teams before initializing the game. Each team
          will be assigned a unique question set during game initialization.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Team Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>
                {editingTeam ? 'Edit Team' : 'Add New Team'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TeamForm
                key={formKey}
                editingTeam={editingTeam}
                onSuccess={handleFormSuccess}
                onCancel={editingTeam ? handleCancelEdit : undefined}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Team List */}
        <div className="lg:col-span-2">
          <TeamConfigList
            teams={teams}
            onEdit={handleEditTeam}
            onDelete={handleDeleteTeam}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
