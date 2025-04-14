'use client'

import { login } from '@/app/auth/login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from "sonner"
import { useEffect } from "react"
import { ERROR_MESSAGES } from '@/consts/errorMessages'
import { Loader2 } from "lucide-react"

export default function LoginForm() {
    const searchParams = useSearchParams()
    const errorCode = searchParams.get("error")
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        if (errorCode && errorCode in ERROR_MESSAGES) {
            toast.error(ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES])
        }
    }, [errorCode])

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const router = useRouter()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            try {
                await login(formData)
                toast.success('Connexion réussie')
            } catch (error) {
                console.error(error)
            }
        })
    }

    return (
        <form className='flex flex-col gap-6' action={handleSubmit}>
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Se connecter</h1>
                <p className="text-balance text-sm text-muted-foreground">
                    Entrez votre email pour vous connecter
                </p>
            </div>
            <div className="grid gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                        disabled={isPending}
                    />
                </div>
                <div className="grid gap-2">
                    <div className="flex items-center">
                        <Label htmlFor="password">Mot de passe</Label>
                        <Button
                            variant="link"
                            className="ml-auto h-auto p-0 text-xs"
                            onClick={() => router.push('/auth/reset-password')}
                            type="button"
                            disabled={isPending}
                        >
                            Mot de passe oublié?
                        </Button>
                    </div>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Mot de passe"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        autoComplete="current-password"
                        disabled={isPending}
                    />
                </div>
                <Button
                    type="submit"
                    className="w-full"
                    disabled={isPending}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connexion...
                        </>
                    ) : (
                        'Se connecter'
                    )}
                </Button>
            </div>
        </form>
    )
}
