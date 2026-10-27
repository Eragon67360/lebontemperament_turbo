"use client";
import { Button, FieldError, Input, Label, TextField } from "@heroui/react";
import { NEWSLETTER_HONEYPOT_FIELD } from "@repo/domain/utils/newsletter";
import Link from "next/link";
import React, { useState } from "react";
import { FiLoader } from "react-icons/fi";
import { toast } from "sonner";

const Subscribe = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  // Honeypot: people never see this field, so it stays empty for them.
  const [website, setWebsite] = useState("");

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
      // The server answers the same way whether or not the address is
      // already subscribed (and skips the emails if it is).
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          [NEWSLETTER_HONEYPOT_FIELD]: website,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(message_success, { description: description_success });
        setEmail(""); // Clear the input on success
      } else {
        console.error("Failed to subscribe:", data.error);
        toast.error("Une erreur s'est produite, veuillez réessayer plus tard!");
      }
    } catch (error) {
      console.error("Failed to subscribe:", error);
      toast.error("Une erreur s'est produite, veuillez réessayer plus tard!");
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = !isLoading && email.trim() !== "";

  return (
    <form
      className="mt-8"
      noValidate
      aria-label="Inscription à la newsletter"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) handleSubscribe();
      }}
    >
      {/* Honeypot, off-screen and hidden from assistive technologies */}
      <div
        aria-hidden="true"
        className="absolute -left-[10000px] h-px w-px overflow-hidden"
      >
        <label htmlFor="newsletter-website">Site web</label>
        <input
          id="newsletter-website"
          type="text"
          name={NEWSLETTER_HONEYPOT_FIELD}
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>
      {/* The same field kit as the contact form above: a visible label, the
          site's focus ring, the invalid state and its message linked to the
          field. The primary button is the solid teal (globals.css, #337). */}
      <TextField
        name="email"
        type="email"
        isInvalid={!!emailError}
        isDisabled={isLoading}
        fullWidth
      >
        <Label>Adresse e-mail</Label>
        <div className="flex items-center gap-2">
          <Input
            value={email}
            onChange={handleInputChange}
            autoComplete="email"
            className="min-w-0 flex-1"
          />
          <Button
            type="submit"
            variant="primary"
            isDisabled={!canSubmit}
            className="shrink-0"
          >
            {isLoading ? (
              <>
                <FiLoader className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span className="hidden sm:inline">Chargement...</span>
              </>
            ) : (
              "S'abonner"
            )}
          </Button>
        </div>
        <FieldError>
          {emailError && <span role="alert">{emailError}</span>}
        </FieldError>
      </TextField>
      <p className="text-muted mt-2 text-xs">
        Votre adresse e-mail sert uniquement à vous envoyer la newsletter ; vous
        pouvez vous désinscrire à tout moment. En savoir plus dans notre{" "}
        <Link
          href="/politique-de-confidentialite"
          className="text-primary-text underline hover:no-underline"
        >
          politique de confidentialité
        </Link>
        .
      </p>
    </form>
  );
};

export default Subscribe;
