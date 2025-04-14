// components/ConcertPoster.tsx
import Image from 'next/image'

interface ConcertPosterProps {
    src: string
    alt: string
    className: string
}

export function ConcertPoster({ src, alt, className }: ConcertPosterProps) {
    return (
        <div className={"relative w-52 overflow-hidden rounded-lg max-w-[200px] md:max-w-[250px] h-auto " + className}>
            <Image
                src={src}
                alt={alt}
                width={200}
                height={356}
                className="rounded-lg object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
            />
        </div>
    )
}
