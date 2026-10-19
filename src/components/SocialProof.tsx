import { Star } from 'lucide-react';

export default function SocialProof() {
  const testimonials = [
    { id: 1 },
    { id: 2 },
    { id: 3 },
    { id: 4 },
  ];

  return (
    <section className="dark-section px-6 py-20 max-w-6xl mx-auto">
      <div className="slide-up">
        <h2 className="text-3xl md:text-5xl font-black mb-12 text-center uppercase">
          ILS ONT ACTIVÉ MAVA
        </h2>

        <div className="social-proof-slider flex gap-6 overflow-x-auto pb-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="flex-shrink-0 w-80 h-96 bg-white rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} fill="#700E03" color="#700E03" />
                ))}
              </div>
              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                Capture WhatsApp
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-300 mt-6 text-sm">
          Faites glisser pour voir plus de témoignages
        </p>
      </div>
    </section>
  );
}
