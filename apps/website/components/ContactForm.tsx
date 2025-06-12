"use client";
import { ContactFormProps } from "@/types/contactFormData";
import { Input, Spinner, Textarea, addToast } from "@heroui/react";
import { CldImage } from "next-cloudinary";
import React, { useEffect, useState } from "react";
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

  // Validate email format
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Check form validity
  useEffect(() => {
    setIsButtonDisabled(
      !formData.email || !formData.message || !isValidEmail(formData.email),
    );
  }, [formData]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    <div className="mt-[120px] px-8 lg:px-24" id="contact">
      <h2 className="text-primary/50 font-light text-title leading-none">
        Nous contacter
      </h2>
      <div className="mt-[30px] flex gap-[30px] justify-between">
        <div className="w-full lg:w-1/2">
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
            noValidate
          >
            <Input
              type="text"
              label="Nom de famille"
              name="lastName"
              value={formData.lastName}
              variant="flat"
              classNames={{
                input: "rounded-none bg-[#F3F3F3]",
                inputWrapper: "rounded-none",
              }}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, lastName: value }))
              }
            />

            <Input
              type="text"
              label="Prénom"
              name="firstName"
              value={formData.firstName}
              variant="flat"
              classNames={{
                input: "rounded-none bg-[#F3F3F3]",
                inputWrapper: "rounded-none",
              }}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, firstName: value }))
              }
            />

            <Input
              type="email"
              label="Email"
              name="email"
              value={formData.email}
              variant="flat"
              isRequired
              classNames={{
                input: "rounded-none bg-[#F3F3F3]",
                inputWrapper: "rounded-none",
              }}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, email: value }))
              }
              errorMessage={
                formData.email && !isValidEmail(formData.email)
                  ? "Veuillez entrer une adresse email valide"
                  : null
              }
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
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, subject: value }))
              }
            />

            <Textarea
              type="textarea"
              label="Message"
              name="message"
              value={formData.message}
              variant="flat"
              isRequired
              classNames={{
                input: "rounded-none bg-[#F3F3F3] min-h-[200px]",
                inputWrapper: "rounded-none",
              }}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, message: value }))
              }
            />

            <div className="flex justify-start mt-6 gap-4">
              <button
                type="submit"
                disabled={isButtonDisabled || loading}
                className="justify-end px-[20px] py-[18px] bg-[#333] text-white border-[#333] border  hover:bg-white hover:text-[#333] transition-all flex items-center space-x-[18px]"
              >
                <span className="uppercase text-[12px] tracking-[2.4px]">
                  {loading ? "Envoi en cours..." : "Envoyer un mail"}
                </span>
                {!loading && <IoIosArrowRoundForward className="scale-110" />}
              </button>
              {loading && <Spinner color="primary" />}
            </div>
          </form>
        </div>

        <div className="w-1/2 hidden lg:flex justify-end">
          <CldImage
            src={"Site/logo"}
            alt="image contact"
            width={600}
            height={600}
          />
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
