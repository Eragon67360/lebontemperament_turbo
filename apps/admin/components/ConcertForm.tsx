// components/ConcertForm.tsx
import { Button } from '@/components/ui/button'
import { Calendar } from "@/components/ui/calendar"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload } from "@/components/FileUpload"
import { cn } from "@/lib/utils"
import { Concert } from '@/types/concerts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { useState, useEffect } from 'react'

interface ConcertFormProps {
    onSubmit: (e: React.FormEvent<HTMLFormElement>, date: Date | undefined, selectedFile: File | null) => Promise<void>
    loading: boolean
    initialData?: Concert | null
    submitLabel: string
    onClose?: () => void;
}

export function ConcertForm({ onSubmit, loading, initialData, submitLabel }: ConcertFormProps) {
    const [date, setDate] = useState<Date>()
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    useEffect(() => {
        if (initialData?.date) {
            setDate(new Date(initialData.date))
        }
    }, [initialData])

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        onSubmit(e, date, selectedFile)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="concertName">Nom du concert (optionnel)</Label>
                <Input id="concertName" name="concertName" type='text' defaultValue={initialData?.name || ''} />
            </div>
            <div>
                <Label htmlFor="place">Lieu</Label>
                <Input id="place" name="place" required defaultValue={initialData?.place || ''} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Date</Label>
                    <Popover modal>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                                locale={fr}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div>
                    <Label htmlFor="time">Heure</Label>
                    <Input
                        id="time"
                        name="time"
                        type="time"
                        required
                        defaultValue={initialData?.time.slice(0, 5) || ''}
                    />
                </div>
            </div>
            <div>
                <Label htmlFor="context">Contexte</Label>
                <Select name="context" required defaultValue={initialData?.context}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un contexte" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="orchestre">Orchestre</SelectItem>
                        <SelectItem value="choeur">Chœur</SelectItem>
                        <SelectItem value="orchestre_et_choeur">Orchestre et Chœur</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="additional_informations">Informations supplémentaires</Label>
                <Textarea
                    id="additional_informations"
                    name="additional_informations"
                    defaultValue={initialData?.additional_informations || ''}
                />
            </div>
            <div>
                <Label>Affiche (optionnel)</Label>
                <FileUpload
                    onFileSelect={(file) => setSelectedFile(file)}
                    onFileClear={() => setSelectedFile(null)}
                    value={selectedFile}
                    currentImageUrl={initialData?.affiche || null}
                />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Chargement...' : submitLabel}
            </Button>
        </form>
    )
}
