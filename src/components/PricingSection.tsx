import PricingCard from './PricingCard';

export default function PricingSection() {
  return (
    <section className="red-section px-6 py-20 max-w-7xl mx-auto">
      <div className="slide-up">
        <h2 className="text-3xl md:text-5xl font-black mb-16 text-center uppercase">
          CHOISIS TON MAVA
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <PricingCard
            title="MAVA CHAT"
            badge="LE PLUS CHOISI"
            description="Pour respirer et ne plus rater de vente."
            features={[
              'Réponses 24h/7j',
              'Prises de commandes',
              'Alertes dès qu\'une vente est prête',
              'Fonctionne naturellement avec ton téléphone actif, tel que tu l\'utilises déjà',
              'Bonus : un tableau de bord simple pour suivre tes ventes'
            ]}
            price="29.000 F / mois"
            originalPrice="45.000 F"
            installTime="24–48h"
            ctaText="Activer MAVA CHAT"
            ctaMessage="Bonjour, je veux activer MAVA CHAT pour automatiser mon WhatsApp et ne plus rater de ventes."
            icon="sparkles"
          />

          <PricingCard
            title="MAVA VISION"
            badge="LE PLUS UTILISÉ PAR LES E-COMMERÇANTS TIKTOK"
            description="Pour les business qui vendent via lives TikTok/Facebook avec photos, ou captures d'écran de produits"
            features={[
              'Tout MAVA CHAT +',
              'Traitement intelligent des images',
              'Reconnaissance des produits et preuves de paiement',
              'Ajout et mise à jour des produits',
              'Fonctionne naturellement avec ton téléphone actif, tel que tu l\'utilises déjà'
            ]}
            price="35.000 F / mois"
            originalPrice="50.000 F"
            installTime="48–72h"
            ctaText="Activer MAVA VISION"
            ctaMessage="Bonjour, je veux activer MAVA VISION pour gérer mes ventes via photos, lives et captures d'écran."
            icon="trending"
          />

          <PricingCard
            title="MAVA PRO"
            badge="SUR SÉLECTION"
            description="Pour structures établies."
            features={[
              'Configuration sur mesure',
              'Multi-numéros / multi-canaux (sites web, réseaux sociaux, App)',
              'Automatisations avancées',
              'Support prioritaire',
              'Entièrement autonome, même avec ton téléphone Totalement hors circuit'
            ]}
            price="Sur devis"
            installTime="à partir de 125.000 F Installation + 59.000 F/mois"
            ctaText="Demander une évaluation"
            ctaMessage="Bonjour, je souhaite une évaluation pour MAVA PRO. Mon business a déjà du volume."
            icon="crown"
          />
        </div>
      </div>
    </section>
  );
}
