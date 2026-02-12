// src/pages/Play.jsx

import { useNavigate } from 'react-router-dom';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { ArrowLeft, Construction } from 'lucide-react';

export default function Play() {
  const navigate = useNavigate();

  return (
    <main className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-muted rounded-full">
                <Construction className="w-12 h-12 text-muted-foreground" />
              </div>
            </div>
            <CardTitle className="text-3xl">Game Play Interface</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-xl text-muted-foreground">Work in Progress</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              The gameplay interface is currently under development. This will
              be the main control panel for managing questions, answers, and
              team progress during the quiz competition.
            </p>
            <div className="pt-4">
              <Button onClick={() => navigate('/')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
