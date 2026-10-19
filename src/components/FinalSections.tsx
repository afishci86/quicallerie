import { AlertTriangle, Clock } from 'lucide-react';
import CTAButton from './CTAButton';

export default function FinalSections() {
  return (
    <>
      <section className="red-section px-6 py-20 max-w-4xl mx-auto">
        <div className="slide-up bg-white/10 rounded-3xl p-8 md:p-12 border-2 border-white/30">
          <div className="flex justify-center mb-6">
            <AlertTriangle size={48} />
          </div>

          <h2 className="text-3xl md:text-5xl font-black mb-8 text-center uppercase">
            CAPACITÉ LIMITÉE
          </h2>

          <div className="space-y-6 text-lg md:text-xl text-center leading-relaxed">
            <p>
              Chaque déploiement de MAVA nécessite un paramétrage spécifique et un contrôle qualité strict en vue d'assurer un niveau de performance élevé pour chacun de nos clients.
            </p>
            <p className="font-semibold">
              Les prix actuels s'appliquent uniquement dans la limite de notre capacité mensuelle.
            </p>
            <p>
              Au-delà, les nouveaux déploiements seront proposés à des tarifs réajustés.
            </p>
          </div>
        </div>
      </section>

      <section className="dark-section px-6 py-20 max-w-4xl mx-auto">
        <div className="slide-up text-center space-y-8">
          <div className="flex justify-center mb-6">
            <Clock size={56} />
          </div>

          <h2 className="text-3xl md:text-5xl font-black uppercase">
            DERNIER RAPPEL
          </h2>

          <div className="space-y-6 text-lg md:text-xl leading-relaxed">
            <p>
              Si ton WhatsApp ne reçoit pas du mouvement, MAVA n'est pas encore pour toi.
            </p>
            <p className="font-semibold">Mais si tel est le cas, retiens que :</p>
            <p className="text-2xl font-bold">
              chaque jour qui passe sans MAVA,
            </p>
            <p className="text-2xl font-bold">
              c'est continuer à vendre à ta capacité humaine.
            </p>
            <p className="text-2xl font-bold">
              Et pas à la capacité de ton marché.
            </p>
          </div>

          <div className="mt-12 text-3xl font-black uppercase">
            <p>Rejoins ceux qui gagnent en silence.</p>
          </div>

          <div className="mt-12">
            <CTAButton
              text="Activer MAVA Maintenant"
              message="Bonjour, je veux activer MAVA pour mon business. Quel pack me conseillez-vous selon mon activité ?"
              variant="light"
            />
          </div>
        </div>
      </section>
    </>
  );
}
