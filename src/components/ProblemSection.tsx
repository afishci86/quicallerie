import { AlertCircle, Clock, Users, Battery, TrendingDown } from 'lucide-react';

export default function ProblemSection() {
  return (
    <section className="dark-section px-6 py-20 max-w-4xl mx-auto">
      <div className="slide-up">
        <h2 className="text-3xl md:text-5xl font-black mb-12 text-center uppercase">
          CE QUI TUE BEAUCOUP DE BUSINESS ICI
        </h2>

        <div className="space-y-8 text-lg md:text-xl leading-relaxed">
          <p className="font-semibold">Tout se passe sur WhatsApp :</p>
          <p>Répondre. Expliquer. Noter les commandes. Encaisser.</p>

          <div className="my-12">
            <div className="flex items-start gap-3 mb-6">
              <AlertCircle size={24} className="flex-shrink-0 mt-1" />
              <span className="font-semibold text-2xl">Résultat :</span>
            </div>

            <ul className="space-y-4 ml-10">
              <li className="flex items-start gap-3">
                <Clock size={20} className="flex-shrink-0 mt-1" />
                <span>tu expliques la même chose toute la journée. Tous les jours</span>
              </li>
              <li className="flex items-start gap-3">
                <Users size={20} className="flex-shrink-0 mt-1" />
                <span>tu gères 20 discussions pour 1 vraie vente</span>
              </li>
              <li className="flex items-start gap-3">
                <Battery size={20} className="flex-shrink-0 mt-1" />
                <span>tu es scotché à ton téléphone</span>
              </li>
            </ul>
          </div>

          <div className="my-12">
            <p className="font-semibold mb-6">Et pendant ce temps :</p>

            <ul className="space-y-4 ml-6">
              <li className="flex items-start gap-3">
                <TrendingDown size={20} className="flex-shrink-0 mt-1" />
                <span>réponses lentes</span>
              </li>
              <li className="flex items-start gap-3">
                <TrendingDown size={20} className="flex-shrink-0 mt-1" />
                <span>clients frustrés</span>
              </li>
              <li className="flex items-start gap-3">
                <TrendingDown size={20} className="flex-shrink-0 mt-1" />
                <span>ventes ratées</span>
              </li>
              <li className="flex items-start gap-3">
                <TrendingDown size={20} className="flex-shrink-0 mt-1" />
                <span>fatigue mentale</span>
              </li>
              <li className="flex items-start gap-3">
                <TrendingDown size={20} className="flex-shrink-0 mt-1" />
                <span>croissance bloquée</span>
              </li>
            </ul>
          </div>

          <div className="text-center space-y-6 mt-16">
            <p className="font-bold text-2xl">Ce n'est pas normal.</p>
            <p className="text-xl">C'est juste devenu habituel.</p>
            <p className="text-xl">Mais une habitude qui tue en silence.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
