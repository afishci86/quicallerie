import { useState } from 'react';
import { BarChart3, Users, Crown, Settings, Lock, TrendingUp, Package, Wallet, ShieldCheck, UserCog, User, Check } from 'lucide-react';
import { useUser } from '@/lib/useUser';
import { classNames } from '@/lib/format';
import { colorOf } from '@/lib/colors';
import type { LucideIcon } from 'lucide-react';

type Tab = 'home' | 'sell' | 'stock' | 'history' | 'credits' | 'boss';

interface Props {
  supabaseOnline: boolean;
  onGo: (t: Tab) => void;
}

export function BossPage({ supabaseOnline, onGo }: Props) {
  const { profile, isGerant, setRole, setName, setCanEditCatalog } = useUser();
  const [nameInput, setNameInput] = useState(profile.name);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Crown className="text-amber-500" size={26} />
        <h1 className="text-2xl font-extrabold text-slate-800">Espace Boss</h1>
      </div>

      {/* Role switcher */}
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <div className="mb-3 flex items-center gap-2">
          <UserCog className="text-slate-600" size={18} />
          <h2 className="text-sm font-bold text-slate-700">Profil actif</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { setRole('gerant'); setCanEditCatalog(true); }}
            className={classNames(
              'flex flex-col items-center gap-1 rounded-2xl px-3 py-4 text-sm font-bold ring-2 transition',
              isGerant ? 'bg-amber-50 text-amber-800 ring-amber-500' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300',
            )}
          >
            <Crown size={24} />
            Gérant
            {isGerant && <Check size={16} className="text-amber-600" />}
          </button>
          <button
            type="button"
            onClick={() => setRole('employe')}
            className={classNames(
              'flex flex-col items-center gap-1 rounded-2xl px-3 py-4 text-sm font-bold ring-2 transition',
              !isGerant ? 'bg-blue-50 text-blue-800 ring-blue-500' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300',
            )}
          >
            <User size={24} />
            Employé
            {!isGerant && <Check size={16} className="text-blue-600" />}
          </button>
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Nom de l'utilisateur</span>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={() => setName(nameInput.trim() || (isGerant ? 'Gérant' : 'Employé'))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          />
        </label>

        {!isGerant && (
          <label className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={profile.canEditCatalog}
              onChange={(e) => setCanEditCatalog(e.target.checked)}
            />
            <ShieldCheck size={16} className="text-blue-600" />
            Autoriser la modification des produits et des prix
          </label>
        )}

        <p className="mt-3 text-[11px] text-slate-400">
          Le profil est stocké sur cet appareil. L'authentification multi-comptes avec invitation par WhatsApp sera ajoutée dans une prochaine étape.
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <ActionTile icon={TrendingUp} title="Chiffre d'affaires" color="green" onClick={() => onGo('history')} />
        <ActionTile icon={Wallet} title="Crédits clients" color="yellow" onClick={() => onGo('credits')} />
        <ActionTile icon={Package} title="Stock & arrivages" color="blue" onClick={() => onGo('stock')} />
        <ActionTile icon={BarChart3} title="Top ventes" color="orange" disabled />
        <ActionTile icon={Users} title="Employés" color="violet" disabled />
        <ActionTile icon={Settings} title="Paramètres" color="slate" disabled />
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <div className="flex items-center gap-2">
          <Lock className="text-slate-400" size={18} />
          <h2 className="text-sm font-bold text-slate-700">À venir dans les prochaines étapes</h2>
        </div>
        <ul className="mt-2 space-y-1 text-sm text-slate-500">
          <li>• Authentification Supabase & invitation employés par WhatsApp</li>
          <li>• Statistiques réelles du chiffre d'affaires et top ventes</li>
          <li>• Multi-quincailleries</li>
        </ul>
      </div>

      {!supabaseOnline && (
        <p className="text-xs text-slate-400">Les indicateurs nécessitent une connexion Supabase pour afficher des données réelles.</p>
      )}
    </div>
  );
}

function ActionTile({ icon: Icon, title, color, onClick, disabled }: { icon: LucideIcon; title: string; color: string; onClick?: () => void; disabled?: boolean }) {
  const c = colorOf(color);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        'flex flex-col items-start gap-2 rounded-2xl bg-white p-3 text-left ring-1 transition',
        disabled ? 'cursor-not-allowed opacity-50 ring-slate-100' : 'ring-slate-200 hover:shadow-md hover:ring-slate-300 active:scale-[0.98]',
      )}
    >
      <span className={classNames('inline-flex rounded-xl p-2 text-white', c.bg)}>
        <Icon size={20} />
      </span>
      <p className="text-sm font-bold text-slate-700">{title}</p>
      <p className="text-[11px] text-slate-400">{disabled ? 'Bientôt' : 'Ouvrir'}</p>
    </button>
  );
}
