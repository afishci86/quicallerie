import { XCircle, CheckCircle2 } from 'lucide-react';

export default function TargetAudienceSection() {
  return (
    <section className="dark-section px-6 py-20 max-w-4xl mx-auto">
      <div className="slide-up">
        <h2 className="text-3xl md:text-5xl font-black mb-12 text-center uppercase">
          À QUI MAVA EST DESTINÉ ?
        </h2>

        <div className="space-y-8 text-lg md:text-xl leading-relaxed">
          <p className="text-center font-semibold text-2xl">Soyons clairs.</p>
          <p className="text-center font-semibold text-2xl">MAVA n'est pas pour tout le monde.</p>

          <div className="my-12 bg-red-900/30 rounded-2xl p-8 border-2 border-red-800">
            <div className="flex items-center gap-3 mb-6">
              <XCircle size={28} />
              <h3 className="text-2xl font-bold">Pas pour :</h3>
            </div>

            <ul className="space-y-3 ml-10">
              <li>ceux qui vendent rarement,</li>
              <li>ceux dont le WhatsApp est encore calme,</li>
              <li>qui veulent tout gérer eux-mêmes sans savoir qu'ils confondent Contrôle à Agitation.</li>
            </ul>
          </div>

          <div className="my-12 bg-white/10 rounded-2xl p-8 border-2 border-white/30">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 size={28} />
              <h3 className="text-2xl font-bold">MAVA est pour les business qui :</h3>
            </div>

            <ul className="space-y-3 ml-10">
              <li>vendent déjà</li>
              <li>veulent vendre mieux et plus,</li>
              <li>reçoivent constamment des messages,</li>
            </ul>

            <p className="mt-6 ml-10">
              et pour qui ces messages font perdre du temps, de l'énergie et des ventes.
            </p>
          </div>

          <div className="text-center space-y-6 mt-12 bg-white/10 rounded-2xl p-8">
            <CheckCircle2 size={32} className="mx-auto" />
            <p className="font-bold text-xl">
              Si ton business s'arrête quand ton WhatsApp s'arrête,
            </p>
            <p className="font-bold text-xl">
              et que répondre à tes clients te bloque plus que ça ne te fasse grandir,
            </p>
            <p className="font-bold text-2xl text-white">
              MAVA est fait pour toi.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
