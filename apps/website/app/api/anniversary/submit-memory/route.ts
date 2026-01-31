import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Email template for user confirmation
const userConfirmationEmailTemplate = (name: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Merci pour votre témoignage !</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .email-wrapper {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            margin: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo img {
            width: 120px;
            height: auto;
        }
        h1 {
            color: #18858b;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 20px;
            text-align: center;
        }
        p {
            color: #666666;
            font-size: 16px;
            margin-bottom: 24px;
            text-align: center;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eeeeee;
            color: #999999;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="logo">
                <img src="https://admin.lebontemperament.com/picto.svg" alt="Le Bon Tempérament" />
            </div>
            
            <h1>Merci pour votre témoignage ! 🎉</h1>
            
            <p>Bonjour ${name},</p>
            
            <p>Nous avons bien reçu votre témoignage pour les 40 ans du Bon Tempérament !</p>
            
            <p>Votre message sera examiné par notre équipe avant d'être publié sur la page anniversaire. Nous vous tiendrons informé(e) une fois qu'il sera approuvé.</p>
            
            <p>Merci de partager vos souvenirs avec nous ! Ces témoignages sont précieux et contribuent à raconter notre belle histoire. ✨</p>
            
            <div class="footer">
                <p>
                    Email envoyé à votre adresse email<br>
                    © 2025 Le Bon Tempérament. Tous droits réservés.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
`;

// Email template for admin notification
const adminNotificationEmailTemplate = (
  name: string,
  email: string,
  message: string,
  year: number | null,
) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Nouveau témoignage reçu</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .email-wrapper {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            margin: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo img {
            width: 120px;
            height: auto;
        }
        h1 {
            color: #18858b;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 20px;
            text-align: center;
        }
        .info-box {
            background-color: #f9f9f9;
            border-left: 4px solid #18858b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box p {
            margin: 8px 0;
            color: #333333;
            text-align: left;
        }
        .info-box strong {
            color: #18858b;
        }
        .message-box {
            background-color: #ffffff;
            border: 1px solid #eeeeee;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
            font-style: italic;
            color: #666666;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eeeeee;
            color: #999999;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="logo">
                <img src="https://admin.lebontemperament.com/picto.svg" alt="Le Bon Tempérament" />
            </div>
            
            <h1>Nouveau témoignage reçu ! 📝</h1>
            
            <div class="info-box">
                <p><strong>Nom :</strong> ${name}</p>
                <p><strong>Email :</strong> ${email}</p>
                ${year ? `<p><strong>Année :</strong> ${year}</p>` : ""}
                <p><strong>Date de soumission :</strong> ${new Date().toLocaleString("fr-FR")}</p>
            </div>
            
            <h2 style="color: #18858b; font-size: 18px; margin-top: 30px;">Témoignage :</h2>
            <div class="message-box">
                <p>${message.replace(/\n/g, "<br>")}</p>
            </div>
            
            <p style="color: #666666; font-size: 14px; margin-top: 30px; text-align: center;">
                Ce témoignage est en attente de modération. Veuillez le consulter dans le panneau d'administration pour l'approuver ou le refuser.
            </p>
            
            <div class="footer">
                <p>
                    Email envoyé automatiquement<br>
                    © 2025 Le Bon Tempérament. Tous droits réservés.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message, year, captchaValue } = body;

    if (!captchaValue) {
      return NextResponse.json(
        {
          success: false,
          message: "Veuillez vérifier que vous n'êtes pas un robot",
        },
        { status: 400 },
      );
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      console.error("RECAPTCHA_SECRET_KEY not found in environment variables");
      return NextResponse.json(
        {
          success: false,
          message: "Configuration du serveur incomplète",
        },
        { status: 500 },
      );
    }

    // Verify reCAPTCHA with Google
    const recaptchaResponse = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaValue}`,
      {
        method: "POST",
      },
    );

    const recaptchaResult = await recaptchaResponse.json();

    if (!recaptchaResult.success) {
      console.error(
        "reCAPTCHA verification failed:",
        recaptchaResult["error-codes"],
      );
      return NextResponse.json(
        {
          success: false,
          message: "Échec de la vérification reCAPTCHA",
          errorCodes: recaptchaResult["error-codes"],
        },
        { status: 400 },
      );
    }

    // Validate required fields (email is mandatory)
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 },
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Insert new memory (will be pending approval by default)
    const { data, error } = await supabase
      .from("anniversary_memories")
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim(),
        year: year ? parseInt(year) : null,
        is_approved: false, // Requires admin approval
        is_featured: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error submitting memory:", error);
      return NextResponse.json(
        { error: "Failed to submit memory" },
        { status: 500 },
      );
    }

    // Send emails using nodemailer
    const username = process.env.NEXT_PUBLIC_BURNER_USERNAME;
    const password = process.env.NEXT_PUBLIC_BURNER_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL || "lebontemperament@gmail.com";

    if (!username || !password) {
      console.error("Email service not configured");
      // Still return success if email fails, as the memory was saved
      return NextResponse.json({
        success: true,
        message: "Memory submitted successfully (email notification failed)",
        id: data.id,
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        tls: {
          ciphers: "SSLv3",
          rejectUnauthorized: false,
        },
        auth: {
          user: username,
          pass: password,
        },
      });

      // Send confirmation email to user
      await transporter.sendMail({
        from: username,
        to: email.trim().toLowerCase(),
        subject: "Merci pour votre témoignage - 40 ans du Bon Tempérament",
        html: userConfirmationEmailTemplate(name.trim()),
      });

      // Send notification email to admin
      await transporter.sendMail({
        from: username,
        to: adminEmail,
        subject: `Nouveau témoignage reçu de ${name.trim()} - 40 ans`,
        html: adminNotificationEmailTemplate(
          name.trim(),
          email.trim().toLowerCase(),
          message.trim(),
          year ? parseInt(year) : null,
        ),
      });
    } catch (emailError) {
      console.error("Error sending emails:", emailError);
      // Still return success if email fails, as the memory was saved
    }

    return NextResponse.json({
      success: true,
      message: "Memory submitted successfully",
      id: data.id,
    });
  } catch (error) {
    console.error("Error in POST /api/anniversary/submit-memory:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
