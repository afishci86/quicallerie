import { MessageCircle } from 'lucide-react';

interface CTAButtonProps {
  text: string;
  message: string;
  variant?: 'primary' | 'white' | 'light';
}

export default function CTAButton({ text, message, variant = 'primary' }: CTAButtonProps) {
  const whatsappLink = `https://wa.me/2250759927833?text=${encodeURIComponent(message)}`;

  const baseClasses = "inline-flex items-center justify-center gap-3 px-8 py-4 rounded-lg font-semibold text-base transition-all duration-300 w-full md:w-auto glow-button";

  let variantClasses = "";
  if (variant === 'primary') {
    variantClasses = "bg-[#700E03] text-white hover:bg-[#8a1104]";
  } else if (variant === 'white') {
    variantClasses = "bg-white text-[#700E03] hover:bg-gray-100";
  } else if (variant === 'light') {
    variantClasses = "bg-white text-black shadow-lg hover:bg-gray-200";
  }

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClasses} ${variantClasses}`}
    >
      <MessageCircle size={20} />
      <span>{text}</span>
    </a>
  );
}
