import CTAButton from './CTAButton';

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center fade-in relative overflow-hidden">
      <div className="absolute top-6 right-6 z-10">
        <img
          src="/WhatsApp_Image_2026-02-09_at_18.50.24.jpeg"
          alt="MAVA Logo"
          className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg"
        />
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="mb-16 slide-up relative">
          <img
            src="/WhatsApp_Image_2026-02-10_at_20.38.10.jpeg"
            alt="MAVA Robot"
            className="w-56 h-56 md:w-80 md:h-80 mx-auto object-contain drop-shadow-2xl"
          />
        </div>

        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight slide-up uppercase">
          TON BUSINESS DOIT JUSTE T'ENRICHIR.
        </h1>

        <h2 className="text-3xl md:text-5xl font-bold mb-12 leading-tight slide-up uppercase">
          PAS T'ENCHAÎNER À TON WHATSAPP.
        </h2>

        <div className="mb-12 space-y-6 text-lg md:text-xl leading-relaxed slide-up">
          <p className="font-semibold text-xl md:text-2xl">
            MAVA EST TON ASSISTANT COMMERCIAL.
          </p>
          <p className="text-gray-200">
            Il répond, prend les commandes
            <br />
            et t'alerte seulement quand l'argent est prêt à être encaissé.
          </p>
        </div>

        <div className="mb-12 space-y-4 text-lg md:text-xl font-medium slide-up">
          <p>24h/24.</p>
          <p>Sans fatigue.</p>
          <p>Sans stress.</p>
          <p>Sans que tu interviennes.</p>
          <p className="text-gray-200">Et tu peux prendre la main quand tu veux.</p>
        </div>

        <div className="slide-up">
          <CTAButton
            text="Obtenir MAVA Maintenant"
            message="Bonjour, je veux activer MAVA pour mon business. Quel pack me conseillez-vous selon mon activité ?"
            variant="light"
          />
        </div>
      </div>
    </section>
  );
}
