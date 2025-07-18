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
        <div className="bg-muted mb-4 rounded-full p-3">
          <Users2 className="text-muted-foreground h-8 w-8" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">Aucun utilisateur trouvé</h3>
        <p className="text-muted-foreground mb-6 text-center text-sm">
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
