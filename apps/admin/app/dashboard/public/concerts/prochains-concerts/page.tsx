'use client'

import { ConcertForm } from "@/components/ConcertForm"
import { ConcertPoster } from "@/components/ConcertPoster"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { Concert, Context } from '@/types/concerts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar, Clock, LucideIcon, MapPin, Music2, Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
const loadingMessages = [
    "La musique se réchauffe... 🎵",
    "Accord des instruments en cours... 🎻",
    "Le chef d'orchestre arrive... 🎭",
    "On monte sur scène... 🎪",
    "Les partitions s'envolent... 📝",
    "La chorale s'échauffe... 🎶"
]

export default function ProchainsConcerts() {
    const [concerts, setConcerts] = useState<Concert[]>([])
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [concertToDelete, setConcertToDelete] = useState<string | null>(null)
    const [editingConcert, setEditingConcert] = useState<Concert | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)

    const fetchConcerts = async () => {
        try {
            const response = await fetch('/api/prochains-concerts')
            const data = await response.json()
            setConcerts(data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchConcerts()
    }, [])

    const handleDeleteClick = (id: string) => {
        setConcertToDelete(id)
        setDeleteDialogOpen(true)
    }

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>, formDate: Date | undefined, selectedFile: File | null) => {
        e.preventDefault();

        try {
            setLoading(true);
            let affiche = null;

            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadResponse.ok) throw new Error('Erreur lors de l\'upload de l\'image');
                const { url } = await uploadResponse.json();
                affiche = url;
            }

            const formData = new FormData(e.currentTarget);
            const concertData = {
                place: formData.get('place') as string,
                date: formDate ? format(formDate, 'yyyy-MM-dd') : '',
                time: formData.get('time') as string,
                context: formData.get('context') as Context,
                name: formData.get('name') as string,
                additional_informations: formData.get('additional_informations') as string,
            };

            const response = await fetch('/api/prochains-concerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...concertData,
                    affiche,
                }),
            });

            if (!response.ok) throw new Error('Erreur lors de l\'ajout du concert');

            await fetchConcerts();
            toast.success('Concert ajouté avec succès');
            setOpen(false);
        } catch (error) {
            toast.error('Erreur lors de l\'ajout du concert');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


    const handleEdit = async (e: React.FormEvent<HTMLFormElement>, formDate: Date | undefined, selectedFile: File | null) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const concertData = {
            id: editingConcert!.id,
            place: formData.get('place') as string,
            date: formDate ? format(formDate, 'yyyy-MM-dd') : editingConcert!.date,
            time: formData.get('time') as string,
            context: formData.get('context') as Context,
            name: formData.get('name') as string,
            additional_informations: formData.get('additional_informations') as string,
        }

        try {
            let affiche = editingConcert?.affiche
            if (selectedFile) {
                const formData = new FormData()
                formData.append('file', selectedFile)

                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })

                if (!uploadResponse.ok) throw new Error('Erreur lors de l\'upload de l\'image')

                const { url } = await uploadResponse.json()
                affiche = url
            }

            const response = await fetch('/api/prochains-concerts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...concertData,
                    affiche,
                }),
            })

            if (!response.ok) throw new Error('Erreur lors de la modification')

            toast.success('Concert modifié avec succès')
            setEditDialogOpen(false)
            setEditingConcert(null)
            fetchConcerts()
        } catch (error) {
            toast.error('Erreur lors de la modification')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteConfirm = async () => {
        if (!concertToDelete) return

        try {
            const response = await fetch('/api/prochains-concerts', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: concertToDelete }),
            })

            if (!response.ok) throw new Error('Erreur lors de la suppression')

            toast.success('Concert supprimé avec succès')
            fetchConcerts()
        } catch (error) {
            toast.error('Erreur lors de la suppression')
            console.error(error);

        } finally {
            setDeleteDialogOpen(false)
            setConcertToDelete(null)
        }
    }

    // Loading State Component
    const LoadingState = () => {

        const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0])

        useEffect(() => {
            const intervalId = setInterval(() => {
                setLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)])
            }, 2000)

            return () => clearInterval(intervalId)
        }, [])

        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="space-y-4 text-center">
                    <Music2 className="h-12 w-12 text-primary/50 animate-pulse mx-auto" />
                    <p className="text-sm text-muted-foreground">
                        {loadingMessage || loadingMessages[0]}
                    </p>
                </div>
            </div>
        )
    }

    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="text-center space-y-4">
                <Music2 className="h-16 w-16 text-primary/30 mx-auto" />
                <h2 className="text-xl font-medium">Aucun concert prévu</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                    Commencez par ajouter votre premier concert pour créer votre programmation
                </p>
            </div>
            <AddConcertButton />
        </div>
    )
    const AddConcertButton = () => (
        <Dialog open={open} onOpenChange={(newOpen) => {
            if (!loading) {
                setOpen(newOpen);
            }
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full px-6">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un concert
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">Nouveau concert</DialogTitle>
                    <DialogDescription>
                        Remplissez les informations du concert
                    </DialogDescription>
                </DialogHeader>
                <ConcertForm
                    onSubmit={handleCreate}
                    loading={loading}
                    initialData={null}
                    submitLabel="Ajouter"
                    onClose={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );

    const ConcertCard = ({ concert }: { concert: Concert }) => (
        <div className="bg-white dark:bg-black rounded-2xl overflow-hidden shadow-sm border border-border/50 transition-all duration-300 hover:shadow-md">
            <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {concert.affiche && (
                        <div className="w-full md:w-48 flex-shrink-0">
                            <div className="aspect-[3/4] rounded-lg overflow-hidden">
                                <ConcertPoster
                                    src={concert.affiche}
                                    alt={`Affiche du concert ${concert.name || 'sans nom'}`}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex-1 space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-xl font-medium tracking-tight">
                                {concert.name || "Concert sans titre"}
                            </h3>

                            <div className="space-y-3">
                                <InfoItem icon={MapPin} text={concert.place} />
                                <InfoItem
                                    icon={Calendar}
                                    text={format(new Date(concert.date), 'dd MMMM yyyy', { locale: fr })}
                                />
                                <InfoItem
                                    icon={Clock}
                                    text={concert.time.slice(0, 5).replace(':', 'h')}
                                />
                                <InfoItem
                                    icon={Tags}
                                    text={concert.context === 'orchestre_et_choeur'
                                        ? 'Orchestre et Chœur'
                                        : concert.context.charAt(0).toUpperCase() + concert.context.slice(1)}
                                />
                            </div>
                        </div>

                        {concert.additional_informations && (
                            <div className="pt-4 border-t border-border/50">
                                <p className="text-sm text-muted-foreground">
                                    {concert.additional_informations}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex md:flex-col gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full"
                            onClick={() => {
                                setEditingConcert(concert)
                                setEditDialogOpen(true)
                            }}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full text-destructive"
                            onClick={() => handleDeleteClick(concert.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )

    const InfoItem = ({ icon: Icon, text }: { icon: LucideIcon; text: string }) => (
        <div className="flex items-center text-sm text-muted-foreground">
            <Icon className="h-4 w-4 mr-3 text-muted-foreground/70" />
            <span>{text}</span>
        </div>
    )

    if (loading) {
        return <LoadingState />
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-medium">Prochains Concerts</h1>
                <AddConcertButton />
            </header>

            {loading ? (
                <LoadingState />
            ) : concerts.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="space-y-6">
                    {concerts.map((concert) => (
                        <ConcertCard key={concert.id} concert={concert} />
                    ))}
                </div>
            )}

            {/* Alert Dialog for Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce concert ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action ne peut pas être annulée.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Modifier le concert</DialogTitle>
                        <DialogDescription>
                            Modifiez les informations du concert
                        </DialogDescription>
                    </DialogHeader>
                    <ConcertForm
                        onSubmit={handleEdit}
                        loading={loading}
                        initialData={editingConcert}
                        submitLabel="Enregistrer"
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
