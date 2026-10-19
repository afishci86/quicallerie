import { MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="dark-section px-6 py-12 border-t border-white/20">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/WhatsApp_Image_2026-02-09_at_18.50.24.jpeg"
              alt="MAVA Logo"
              className="w-12 h-12 object-contain"
            />
            <span className="font-bold text-xl">MAVA</span>
          </div>

          <div className="text-center md:text-right">
            <p className="text-sm text-gray-300 mb-2">Machine À Vendre Automatiquement</p>
            <a
              href="https://wa.me/2250759927833"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm hover:text-gray-300 transition-colors"
            >
              <MessageCircle size={16} />
              <span>+225 07 59 92 78 33</span>
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} MAVA. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
