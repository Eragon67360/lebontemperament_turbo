import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserEmptyStateProps {
  setIsAddUserOpen: (open: boolean) => void;
}

export function UserEmptyState({ setIsAddUserOpen }: UserEmptyStateProps) {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-muted p-3 mb-4">
          <Users2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Aucun utilisateur trouvé</h3>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Commencez par ajouter votre premier utilisateur pour gérer les accès.
        </p>
        <Button onClick={() => setIsAddUserOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un utilisateur
        </Button>
      </CardContent>
    </Card>
  );
}
