"use client";
import React, { useState } from "react";
import { FiLoader } from "react-icons/fi";
import { toast } from "sonner";

const Subscribe = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const message_success =
    "Merci d'avoir souscrit à la Newsletter du Bon Tempérament !";
  const description_success =
    "Nous vous enverrons de façon ponctuelle les événements (concerts, tournées d'été...) associés à notre chorale !" as string;

  // Email validation regex
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setEmail(value);

    // Clear error when user starts typing
    if (emailError) {
      setEmailError("");
    }

    // Validate email format in real-time (only if user has typed something)
    if (value.trim() && !validateEmail(value.trim())) {
      setEmailError("Veuillez entrer une adresse email valide");
    } else {
      setEmailError("");
    }
  };

  const handleSubscribe = async () => {
    const trimmedEmail = email.trim();

    // Validate email is not empty
    if (!trimmedEmail) {
      setEmailError("Veuillez entrer une adresse email");
      toast.error("Veuillez entrer une adresse email valide");
      return;
    }

    // Validate email format
    if (!validateEmail(trimmedEmail)) {
      setEmailError("Veuillez entrer une adresse email valide");
      toast.error("Format d'email invalide. Exemple: nom@exemple.com");
      return;
    }

    // Clear any previous errors
    setEmailError("");
    setIsLoading(true);

    try {
      // First check if email is already in the group
      const checkResponse = await fetch(
        `/api/check-group-member?email=${encodeURIComponent(trimmedEmail)}`,
      );
      const checkData = await checkResponse.json();

      if (checkData.isMember) {
        toast.info("Vous êtes déjà abonné(e) à notre newsletter !", {
          description:
            "Cette adresse email est déjà dans notre liste de diffusion.",
        });
        setEmail(""); // Clear the input
        setIsLoading(false);
        return;
      }

      // If not a member, proceed with subscription
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(message_success, { description: description_success });
        setEmail(""); // Clear the input on success
      } else {
        // Handle specific error for already member (backup check)
        if (data.error === "already_member") {
          toast.info("Vous êtes déjà abonné(e) à notre newsletter !", {
            description:
              "Cette adresse email est déjà dans notre liste de diffusion.",
          });
          setEmail(""); // Clear the input
        } else {
          console.error("Failed to subscribe:", data.error);
          toast.error(
            "Une erreur s'est produite, veuillez réessayer plus tard!",
          );
        }
      }
    } catch (error) {
      console.error("Failed to subscribe:", error);
      toast.error("Une erreur s'est produite, veuillez réessayer plus tard!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <div
        className={`flex overflow-hidden rounded-lg border bg-white shadow-sm transition-colors dark:bg-gray-800 ${
          emailError
            ? "border-red-500 dark:border-red-500"
            : "border-gray-300 dark:border-gray-600"
        }`}
      >
        <input
          type="email"
          name="email"
          placeholder="Adresse e-mail"
          value={email}
          onChange={handleInputChange}
          disabled={isLoading}
          className={`focus:ring-primary/20 w-3/5 rounded-l-lg border-0 bg-transparent py-3 pl-4 text-sm text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:outline-none focus:ring-inset disabled:cursor-not-allowed disabled:opacity-50 lg:w-4/5 dark:text-gray-100 dark:placeholder:text-gray-400 ${
            emailError ? "text-red-600 dark:text-red-400" : ""
          }`}
          aria-invalid={emailError ? "true" : "false"}
          aria-describedby={emailError ? "email-error" : undefined}
        />

        <button
          onClick={handleSubscribe}
          disabled={isLoading || !email.trim()}
          className={`from-primary flex w-2/5 items-center justify-center gap-2 rounded-r-lg bg-gradient-to-r to-[#00F1AE] px-4 py-3 text-xs font-bold text-white transition-all duration-200 md:text-sm lg:w-1/5 lg:text-base ${
            isLoading || !email.trim()
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:opacity-90"
          }`}
        >
          {isLoading ? (
            <>
              <FiLoader className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Chargement...</span>
            </>
          ) : (
            "S'abonner"
          )}
        </button>
      </div>
      {emailError && (
        <p
          id="email-error"
          className="mt-2 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {emailError}
        </p>
      )}
    </div>
  );
};

export default Subscribe;
