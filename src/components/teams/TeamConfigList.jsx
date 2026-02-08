// src/components/teams/TeamConfigList.jsx

import TeamCard from './TeamCard';
import LoadingSpinner from '@components/common/LoadingSpinner';
import { Users } from 'lucide-react';

export default function TeamConfigList({ teams, onEdit, onDelete, isLoading }) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading teams..." />
      </div>
    );
  }

  // Empty state
  if (!teams || teams.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Teams Added</h3>
        <p className="text-muted-foreground mb-4">
          Add your first team using the form to get started
        </p>
        <p className="text-sm text-muted-foreground">
          You can add up to 10 teams for the competition
        </p>
      </div>
    );
  }

  // Grid of teams
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          Configured Teams ({teams.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
