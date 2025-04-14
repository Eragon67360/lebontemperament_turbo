// components/FileUpload.tsx
import { Upload, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import Image from 'next/image'
interface FileUploadProps {
    onFileSelect: (file: File) => void
    onFileClear: () => void
    value?: File | null
    currentImageUrl?: string | null
}

export function FileUpload({ onFileSelect, onFileClear, currentImageUrl }: FileUploadProps) {
    const [preview, setPreview] = useState<string | null>(null)
    useEffect(() => {
        if (currentImageUrl) {
            setPreview(currentImageUrl)
        }
    }, [currentImageUrl])

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const file = acceptedFiles[0]

            // Validate file type
            if (!file?.type.startsWith('image/')) {
                toast.error('Seules les images sont acceptées')
                return
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('La taille du fichier ne doit pas dépasser 5MB')
                return
            }

            // Create preview
            const objectUrl = URL.createObjectURL(file)
            setPreview(objectUrl)
            onFileSelect(file)

            return () => URL.revokeObjectURL(objectUrl)
        },
        [onFileSelect]
    )

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.svg', '.webp']
        },
        maxFiles: 1,
    })

    const handleClear = () => {
        setPreview(null)
        onFileClear()
    }

    return (
        <div className="w-full">
            {!preview ? (
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors
            ${isDragActive
                            ? 'border-primary bg-primary/10'
                            : 'border-muted-foreground/25 hover:border-primary'
                        }`}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Upload className="h-8 w-8" />
                        <p className="text-sm text-center">
                            {isDragActive
                                ? 'Déposez l\'image ici'
                                : 'Glissez-déposez une image ou cliquez pour sélectionner'}
                        </p>
                        <p className="text-xs">
                            PNG, JPG, GIF, SVG ou WEBP (max. 5MB)
                        </p>
                    </div>
                </div>
            ) : (
                <div className="relative w-full h-[200px]">
                    <Image
                        src={preview}
                        alt="Aperçu de l'affiche"
                        fill
                        className="rounded-lg object-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority
                    />
                    <button
                        onClick={handleClear}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors z-10"
                        type="button"
                    >
                        <X className="h-4 w-4 text-white" />
                    </button>
                </div>
            )}
        </div>
    )
}
