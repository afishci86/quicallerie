import { Shield } from 'lucide-react';

export default function GuaranteeSection() {
  return (
    <section className="dark-section px-6 py-20 max-w-4xl mx-auto">
      <div className="slide-up bg-white rounded-3xl p-8 md:p-12 text-[#700E03] shadow-2xl">
        <div className="flex justify-center mb-6">
          <Shield size={64} strokeWidth={2} />
        </div>

        <h2 className="text-3xl md:text-5xl font-black mb-8 text-center uppercase">
          GARANTIE RÉSULTATS
        </h2>

        <div className="space-y-6 text-lg md:text-xl text-center leading-relaxed">
          <p className="font-semibold">Teste MAVA pendant 14 jours.</p>
          <p>
            Si ton business n'est pas plus clair, plus calme, plus rentable,
          </p>
          <p>
            on coupe tout et on te rembourse.
          </p>
          <p className="font-bold text-2xl">Sans discussion.</p>
        </div>
      </div>
    </section>
  );
}
