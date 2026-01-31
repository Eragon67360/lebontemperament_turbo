"use client";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/react";
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
    <Card
      isFooterBlurred
      radius="lg"
      className="bg-background dark:bg-foreground/5 border-none"
    >
      <CardHeader className="flex-col items-start px-4 pt-2 pb-0">
        <h3 className="text-tiny font-bold uppercase">{role}</h3>
        <h4 className="text-large font-bold">{name}</h4>
      </CardHeader>
      <CardBody>
        <CldImage
          alt={`Photo ${name}`}
          className="h-auto max-h-[800px] w-auto rounded-xl object-cover"
          src={src}
          width={400}
          height={300}
        />
      </CardBody>
      {quote !== "" && (
        <CardFooter>
          <p className="text-start">&laquo;{quote}&raquo;</p>
        </CardFooter>
      )}
    </Card>
  );
};

export default MemberCard;
