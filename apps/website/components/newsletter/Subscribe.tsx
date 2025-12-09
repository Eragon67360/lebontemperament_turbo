"use client";
import React, { useState } from "react";
import { toast } from "sonner";

const Subscribe = () => {
  const [email, setEmail] = useState("");

  const message_success =
    "Merci d'avoir souscrit à la Newsletter du Bon Tempérament !";
  const description_success =
    "Nous vous enverrons de façon ponctuelle les événements (concerts, tournées d'été...) associés à notre chorale !" as string;

  // const message_error = "Merci d'avoir souscrit à la Newsletter du Bon Tempérament !";
  // const description_error = "Nous vous enverrons de façon ponctuelle les événements (concerts, tournées d'été...) associés à notre chorale !";

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handleSubscribe = async () => {
    if (email) {
      try {
        const response = await fetch("/api/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success(message_success, { description: description_success });
          setEmail(""); // Clear the input on success
        } else {
          console.error("Failed to subscribe:", data.error);
          toast.error(
            "Une erreur s'est produite, veuillez réessayer plus tard!",
          );
        }
      } catch (error) {
        console.error("Failed to subscribe:", error);
        toast.error("Une erreur s'est produite, veuillez réessayer plus tard!");
      }
    } else {
      toast.error("Veuillez entrer une adresse email valide");
    }
  };

  return (
    <div className="mt-8 flex rounded-lg border-[1px] border-gray-300">
      <input
        type="text"
        name="email"
        placeholder="Adresse e-mail"
        value={email}
        onChange={handleInputChange}
        className="w-3/5 rounded-l-lg py-2 pl-2 lg:w-4/5"
      />

      <button
        onClick={handleSubscribe}
        className="from-primary w-2/5 rounded-r-lg bg-gradient-to-r to-[#00F1AE] text-xs font-bold text-white md:text-sm lg:w-1/5 lg:text-base"
      >
        S&apos;abonner
      </button>
      {/* <ButtonWithToast
                message={"Merci d'avoir souscrit à la Newsletter du Bon Tempérament !"}
                description={"Nous vous enverrons de façon ponctuelle les événements (concerts, tournées d'été...) associés à notre chorale !"}
                onClick={handleSubscribe}
            /> */}
    </div>
  );
};

export default Subscribe;
