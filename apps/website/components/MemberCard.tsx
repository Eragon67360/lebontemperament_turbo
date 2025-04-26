'use client'
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/react"
import { CldImage } from 'next-cloudinary'
import React, { FC } from 'react'

type MemberCardProps = {
    role: string,
    name: string,
    src: string,
    quote: React.ReactNode;
}

const MemberCard: FC<MemberCardProps> = ({ role, name, src, quote }) => {
    return (
        <Card
            isFooterBlurred
            radius="lg"
            className="border-none"
        >
            <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <h3 className="text-tiny uppercase font-bold">{role}</h3>
                <h4 className="font-bold text-large">{name}</h4>
            </CardHeader>
            <CardBody>
                <CldImage
                    alt={`Photo ${name}`}
                    className="object-cover rounded-xl h-auto w-auto max-h-[800px]"
                    src={src}
                    width={400}
                    height={300}
                />
            </CardBody>
            {quote !== '' && (
                <CardFooter>

                    <p className='text-start'>&laquo;{quote}&raquo;</p>
                </CardFooter>

            )}


        </Card>
    )
}

export default MemberCard