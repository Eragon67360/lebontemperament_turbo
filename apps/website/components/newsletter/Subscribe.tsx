'use client'
import React, { useState } from 'react';
import { toast } from 'sonner';


const Subscribe = () => {

    const [email, setEmail] = useState('');

    const message_success = "Merci d'avoir souscrit à la Newsletter du Bon Tempérament !";
    const description_success = "Nous vous enverrons de façon ponctuelle les événements (concerts, tournées d'été...) associés à notre chorale !" as string;


    // const message_error = "Merci d'avoir souscrit à la Newsletter du Bon Tempérament !";
    // const description_error = "Nous vous enverrons de façon ponctuelle les événements (concerts, tournées d'été...) associés à notre chorale !";


    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(event.target.value);
    };

    const handleSubscribe = async () => {
        if (email) {
            try {
                const response = await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                });

                const data = await response.json();

                if (response.ok) {
                    toast(message_success, { description: description_success });
                } else {
                    console.error("Failed to subscribe:", data.error);
                    toast.error("Une erreur s'est produite, veuillez réessayer plus tard!")
                }
            } catch (error) {
                console.error("Failed to subscribe:", error);
                toast.error("Une erreur s'est produite, veuillez réessayer plus tard!")
            }
        } else {
            toast.error("Veuillez entrer une adresse email valide")
        }
    };



    return (
        <div className='mt-8 rounded-lg border-gray-300 border-[1px] flex'>
            <input
                type="text"
                name="email"
                placeholder='Adresse e-mail'
                value={email}
                onChange={handleInputChange}
                className='w-3/5 lg:w-4/5 py-2 pl-2 rounded-l-lg' />

            <button onClick={handleSubscribe} className="w-2/5 lg:w-1/5 rounded-r-lg bg-gradient-to-r from-primary to-[#00F1AE] text-white font-bold text-xs md:text-sm lg:text-base" >
                S&apos;abonner
            </button>
            {/* <ButtonWithToast
                message={"Merci d'avoir souscrit à la Newsletter du Bon Tempérament !"}
                description={"Nous vous enverrons de façon ponctuelle les événements (concerts, tournées d'été...) associés à notre chorale !"}
                onClick={handleSubscribe}
            /> */}

        </div>
    )
}

export default Subscribe