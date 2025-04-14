'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import RouteNames from '@/utils/routes'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function ResetPasswordForm() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
            })

            if (error) {
                toast.error("Erreur", {
                    description: "Une erreur est survenue lors de l'envoi du mail."
                })
                return
            }

            setSubmitted(true)
            toast.success("Email envoyé", {
                description: "Vérifiez votre boîte mail pour réinitialiser votre mot de passe."
            })
        } catch (error) {
            console.error('Reset password error:', error)
            toast.error("Erreur", {
                description: "Une erreur inattendue est survenue."
            })
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Email envoyé</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Vérifiez votre boîte mail pour réinitialiser votre mot de passe.
                    </p>
                </div>
                <Button
                    onClick={() => router.push(RouteNames.AUTH.LOGIN)}
                    className="w-full"
                >
                    Retour à la connexion
                </Button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Réinitialiser le mot de passe</h1>
                <p className="text-balance text-sm text-muted-foreground">
                    Entrez votre email pour recevoir un lien de réinitialisation
                </p>
            </div>
            <div className="grid gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        className="lowercase"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? 'Envoi...' : 'Envoyer le lien'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push(RouteNames.AUTH.LOGIN)}
                        className="w-full"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour à la connexion
                    </Button>
                </div>
            </div>
        </form>
    )
}
