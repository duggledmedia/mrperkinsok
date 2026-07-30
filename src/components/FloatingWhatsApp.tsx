import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send, PhoneCall, ArrowUp } from 'lucide-react';

export const FloatingWhatsApp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [customPhone, setCustomPhone] = useState('5491123456789');
  const [message, setMessage] = useState(
    'Hola Mr. Perkins, quisiera hacer una consulta sobre la disponibilidad de perfumes y envíos.'
  );

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(message);
    window.open(`https://wa.me/${customPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Scroll To Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="bg-yellow-300 hover:bg-yellow-400 text-black border-4 border-black p-2.5 shadow-[5px_5px_0px_0px_#000] hover:-translate-y-1 transition-all cursor-pointer flex items-center gap-1 font-mono text-xs font-black uppercase animate-in fade-in slide-in-from-bottom-2 duration-200"
          title="Volver arriba de todo"
        >
          <ArrowUp className="w-5 h-5 stroke-[3]" />
          <span className="hidden sm:inline">ARRIBA</span>
        </button>
      )}

      {/* Quick Floating Chat Box */}
      {isOpen && (
        <div className="mb-1 w-80 bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_#000] animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3 bg-[#25D366] text-black -mx-4 -mt-4 p-3 border-b-4 border-black">
            <div className="flex items-center gap-2 font-black font-sans text-sm uppercase">
              <MessageCircle className="w-5 h-5 fill-black" />
              <span>WHATSAPP MR. PERKINS</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="bg-black text-white hover:bg-pink-600 p-1 border border-black cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs font-sans text-slate-800 mb-2 font-medium">
            Atención personalizada de Lun a Sáb de 9 a 20 hs. ¡Respondemos al instante!
          </p>

          <div className="space-y-2">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-0.5">
                Número de Celular (Editable):
              </label>
              <div className="flex items-center border-2 border-black bg-slate-50">
                <PhoneCall className="w-3.5 h-3.5 ml-2 text-slate-500" />
                <input
                  type="text"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  className="w-full bg-transparent px-2 py-1 text-xs font-mono font-bold text-black focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-0.5">
                Mensaje de Consulta:
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border-2 border-black p-2 text-xs font-sans font-bold focus:bg-yellow-50 focus:outline-none"
              />
            </div>

            <button
              onClick={handleOpenWhatsApp}
              className="w-full bg-[#25D366] hover:bg-green-500 text-black border-2 border-black py-2 px-3 font-black text-xs uppercase flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>INICIAR CHAT DIRECTO</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Trigger Circle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-[#25D366] hover:bg-green-400 text-black border-4 border-black p-3.5 rounded-none shadow-[6px_6px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-0 active:translate-y-0 transition-all cursor-pointer group"
        title="Contactar por WhatsApp"
      >
        <MessageCircle className="w-7 h-7 fill-black stroke-black" />

        {/* Pulse indicator badge */}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 border-2 border-black animate-ping" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 border-2 border-black" />
      </button>
    </div>
  );
};
