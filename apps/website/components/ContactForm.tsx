"use client";
import { ContactFormProps } from "@/types/contactFormData";
import {
  Button,
  FieldError,
  Input,
  Label,
  Spinner,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import { CldImage } from "next-cloudinary";
import { useTheme } from "next-themes";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { IoIosArrowRoundForward } from "react-icons/io";

const ContactForm = () => {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Track mounted state for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Global reCAPTCHA error handler
  useEffect(() => {
    const handleRecaptchaError = (event: any) => {
      console.error("Global reCAPTCHA error:", event);
    };

    // Listen for reCAPTCHA errors
    window.addEventListener("recaptcha-error", handleRecaptchaError);

    return () => {
      window.removeEventListener("recaptcha-error", handleRecaptchaError);
    };
  }, []);

  const [formData, setFormData] = useState<ContactFormProps>({
    lastName: "",
    firstName: "",
    email: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(true);
  const [errors, setErrors] = useState<Partial<ContactFormProps>>({});
  const [honeypot, setHoneypot] = useState<string>("");
  const [captchaValue, setCaptchaValue] = useState<string | null>(null); // State for CAPTCHA value
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
  useEffect(() => {
    if (!siteKey) {
      console.warn(
        "reCAPTCHA site key missing. Set NEXT_PUBLIC_RECAPTCHA_SITE_KEY and rebuild to enable CAPTCHA.",
      );
    }
  }, [siteKey]);

  // Validate email format
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Validate form fields
  const validateField = useCallback(
    (name: keyof ContactFormProps, value: string) => {
      switch (name) {
        case "email":
          if (!value) return "L'adresse email est requise";
          if (!isValidEmail(value))
            return "Veuillez entrer une adresse email valide";
          return "";
        case "message":
          if (!value) return "Le message est requis";
          if (value.length < 10)
            return "Le message doit contenir au moins 10 caractères";
          return "";
        case "firstName":
          if (value && value.length < 2)
            return "Le prénom doit contenir au moins 2 caractères";
          return "";
        case "lastName":
          if (value && value.length < 2)
            return "Le nom doit contenir au moins 2 caractères";
          return "";
        default:
          return "";
      }
    },
    [],
  );

  // Check form validity
  useEffect(() => {
    const emailError = validateField("email", formData.email);
    const messageError = validateField("message", formData.message);

    setIsButtonDisabled(
      !formData.email ||
        !formData.message ||
        Boolean(emailError) ||
        Boolean(messageError) ||
        !captchaValue, // Disable button if CAPTCHA is not verified
    );
  }, [formData, validateField, captchaValue]);

  const handleFieldChange = (name: keyof ContactFormProps, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFieldBlur = (name: keyof ContactFormProps, value: string) => {
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (honeypot) {
      toast.danger("Erreur", { description: "Soumission invalide." });
      return;
    }

    if (!captchaValue) {
      toast.danger("Erreur", {
        description: "Veuillez vérifier que vous n'êtes pas un robot.",
      });
      return;
    }

    const newErrors: Partial<ContactFormProps> = {};
    Object.keys(formData).forEach((key) => {
      const fieldName = key as keyof ContactFormProps;
      const value = formData[fieldName];
      if (value !== undefined && typeof value === "string") {
        const error = validateField(fieldName, value);
        if (error) {
          newErrors[fieldName] = error;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, captchaValue }), // Send CAPTCHA value to the server
      });

      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      await response.json();
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        subject: "",
        message: "",
      });
      setErrors({});
      setCaptchaValue(null); // Reset CAPTCHA value
      recaptchaRef.current?.reset(); // Reset reCAPTCHA widget
      toast.success("Succès", {
        description: "Votre demande a bien été envoyée",
      });
    } catch (err) {
      console.error(err);
      // Reset reCAPTCHA on error
      setCaptchaValue(null);
      recaptchaRef.current?.reset();
      toast.danger("Erreur", {
        description: "Votre demande n'a pas pu être envoyée",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="bg-background mx-auto w-full max-w-[1440px] px-8 py-16 lg:px-24"
      id="contact"
      aria-labelledby="contact-title"
    >
      <h2
        id="contact-title"
        className="text-primary/50 dark:text-primary text-title leading-none font-light"
      >
        Nous contacter
      </h2>
      <div className="mt-12 flex justify-between gap-12">
        <div className="w-full lg:w-1/2">
          <form
            className="flex flex-col gap-6"
            onSubmit={handleSubmit}
            noValidate
            aria-label="Formulaire de contact"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <TextField name="lastName" isInvalid={!!errors.lastName}>
                <Label>Nom de famille</Label>
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleFieldChange("lastName", e.target.value)
                  }
                  onBlur={() => handleFieldBlur("lastName", formData.lastName)}
                  aria-describedby={
                    errors.lastName ? "lastName-error" : undefined
                  }
                />
                <FieldError>{errors.lastName}</FieldError>
              </TextField>

              <TextField name="firstName" isInvalid={!!errors.firstName}>
                <Label>Prénom</Label>
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleFieldChange("firstName", e.target.value)
                  }
                  onBlur={() =>
                    handleFieldBlur("firstName", formData.firstName)
                  }
                  aria-describedby={
                    errors.firstName ? "firstName-error" : undefined
                  }
                />
                <FieldError>{errors.firstName}</FieldError>
              </TextField>
            </div>

            <TextField
              name="email"
              type="email"
              isRequired
              isInvalid={!!errors.email}
            >
              <Label>Email</Label>
              <Input
                value={formData.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                onBlur={() => handleFieldBlur("email", formData.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              <FieldError>{errors.email}</FieldError>
            </TextField>

            <TextField name="subject">
              <Label>Sujet</Label>
              <Input
                type="text"
                value={formData.subject}
                onChange={(e) => handleFieldChange("subject", e.target.value)}
              />
            </TextField>

            <TextField name="message" isRequired isInvalid={!!errors.message}>
              <Label>Message</Label>
              <TextArea
                value={formData.message}
                rows={6}
                onChange={(e) => handleFieldChange("message", e.target.value)}
                onBlur={() => handleFieldBlur("message", formData.message)}
                aria-describedby={errors.message ? "message-error" : undefined}
              />
              <FieldError>{errors.message}</FieldError>
            </TextField>

            <input
              type="text"
              name="honeypot"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
              autoComplete="off"
            />

            {siteKey && mounted ? (
              <ReCAPTCHA
                sitekey={siteKey}
                ref={recaptchaRef}
                onChange={(value) => {
                  setCaptchaValue(value);
                }}
                onExpired={() => {
                  setCaptchaValue(null);
                }}
                theme={resolvedTheme === "dark" ? "dark" : "light"}
                size="normal"
                type="image"
              />
            ) : siteKey ? (
              <div className="bg-surface-secondary h-[78px] w-[304px] animate-pulse rounded" />
            ) : (
              <div className="text-danger text-sm">
                reCAPTCHA non configuré — le formulaire est protégé côté
                serveur. Veuillez contacter l&apos;administrateur.
              </div>
            )}

            <div className="flex items-center gap-4">
              <Button
                type="submit"
                variant="primary"
                isDisabled={isButtonDisabled || loading}
                aria-describedby={isButtonDisabled ? "submit-help" : undefined}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" color="current" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <span className="text-xs tracking-[2.4px] uppercase">
                      Envoyer un mail
                    </span>
                    <IoIosArrowRoundForward className="scale-110" />
                  </>
                )}
              </Button>
            </div>

            {isButtonDisabled && (
              <p id="submit-help" className="text-muted text-sm">
                Veuillez remplir tous les champs obligatoires (email et message)
                et compléter la vérification reCAPTCHA pour pouvoir envoyer le
                formulaire.
              </p>
            )}
          </form>
        </div>

        <div className="hidden w-1/2 shrink-0 justify-end lg:flex">
          <CldImage
            src={"Site/logo"}
            alt="Logo Le Bon Tempérament - Contact"
            className="h-auto w-full shrink-0 object-contain"
            width={632}
            height={624}
          />
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
