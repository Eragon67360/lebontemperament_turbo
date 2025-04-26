'use client'

import RouteNames from '@/utils/routes'
import { createClient } from '@/utils/supabase/client'
import { Button, Input, addToast } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CiMail } from "react-icons/ci"
import { FiLoader } from 'react-icons/fi'

export default function CreateProfileForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [invalidLink, setInvalidLink] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleTokens = async () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.substring(1)
        const urlParams = new URLSearchParams(hash)

        const refreshToken = urlParams.get('refresh_token')
        const accessToken = urlParams.get('access_token')

        if (!refreshToken || !accessToken) {
          setInvalidLink(true)
          return
        }

        try {
          const { error } = await supabase.auth.refreshSession({
            refresh_token: refreshToken
          })

          if (error) {
            throw error
          }
        } catch (error) {
          console.error('Session refresh error:', error)
          setInvalidLink(true)
        }
      }
    }

    handleTokens()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (password !== confirmPassword) {
      addToast({
        title: 'Oups ! 🙈',
        description: 'Les mots de passe ne correspondent pas, un petit effort de coordination !',
        color: 'danger',
      })
      setLoading(false)
      return
    }

    if (password.length < 8) {
      addToast({
        title: 'Attention ! 📏',
        description: 'Il nous faut au moins 8 caractères pour un mot de passe costaud !',
        color: 'danger',
      })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      addToast({
        title: 'Youhou ! 🎉',
        description: 'Ton compte est prêt ! Cette fois-ci, note bien ton mot de passe quelque part...',
        color: 'success',
      })

      router.push(RouteNames.AUTH.LOGIN)
    } catch (error) {
      console.error('Profile creation error:', error)
      addToast({
        title: 'Aïe aïe aïe ! 😅',
        description: 'Un petit souci technique... On réessaie ?',
        color: 'danger',
      })
    } finally {
      setLoading(false)
    }
  }

  if (invalidLink) {
    return (
      <div className="flex flex-col items-center gap-4 text-center text-destructive">
        <h1 className="text-2xl font-bold">Oups ! Le lien n&apos;est pas valide 😕</h1>
        <p className="text-balance">
          Il semblerait que ce lien ait expiré ou soit invalide.
          Tu peux contacter l&apos;administrateur pour obtenir un nouveau lien !
        </p>
        <Button
          as="a"
          href="mailto:thomas-moser@orange.fr?subject=Nouveau lien d'invitation - Le Bon Tempérament&body=Bonjour, mon lien d'invitation n'est plus valide. Pourriez-vous m'en envoyer un nouveau ? Merci !"
          variant="bordered"
          className="mt-2"
        >
          <span className="mr-2"><CiMail className='text-muted-foreground' /></span>
          Contacter l&apos;administrateur
        </Button>
      </div>
    )
  }


  return (
    <form className='flex flex-col gap-6' onSubmit={handleSubmit}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Bienvenue dans l&apos;équipe ! 🎉</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Choisis un mot de passe qui en jette !
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Input
            id="password"
            size='sm'
            type="password"
            label="Ton mot de passe secret"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            isRequired
            autoComplete="new-password"
            disabled={loading}
          />
        </div>
        <div className="grid gap-2">
          <Input
            id="confirmPassword"
            size='sm'
            type="password"
            label="Redis-le pour être sûr(e) !"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            isRequired
            autoComplete="new-password"
            disabled={loading}
          />
        </div>
        <Button
          variant='solid'
          type="submit"
          color='primary'
          className="w-full gap-2"
          isDisabled={loading}
          aria-busy={loading}
        >
          {loading ? (
            <>
              <FiLoader className="mr-2 h-4 w-4 animate-spin" />
              La magie opère...
            </>
          ) : (
            'Créer mon super compte ✨'
          )}
        </Button>
      </div>
    </form>
  )
}
