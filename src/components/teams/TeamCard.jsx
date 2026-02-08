// src/components/teams/TeamCard.jsx

import { useState } from 'react';
import { useGameStore } from '@stores/useGameStore';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import DeleteTeamDialog from './DeleteTeamDialog';
import { getTeamStatusMeta } from '@constants/teamStates';
import { Users, Phone, Edit, Trash2 } from 'lucide-react';

export default function TeamCard({ team, onEdit, onDelete }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const gameStatus = useGameStore((state) => state.gameStatus);
  const isGameActive = gameStatus === 'active' || gameStatus === 'initialized';

  const statusMeta = getTeamStatusMeta(team.status);

  const handleEdit = () => {
    onEdit(team);
  };

  const handleDeleteConfirm = () => {
    onDelete(team.id);
    setShowDeleteDialog(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Users className="w-5 h-5 text-primary shrink-0" />
              <CardTitle className="text-base truncate">{team.name}</CardTitle>
            </div>
            <Badge
              variant={team.status === 'waiting' ? 'secondary' : 'default'}
              className={`shrink-0 ${statusMeta.bgColor} ${statusMeta.textColor}`}>
              {statusMeta.icon} {statusMeta.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-3">
          {/* Participants */}
          {team.participants && (
            <div>
              <dt className="text-xs text-muted-foreground mb-1">
                Participants
              </dt>
              <dd className="text-sm">{team.participants}</dd>
            </div>
          )}

          {/* Phone-a-Friend Contact */}
          {team.contact && (
            <div>
              <dt className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Phone-a-Friend Contact
              </dt>
              <dd className="text-sm font-mono">{team.contact}</dd>
            </div>
          )}

          {/* Additional Info */}
          <div className="pt-2 border-t">
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-muted-foreground">Questions</dt>
                <dd className="font-semibold">
                  {team.questionsAnswered || 0}/20
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Prize</dt>
                <dd className="font-semibold">
                  Rs.{(team.currentPrize || 0).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Created Date */}
          {team.createdAt && (
            <div className="text-xs text-muted-foreground">
              Added: {formatDate(team.createdAt)}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleEdit}
            disabled={isGameActive}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isGameActive}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteTeamDialog
        team={team}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
