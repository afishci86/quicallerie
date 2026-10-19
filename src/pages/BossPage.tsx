import { BarChart3, Users, Crown, Settings, Lock, TrendingUp, Package, Wallet } from 'lucide-react';

interface Props {
  supabaseOnline: boolean;
}

export function BossPage({ supabaseOnline }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Crown className="text-amber-500" size={26} />
          <h1 className="text-2xl font-extrabold text-slate-800">Espace Boss</h1>
        </div>
        <p className="text-sm text-slate-500">Tableau de bord & gestion avancée.</p>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 ring-1 ring-amber-200">
        <p className="text-sm font-semibold text-amber-900">
          Cette section est préparée pour une étape ultérieure. Les statistiques ci-dessous ne sont pas encore disponibles — aucun chiffre n'est simulé.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <PlaceholderCard icon={TrendingUp} title="Chiffre d'affaires" color="green" />
        <PlaceholderCard icon={Wallet} title="Crédits clients" color="yellow" />
        <PlaceholderCard icon={Package} title="Valeur du stock" color="blue" />
        <PlaceholderCard icon={BarChart3} title="Top ventes" color="orange" />
        <PlaceholderCard icon={Users} title="Employés" color="violet" />
        <PlaceholderCard icon={Settings} title="Paramètres" color="slate" />
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <div className="flex items-center gap-2">
          <Lock className="text-slate-400" size={18} />
          <h2 className="text-sm font-bold text-slate-700">À venir dans les prochaines étapes</h2>
        </div>
        <ul className="mt-2 space-y-1 text-sm text-slate-500">
          <li>• Gestion des employés, invitations et permissions</li>
          <li>• Statistiques réelles du chiffre d'affaires et des ventes</li>
          <li>• Remboursements et annulations de vente</li>
          <li>• Arrivages, seuils d'alerte et modification du catalogue</li>
          <li>• Multi-quincailleries</li>
        </ul>
      </div>

      {!supabaseOnline && (
        <p className="text-xs text-slate-400">
          Les indicateurs nécessitent une connexion Supabase pour afficher des données réelles.
        </p>
      )}
    </div>
  );
}

import type { LucideIcon } from 'lucide-react';
import { classNames } from '@/lib/format';
import { colorOf } from '@/lib/colors';

function PlaceholderCard({ icon: Icon, title, color }: { icon: LucideIcon; title: string; color: string }) {
  const c = colorOf(color);
  return (
    <div className={classNames('rounded-2xl bg-white p-3 ring-1', c.border)}>
      <div className={classNames('mb-2 inline-flex rounded-xl p-2 text-white', c.bg)}>
        <Icon size={20} />
      </div>
      <p className="text-sm font-bold text-slate-700">{title}</p>
      <p className="text-xs text-slate-400">Bientôt disponible</p>
    </div>
  );
}
