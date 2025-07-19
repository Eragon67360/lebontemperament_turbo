"use client";
import { ContactFormProps } from "@/types/contactFormData";
import { Input, Spinner, Textarea, addToast } from "@heroui/react";
import { CldImage } from "next-cloudinary";
import React, { useEffect, useState, useCallback } from "react";
import { IoIosArrowRoundForward } from "react-icons/io";

const ContactForm = () => {
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
        Boolean(messageError),
    );
  }, [formData, validateField]);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Validate all fields
    const newErrors: Partial<ContactFormProps> = {};
    Object.keys(formData).forEach((key) => {
      const fieldName = key as keyof ContactFormProps;
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
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
        body: JSON.stringify(formData),
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
      addToast({
        title: "Succès",
        description: "Votre demande a bien été envoyée",
        color: "success",
      });
    } catch (err) {
      console.error(err);
      addToast({
        title: "Erreur",
        description: "Votre demande n'a pas pu être envoyée",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="w-full bg-white px-8 py-16 lg:px-24"
      id="contact"
      aria-labelledby="contact-title"
    >
      <h2
        id="contact-title"
        className="text-primary/50 text-title leading-none font-light"
      >
        Nous contacter
      </h2>
      <div className="mt-[30px] flex justify-between gap-[30px]">
        <div className="w-full lg:w-1/2">
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
            noValidate
            aria-label="Formulaire de contact"
          >
            <Input
              type="text"
              label="Nom de famille"
              name="lastName"
              value={formData.lastName}
              variant="flat"
              isInvalid={!!errors.lastName}
              errorMessage={errors.lastName}
              classNames={{
                input: "rounded-none bg-[#F3F3F3]",
                inputWrapper: "rounded-none",
              }}
              onValueChange={(value) => handleFieldChange("lastName", value)}
              onBlur={() => handleFieldBlur("lastName", formData.lastName)}
              aria-describedby={errors.lastName ? "lastName-error" : undefined}
            />

            <Input
              type="text"
              label="Prénom"
              name="firstName"
              value={formData.firstName}
              variant="flat"
              isInvalid={!!errors.firstName}
              errorMessage={errors.firstName}
              classNames={{
                input: "rounded-none bg-[#F3F3F3]",
                inputWrapper: "rounded-none",
              }}
              onValueChange={(value) => handleFieldChange("firstName", value)}
              onBlur={() => handleFieldBlur("firstName", formData.firstName)}
              aria-describedby={
                errors.firstName ? "firstName-error" : undefined
              }
            />

            <Input
              type="email"
              label="Email"
              name="email"
              value={formData.email}
              variant="flat"
              isRequired
              isInvalid={!!errors.email}
              errorMessage={errors.email}
              classNames={{
                input: "rounded-none bg-[#F3F3F3]",
                inputWrapper: "rounded-none",
              }}
              onValueChange={(value) => handleFieldChange("email", value)}
              onBlur={() => handleFieldBlur("email", formData.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              aria-required="true"
            />

            <Input
              type="text"
              label="Sujet"
              name="subject"
              value={formData.subject}
              variant="flat"
              classNames={{
                input: "rounded-none bg-[#F3F3F3]",
                inputWrapper: "rounded-none",
              }}
              onValueChange={(value) => handleFieldChange("subject", value)}
            />

            <Textarea
              type="textarea"
              label="Message"
              name="message"
              value={formData.message}
              variant="flat"
              isRequired
              isInvalid={!!errors.message}
              errorMessage={errors.message}
              classNames={{
                input: "rounded-none bg-[#F3F3F3] min-h-[200px]",
                inputWrapper: "rounded-none",
              }}
              onValueChange={(value) => handleFieldChange("message", value)}
              onBlur={() => handleFieldBlur("message", formData.message)}
              aria-describedby={errors.message ? "message-error" : undefined}
              aria-required="true"
            />

            <div className="mt-6 flex justify-start gap-4">
              <button
                type="submit"
                disabled={isButtonDisabled || loading}
                className="flex items-center justify-end space-x-[18px] border border-[#333] bg-[#333] px-[20px] py-[18px] text-white transition-all hover:bg-white hover:text-[#333] disabled:cursor-not-allowed disabled:opacity-50"
                aria-describedby={isButtonDisabled ? "submit-help" : undefined}
              >
                <span className="text-[12px] tracking-[2.4px] uppercase">
                  {loading ? "Envoi en cours..." : "Envoyer un mail"}
                </span>
                {!loading && (
                  <IoIosArrowRoundForward
                    className="scale-110"
                    aria-hidden="true"
                  />
                )}
              </button>
              {loading && (
                <Spinner color="primary" aria-label="Chargement en cours" />
              )}
            </div>

            {isButtonDisabled && (
              <p id="submit-help" className="text-sm text-gray-600">
                Veuillez remplir tous les champs obligatoires (email et message)
                pour pouvoir envoyer le formulaire.
              </p>
            )}
          </form>
        </div>

        <div className="hidden w-1/2 justify-end lg:flex">
          <CldImage
            src={"Site/logo"}
            alt="Logo Le Bon Tempérament - Contact"
            width={600}
            height={600}
          />
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
