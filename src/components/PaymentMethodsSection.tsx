import React from 'react';
import { PaymentMethod } from '../types';
import { CreditCard, Wallet, Banknote, Building2, CheckCircle2 } from 'lucide-react';

interface PaymentMethodsSectionProps {
  paymentMethods: PaymentMethod[];
}

export const PaymentMethodsSection: React.FC<PaymentMethodsSectionProps> = ({
  paymentMethods
}) => {
  // Filter active payment methods only (activo == "Si")
  const activeMethods = paymentMethods.filter(
    (pm) => pm.activo?.toLowerCase() === 'si' || pm.activo === '1' || pm.activo === 'true'
  );

  if (activeMethods.length === 0) return null;

  const getMethodIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('mercado') || t.includes('mp')) return Wallet;
    if (t.includes('tarjeta') || t.includes('credito') || t.includes('cuotas')) return CreditCard;
    if (t.includes('transferencia') || t.includes('cbu')) return Building2;
    return Banknote;
  };

  return (
    <section className="my-12 bg-slate-50 border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
      <div className="flex items-center gap-3 border-b-3 border-black pb-4 mb-6">
        <div className="bg-yellow-300 border-2 border-black p-2 shadow-[2px_2px_0px_0px_#000]">
          <CreditCard className="w-6 h-6 text-black" />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight font-sans">
            MEDIOS DE PAGO HABILITADOS
          </h2>
          <p className="text-xs font-mono font-bold text-slate-600">
            Aceptamos múltiples opciones seguras y flexibles para tu comodidad
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeMethods.map((pm, idx) => {
          const IconComp = getMethodIcon(pm.medio_de_pago);
          const bgColors = ['bg-yellow-300', 'bg-pink-300', 'bg-cyan-300', 'bg-lime-300'];
          const currentBg = bgColors[idx % bgColors.length];

          return (
            <div
              key={idx}
              className={`bg-white border-3 border-black p-4 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between space-y-3 relative group hover:-translate-y-1 transition-transform`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className={`${currentBg} border-2 border-black p-2.5 shadow-[2px_2px_0px_0px_#000]`}>
                  <IconComp className="w-6 h-6 text-black" />
                </div>
                <span className="bg-black text-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase border border-black">
                  ACTIVO
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base uppercase font-sans leading-tight">
                  {pm.medio_de_pago}
                </h3>
                <p className="text-xs text-slate-700 font-sans mt-1">
                  {pm.desc_mp}
                </p>
              </div>

              <div className="pt-2 border-t border-black/20 flex items-center gap-1.5 text-xs font-mono font-extrabold text-black">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Cobro Acreditado</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
