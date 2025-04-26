'use client'
import React, { FC } from 'react'
import { CldImage } from 'next-cloudinary'
import { RoundedSize } from '@/utils/types';

type CloudinaryImageProps = {
    src: string;
    alt: string;
    width: number;
    height: number;
    rounded: RoundedSize;
    className?: string;
}
const CloudinaryImage: FC<CloudinaryImageProps> = ({ src, alt, width, height, rounded, className }) => {
    const combinedClassName = `${rounded} ${className ? className : ''}`.trim();

    return (
        <CldImage format='auto' alt={alt} src={src} width={width} height={height} className={combinedClassName} loading='lazy' quality={"auto:low"}/>
    )
}

export default CloudinaryImage