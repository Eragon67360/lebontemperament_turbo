"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnniversaryMemory } from "@/types/anniversary";
import { Calendar, CheckCircle, Mail, Star, Trash2, User } from "lucide-react";

interface MemoryItemProps {
  memory: AnniversaryMemory;
  onApprove: (memory: AnniversaryMemory) => void;
  onFeature: (memory: AnniversaryMemory) => void;
  onDelete: (memory: AnniversaryMemory) => void;
}

export function MemoryItem({
  memory,
  onApprove,
  onFeature,
  onDelete,
}: MemoryItemProps) {
  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        !memory.is_approved && "border-yellow-200 bg-yellow-50/30",
        memory.is_featured && "border-primary bg-primary/5",
      )}
    >
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with badges */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {!memory.is_approved && (
                <Badge
                  variant="outline"
                  className="border-yellow-500 text-yellow-700"
                >
                  En attente
                </Badge>
              )}
              {memory.is_approved && (
                <Badge
                  variant="outline"
                  className="border-green-500 text-green-700"
                >
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Approuvé
                </Badge>
              )}
              {memory.is_featured && (
                <Badge variant="default">
                  <Star className="mr-1 h-3 w-3" />À la une
                </Badge>
              )}
            </div>
            <span className="text-muted-foreground shrink-0 text-xs">
              {new Date(memory.created_at).toLocaleDateString("fr-FR")}
            </span>
          </div>

          {/* Author Info */}
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {memory.name}
            </span>
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-4 w-4" />
              {memory.email}
            </span>
            {memory.year && (
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {memory.year}
              </span>
            )}
          </div>

          {/* Message */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm whitespace-pre-wrap">{memory.message}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {!memory.is_approved && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onApprove(memory)}
                className="text-green-600 hover:bg-green-50"
              >
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                Approuver
              </Button>
            )}
            {memory.is_approved && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFeature(memory)}
                className={cn(
                  memory.is_featured
                    ? "bg-primary/10 text-primary"
                    : "text-yellow-600 hover:bg-yellow-50",
                )}
              >
                <Star className="mr-1.5 h-3.5 w-3.5" />
                {memory.is_featured ? "Retirer de la une" : "Mettre à la une"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(memory)}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Supprimer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
