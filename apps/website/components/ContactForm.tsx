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
    []
  );

  // Check form validity
  useEffect(() => {
    const emailError = validateField("email", formData.email);
    const messageError = validateField("message", formData.message);

    setIsButtonDisabled(
      !formData.email ||
        !formData.message ||
        Boolean(emailError) ||
        Boolean(messageError)
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
      className="mt-[120px] px-8 lg:px-24"
      id="contact"
      aria-labelledby="contact-title"
    >
      <h2
        id="contact-title"
        className="text-primary/50 font-light text-title leading-none"
      >
        Nous contacter
      </h2>
      <div className="mt-[30px] flex gap-[30px] justify-between">
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

            <div className="flex justify-start mt-6 gap-4">
              <button
                type="submit"
                disabled={isButtonDisabled || loading}
                className="justify-end px-[20px] py-[18px] bg-[#333] text-white border-[#333] border hover:bg-white hover:text-[#333] transition-all flex items-center space-x-[18px] disabled:opacity-50 disabled:cursor-not-allowed"
                aria-describedby={isButtonDisabled ? "submit-help" : undefined}
              >
                <span className="uppercase text-[12px] tracking-[2.4px]">
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

        <div className="w-1/2 hidden lg:flex justify-end">
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
