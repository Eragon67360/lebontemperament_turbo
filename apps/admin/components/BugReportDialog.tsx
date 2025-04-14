"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/utils/supabase/client"

export function BugReportDialog() {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const supabase = createClient()

    const handleSubmit = async () => {
        if (!title || !description) return

        setIsSubmitting(true)
        try {
            const { error } = await supabase
                .from('bug_reports')
                .insert([
                    {
                        title,
                        description,
                        reported_by: (await supabase.auth.getUser()).data.user?.id
                    }
                ])

            if (error) throw error

            // Reset form and close dialog
            setTitle("")
            setDescription("")
            setOpen(false)
        } catch (error) {
            console.error('Error submitting bug report:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Signaler un problème
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Signaler un problème ou proposer une fonctionnalité</DialogTitle>
                    <DialogDescription>
                        Décrivez le problème rencontré ou la fonctionnalité que vous souhaitez proposer.
                        Notre équipe technique en sera informée immédiatement.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label htmlFor="title">Titre</label>
                        <Input
                            id="title"
                            placeholder="Résumé bref du problème ou de la proposition"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="description">Description</label>
                        <Textarea
                            id="description"
                            placeholder="Décrivez en détail ce que vous avez constaté..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !title || !description}
                    >
                        {isSubmitting ? "Envoi en cours..." : "Envoyer le rapport"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
