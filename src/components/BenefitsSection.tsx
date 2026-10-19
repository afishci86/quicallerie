import { XCircle, CheckCircle2, TrendingUp } from 'lucide-react';

export default function BenefitsSection() {
  return (
    <section className="red-section px-6 py-20 max-w-4xl mx-auto">
      <div className="slide-up">
        <h2 className="text-3xl md:text-5xl font-black mb-12 text-center uppercase">
          CE QUE TU GAGNES AVEC MAVA
        </h2>

        <div className="grid md:grid-cols-2 gap-8 my-12">
          <div className="bg-red-900/30 rounded-2xl p-8 border-2 border-red-800">
            <div className="flex items-center gap-3 mb-6">
              <XCircle size={32} />
              <h3 className="text-2xl font-bold">SANS MAVA</h3>
            </div>

            <ul className="space-y-4 text-lg">
              <li className="flex items-start gap-3">
                <span>•</span>
                <span>tu es esclave de ce qui devrait travailler pour toi</span>
              </li>
              <li className="flex items-start gap-3">
                <span>•</span>
                <span>tu passes plus de temps à répondre qu'à développer ton business</span>
              </li>
              <li className="flex items-start gap-3">
                <span>•</span>
                <span>tu rates des ventes comme si c'était normal</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/10 rounded-2xl p-8 border-2 border-white/30">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 size={32} />
              <h3 className="text-2xl font-bold">AVEC MAVA</h3>
            </div>

            <ul className="space-y-4 text-lg">
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="flex-shrink-0 mt-1" />
                <span>le tri est fait pour toi (seules les vraies ventes arrivent à toi)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="flex-shrink-0 mt-1" />
                <span>ton business tourne même quand tu dors</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="flex-shrink-0 mt-1" />
                <span>tu vois plus clair : ce qui se vend, à quel moment, et tu grandis en travaillant moins</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center space-y-6 mt-12 bg-white rounded-2xl p-8 text-[#700E03]">
          <TrendingUp size={40} className="mx-auto" />
          <p className="font-black text-3xl uppercase">En résumé :</p>
          <p className="font-bold text-2xl">
            moins de bruit, plus d'argent, plus de contrôle.
          </p>
        </div>
      </div>
    </section>
  );
}
