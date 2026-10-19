import { CheckCircle2, Sparkles, TrendingUp, Crown } from 'lucide-react';
import CTAButton from './CTAButton';

interface PricingCardProps {
  title: string;
  badge?: string;
  description: string;
  features: string[];
  price: string;
  originalPrice?: string;
  installTime: string;
  ctaText: string;
  ctaMessage: string;
  icon: 'sparkles' | 'trending' | 'crown';
}

export default function PricingCard({
  title,
  badge,
  description,
  features,
  price,
  originalPrice,
  installTime,
  ctaText,
  ctaMessage,
  icon
}: PricingCardProps) {
  const icons = {
    sparkles: Sparkles,
    trending: TrendingUp,
    crown: Crown
  };

  const Icon = icons[icon];

  return (
    <div className="pricing-card bg-white rounded-3xl p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon size={32} color="#700E03" />
          <h3 className="text-2xl md:text-3xl font-black text-[#700E03] uppercase">{title}</h3>
        </div>
      </div>

      {badge && (
        <div className="bg-[#700E03] text-white text-sm font-semibold px-4 py-2 rounded-full inline-block mb-4">
          {badge}
        </div>
      )}

      <p className="text-[#700E03] font-semibold text-lg mb-6">{description}</p>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3 text-[#700E03]">
            <CheckCircle2 size={20} className="flex-shrink-0 mt-1" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl font-black text-[#700E03]">{price}</span>
          {originalPrice && (
            <span className="text-xl text-gray-400 line-through">{originalPrice}</span>
          )}
        </div>
        <p className="text-[#700E03] text-sm">
          <span className="font-semibold">Installation (gratuite)</span> : {installTime}
        </p>
      </div>

      <CTAButton text={ctaText} message={ctaMessage} variant="primary" />
    </div>
  );
}
