// components/BugReportDetailsDialog.tsx
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/utils/supabase/client"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"

type BugMessage = {
    id: string
    bug_report_id: string
    sender_id: string
    message: string
    created_at: string
    sender: {
        email: string
        display_name: string | null
    }
}


interface BugReportDetailsProps {
    report: {
        id: string
        title: string
        description: string
        status: 'pending' | 'in_progress' | 'resolved'
        created_at: string
        profiles: {
            email: string
        }
    }
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800'
        case 'in_progress':
            return 'bg-blue-100 text-blue-800'
        case 'resolved':
            return 'bg-green-100 text-green-800'
        default:
            return 'bg-gray-100 text-gray-800'
    }
}

export function BugReportDetailsDialog({ report }: BugReportDetailsProps) {
    const [messages, setMessages] = useState<BugMessage[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [open, setOpen] = useState(false)
    const supabase = createClient()

    const fetchMessages = useCallback(async () => {
        const { data } = await supabase
            .from('bug_messages')
            .select(`
                *,
                profiles:sender_id(email)
            `)
            .eq('bug_report_id', report.id)
            .order('created_at', { ascending: true })

        if (data) {
            setMessages(data)
        }
    }, [report.id, supabase])

    useEffect(() => {
        fetchMessages()

        const subscription = supabase
            .channel('bug_messages_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'bug_messages' },
                fetchMessages
            )
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [fetchMessages, report.id, supabase])

    const sendMessage = async () => {
        if (!newMessage.trim()) {
            toast.error("Le message ne peut pas être vide")
            return
        }

        try {
            const { error } = await supabase
                .from('bug_messages')
                .insert({
                    bug_report_id: report.id,
                    message: newMessage.trim(),
                    sender_id: (await supabase.auth.getUser()).data.user?.id
                })

            if (error) throw error

            toast.success("Message envoyé avec succès")
            setNewMessage("")
            setOpen(false)
        } catch (error) {
            toast.error("Erreur lors de l'envoi du message")
            console.error(error)
        }
    }
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Voir les détails</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Bug Report Details</DialogTitle>
                </DialogHeader>
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">{report.title}</CardTitle>
                                <CardDescription>
                                    Reported by {report.profiles.email} on{' '}
                                    {new Date(report.created_at).toLocaleDateString('fr-FR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </CardDescription>
                            </div>
                            <Badge className={`${getStatusColor(report.status)} capitalize`}>
                                {report.status.replace('_', ' ')}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="mt-2">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="whitespace-pre-wrap text-sm text-gray-700">
                                    {report.description}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <div className="mt-6">
                    <h4 className="text-sm font-medium mb-2">Messages</h4>
                    <ScrollArea className="space-y-2 max-h-[200px] overflow-y-auto">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className="bg-gray-50 p-3 rounded-lg"
                            >
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-medium">

                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(message.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-sm mt-1">{message.message}</p>
                            </div>
                        ))}
                    </ScrollArea>

                    <div className="mt-4">
                        <Textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Écrivez votre message..."
                            className="mb-2"
                        />
                        <Button onClick={sendMessage}>Envoyer le message</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
