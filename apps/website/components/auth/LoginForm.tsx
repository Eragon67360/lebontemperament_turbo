'use client'

import { login } from '@/app/auth/login/actions'
import { useAuth } from '@/components/providers/AuthProvider'
import { ERROR_MESSAGES } from '@/consts/errorMessages'
import RouteNames from '@/utils/routes'
import { createClient } from '@/utils/supabase/client'
import { Button, Input, addToast } from '@heroui/react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { FcGoogle } from 'react-icons/fc'
import { FiLoader } from 'react-icons/fi'

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
    'signup_disabled': "Ce compte n'existe pas dans notre base de données",
    'access_denied': "L'accès a été refusé.",
    'inactive_account': "Votre compte n'est pas actif ou n'existe pas.",
    'auth_callback_error': "Erreur lors de l'authentification.",
}

export default function LoginForm() {
    const params = useParams();
    const searchParams = useSearchParams()
    const error = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")
    const { setUser } = useAuth()
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    useEffect(() => {
        const hashParams = window.location.hash;
        const parsedHash = new URLSearchParams(hashParams);
        const errorCode = parsedHash.get("error_code");

        if (error || errorCode) {
            const errorMessage =
                OAUTH_ERROR_MESSAGES[errorCode || error || ''] ||
                errorDescription?.replace(/\+/g, ' ') ||
                ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES] ||
                "Une erreur est survenue lors de la connexion"

            addToast({
                title: 'Erreur de connexion',
                description: errorMessage,
                color: 'danger',
            })

            // router.replace(RouteNames.AUTH.LOGIN)
        }
    }, [error, errorDescription, router, params])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleGoogleSignIn = async () => {
        try {
            const supabase = createClient()
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    redirectTo: `${window.location.origin}/auth/callback`,
                }
            })


            if (error) {
                addToast({
                    title: 'Erreur Google',
                    description: error.message,
                    color: 'danger',
                })
            }
        } catch (error: unknown) {
            // Type guard pour vérifier si c'est une Error
            if (error instanceof Error) {
                console.error('Google login error:', error)
                addToast({
                    title: 'Erreur de connexion',
                    description: error.message || "Erreur lors de la connexion avec Google",
                    color: 'danger',
                })
            } else {
                // Fallback pour les cas où ce n'est pas une Error
                console.error('Google login error:', error)
                addToast({
                    title: 'Erreur de connexion',
                    description: "Erreur lors de la connexion avec Google",
                    color: 'danger',
                })
            }
        }

    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        startTransition(async () => {
            try {
                const formData = new FormData(event.currentTarget)
                const result = await login(formData)

                if (result?.error) {
                    const errorMessage = ERROR_MESSAGES[result.error as keyof typeof ERROR_MESSAGES] ||
                        "Une erreur est survenue"

                    addToast({
                        title: 'Échec de la connexion',
                        description: errorMessage,
                        color: 'danger',
                    })

                    router.push(`${RouteNames.AUTH.LOGIN}?error=${result.error}`)
                    return
                }

                if (result?.success) {
                    const supabase = createClient()
                    const { data: { user } } = await supabase.auth.getUser()
                    setUser(user)

                    addToast({
                        title: 'Bienvenue !',
                        description: "Connexion réussie",
                        color: 'success',
                    })

                    router.push(RouteNames.MEMBRES.ROOT)
                }
            } catch (error) {
                console.error('Login error:', error)
                addToast({
                    title: 'Erreur inattendue',
                    description: "Une erreur inattendue est survenue",
                    color: 'danger',
                })
            }
        })
    }

    return (
        <form className='flex flex-col gap-6' onSubmit={handleSubmit}>
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Se connecter</h1>
                <p className="text-balance text-sm text-muted-foreground">
                    Entrez votre email pour vous connecter
                </p>
            </div>

            <div className="grid gap-6">
                <div className="grid gap-2">
                    <Input
                        id="email"
                        size='sm'
                        name="email"
                        type="email"
                        label="Email"
                        value={formData.email}
                        onChange={handleChange}
                        isRequired
                        autoComplete="email"
                        disabled={isPending}
                    />
                </div>

                <div className="grid gap-2">
                    <div className="flex items-center ml-auto">
                        <Link
                            href={RouteNames.AUTH.RESET_PASSWORD}
                            className='text-xs text-primary hover:underline'
                            tabIndex={isPending ? -1 : 0}
                        >
                            Mot de passe oublié?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        size='sm'
                        name="password"
                        type="password"
                        label="Mot de passe"
                        value={formData.password}
                        onChange={handleChange}
                        isRequired
                        autoComplete="current-password"
                        disabled={isPending}
                    />
                </div>

                <Button
                    variant='solid'
                    type="submit"
                    color='primary'
                    className="w-full"
                    isDisabled={isPending}
                    aria-busy={isPending}
                >
                    {isPending ? (
                        <>
                            <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                            Connexion...
                        </>
                    ) : (
                        'Se connecter'
                    )}
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Ou continuer avec
                        </span>
                    </div>
                </div>

                <Button
                    type="button"
                    variant="bordered"
                    className="w-full"
                    onPress={handleGoogleSignIn}
                    isDisabled={isPending}
                >
                    <FcGoogle className="mr-2 h-4 w-4" />
                    Google
                </Button>
            </div>
        </form>
    )
}
