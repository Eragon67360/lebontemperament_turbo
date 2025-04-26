import React from 'react'
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-cover bg-center text-gray-800" style={{ backgroundImage: 'url(/img/not_found.webp)' }}>
            <div className="bg-transparent p-8 text-center max-w-md text-white">
                <h1 className="text-4xl font-bold mb-4">Page non trouvée</h1>
                <p className="text-lg mb-8">Désolé, la page que vous recherchez n&apos;existe pas.</p>
                <Link href="/" className="p-4 rounded-2xl bg-primary text-white font-bold">
                    Retour à la page d&apos;accueil
                </Link>
            </div>
        </div>
    );
}
