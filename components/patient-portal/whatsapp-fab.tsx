"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppFabProps {
  phoneNumber?: string;
  message?: string;
}

const DEFAULT_PHONE = "5491123456789"; // Número de contacto SelfLove
const DEFAULT_MESSAGE = "Hola, quería consultar sobre mis turnos";

export function WhatsAppFab({
  phoneNumber = DEFAULT_PHONE,
  message = DEFAULT_MESSAGE,
}: WhatsAppFabProps) {
  const href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Contactanos por WhatsApp"
      className={cn(
        "fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full",
        "bg-brand-sage-btn text-white shadow-lg transition-all duration-200",
        "hover:shadow-xl hover:scale-105 hover:bg-brand-sage-btn/90",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage-btn focus-visible:ring-offset-2",
        "animate-pulse [animation-duration:3s]",
      )}
    >
      <MessageCircle className="size-6" />
      <span className="sr-only">Contactanos por WhatsApp</span>
    </a>
  );
}
