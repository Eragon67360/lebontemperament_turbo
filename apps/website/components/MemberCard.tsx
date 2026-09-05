"use client";
import { Card } from "@heroui/react";
import { CldImage } from "next-cloudinary";
import React, { FC } from "react";

type MemberCardProps = {
  role: string;
  name: string;
  src: string;
  quote: React.ReactNode;
};

const MemberCard: FC<MemberCardProps> = ({ role, name, src, quote }) => {
  return (
    <Card className="bg-background dark:bg-foreground/5 rounded-lg border-none">
      <Card.Header className="flex-col items-start px-4 pt-2 pb-0">
        <h3 className="text-xs font-bold uppercase">{role}</h3>
        <h4 className="text-lg font-bold">{name}</h4>
      </Card.Header>
      <Card.Content>
        <CldImage
          alt={`Photo ${name}`}
          className="h-auto max-h-[800px] w-auto rounded-xl object-cover"
          src={src}
          width={400}
          height={300}
        />
      </Card.Content>
      {quote !== "" && (
        <Card.Footer>
          <p className="text-start">&laquo;{quote}&raquo;</p>
        </Card.Footer>
      )}
    </Card>
  );
};

export default MemberCard;
