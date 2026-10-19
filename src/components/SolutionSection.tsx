import { Zap, MessageSquare, ShieldCheck, Bell, CheckCircle2, XCircle } from 'lucide-react';

export default function SolutionSection() {
  return (
    <section className="red-section px-6 py-20 max-w-4xl mx-auto relative overflow-hidden">
      <div className="slide-up">
        <h2 className="text-3xl md:text-5xl font-black mb-12 text-center uppercase">
          MAVA, CONCRÈTEMENT
        </h2>

        <div className="space-y-8 text-lg md:text-xl leading-relaxed">
          <p className="font-semibold text-2xl text-center">
            MAVA est ton employé commercial permanent,
            <br />
            entraîné pour le marché africain et connecté directement à ton WhatsApp.
          </p>

          <p className="text-center text-gray-200">
            Il travaille pour toi pendant que tu es déconnecté, travailles ailleurs, ou endormi,
            <br />
            avec un seul objectif : transformer chaque message en opportunité de vente.
          </p>

          <div className="my-12 bg-white/10 rounded-2xl p-8">
            <p className="font-semibold mb-8 text-2xl">Quand un client t'écrit, MAVA :</p>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Zap size={24} className="flex-shrink-0 mt-1" />
                <span>répond (instantanément)</span>
              </li>
              <li className="flex items-start gap-3">
                <MessageSquare size={24} className="flex-shrink-0 mt-1" />
                <span>parle un français naturel et rassurant</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={24} className="flex-shrink-0 mt-1" />
                <span>donne les infos (prix, stocks, fonctionnement)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={24} className="flex-shrink-0 mt-1" />
                <span>pose les bonnes questions</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={24} className="flex-shrink-0 mt-1" />
                <span>prend la commande complète</span>
              </li>
              <li className="flex items-start gap-3">
                <Bell size={24} className="flex-shrink-0 mt-1" />
                <span>t'alerte dès que la commande est validée</span>
              </li>
            </ul>
          </div>

          <div className="text-center space-y-6 my-12">
            <div className="flex items-center justify-center gap-3">
              <XCircle size={28} />
              <p className="font-bold text-2xl">MAVA ne prend jamais de décision risquée.</p>
            </div>
            <p className="font-semibold text-xl flex items-center justify-center gap-3">
              <ShieldCheck size={24} />
              Il gère le courant. Tu gères l'important.
            </p>
          </div>

          <div className="relative bg-white/10 rounded-2xl p-8 md:p-12">
            <p className="mb-8">Quand une situation le dépasse, il te notifie. Ex :</p>
            <div className="bg-black border-2 border-white/30 rounded-lg p-6 italic mb-8">
              <Bell className="inline mr-2" size={20} />
              "Boss, y'a le client 07XXXXXXX qui est mécontent pour son colis endommagé à la livraison…"
            </div>

            <img
              src="/WhatsApp_Image_2026-02-10_at_20.39.10.jpeg"
              alt="MAVA Dashboard"
              className="w-40 h-40 md:w-48 md:h-48 mx-auto object-contain floating-image drop-shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
