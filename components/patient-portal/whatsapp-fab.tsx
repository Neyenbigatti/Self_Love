"use client";

interface WhatsAppFabProps {
  phoneNumber?: string;
  message?: string;
}

const DEFAULT_PHONE = "+5493417486861"; // Número de contacto SelfLove  
const DEFAULT_MESSAGE = "Hola! Me gustaría realizar una consulta fuera de los tratamientos que se muestran en tu aplicación :) ";

export function WhatsAppFab({
  phoneNumber = DEFAULT_PHONE,
  message = DEFAULT_MESSAGE,
}: WhatsAppFabProps) {
  const href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed bottom-6 right-6 z-[var(--z-fab)] group">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex size-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg hover:bg-[#20BD5A] transition-all duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
        aria-label="Contactanos por WhatsApp"
      >
        {/* Ping animation — ring pulsing outward */}
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366]/40" />

        {/* WhatsApp SVG icon — flat white, no pulse */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="relative size-7 fill-white"
          aria-hidden="true"
        >
          <path d="M19.11 17.22c-.29-.15-1.71-.84-1.97-.94-.26-.1-.45-.15-.64.15-.19.29-.74.94-.91 1.13-.17.19-.34.22-.63.07-.29-.15-1.22-.45-2.33-1.44-.86-.77-1.44-1.71-1.61-2-.17-.29-.02-.45.13-.6.13-.13.29-.34.43-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.64-1.54-.88-2.11-.23-.56-.46-.48-.64-.49h-.55c-.19 0-.51.07-.77.36-.26.29-1 1-1 2.43s1.02 2.81 1.16 3c.15.19 2 3.05 4.84 4.27.68.29 1.21.46 1.63.59.68.22 1.3.19 1.79.11.55-.08 1.71-.7 1.95-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.34z"/>
          <path d="M16.04 3C9.39 3 4 8.39 4 15.04c0 2.64.86 5.07 2.31 7.04L5 29l7.11-1.27c1.91 1.04 4.11 1.63 6.42 1.63 6.65 0 12.04-5.39 12.04-12.04S22.69 3 16.04 3zm0 21.86c-2.04 0-3.94-.55-5.57-1.5l-.4-.24-4.22.75.8-4.12-.26-.42a9.82 9.82 0 01-1.5-5.29c0-5.46 4.45-9.91 9.91-9.91s9.91 4.45 9.91 9.91-4.45 9.82-9.91 9.82z"/>
        </svg>

        <span className="sr-only">Contactanos por WhatsApp</span>
      </a>

      {/* Tooltip — visible on hover */}
      <span className="absolute right-[calc(100%+12px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-black/80 px-3 py-1.5 text-sm text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none">
        Contactanos por WhatsApp
      </span>
    </div>
  );
}
