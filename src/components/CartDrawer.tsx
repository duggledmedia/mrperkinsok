import React, { useState } from 'react';
import { CartItem, PaymentMethod, CartItemType } from '../types';
import { X, Trash2, ShoppingBag, MessageCircle, ArrowRight, Calendar, Clock, Mail, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { WHATSAPP_PHONE_INTERNATIONAL, trackFunnelEvent, DISCOVERY_SAMPLE_PRICE, DISCOVERY_MIN_SAMPLES, DISCOVERY_MAX_SAMPLES } from '../utils/constants';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  paymentMethods: PaymentMethod[];
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  paymentMethods
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(
    paymentMethods[0]?.medio_de_pago || 'Mercado Pago'
  );
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const getItemPrice = (item: CartItem): number => {
    if (item.itemType === 'discovery_sample') {
      return DISCOVERY_SAMPLE_PRICE;
    }
    return item.unitPrice ?? item.product.precioVenta;
  };

  const getItemId = (item: CartItem): string => {
    return item.id || `${item.product.id}-${item.itemType || 'bottle'}`;
  };

  const discoveryItems = cartItems.filter((i) => i.itemType === 'discovery_sample');
  const bottleItems = cartItems.filter((i) => i.itemType !== 'discovery_sample');

  const discoveryCount = discoveryItems.reduce((sum, i) => sum + i.quantity, 0);
  const discoveryTotal = discoveryCount * DISCOVERY_SAMPLE_PRICE;

  const isDiscoveryIncomplete = discoveryCount > 0 && discoveryCount < DISCOVERY_MIN_SAMPLES;
  const isDiscoveryExceeded = discoveryCount > DISCOVERY_MAX_SAMPLES;

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + getItemPrice(item) * item.quantity,
    0
  );

  const activePayments = paymentMethods.filter(
    (p) => p.activo?.toLowerCase() === 'si' || p.activo === '1' || p.activo === 'true'
  );

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (isDiscoveryIncomplete) {
      errs.discovery = `El Kit de Descubrimiento requiere un mínimo de ${DISCOVERY_MIN_SAMPLES} muestras (tenés ${discoveryCount}). Por favor sumá ${DISCOVERY_MIN_SAMPLES - discoveryCount} muestra(s) más para poder completar el pedido.`;
    }
    if (isDiscoveryExceeded) {
      errs.discovery = `El Kit de Descubrimiento permite un máximo de ${DISCOVERY_MAX_SAMPLES} muestras (tenés ${discoveryCount}).`;
    }
    if (!customerName.trim()) {
      errs.customerName = 'Ingresá tu nombre y apellido';
    }
    if (!customerPhone.trim()) {
      errs.customerPhone = 'Ingresá tu teléfono / WhatsApp';
    }
    if (!customerEmail.trim()) {
      errs.customerEmail = 'Ingresá tu correo electrónico';
    } else if (!customerEmail.includes('@') || !customerEmail.includes('.')) {
      errs.customerEmail = 'Ingresá un correo electrónico válido';
    }
    if (!customerAddress.trim()) {
      errs.customerAddress = 'Ingresá tu dirección o localidad de entrega';
    }
    if (!deliveryDate) {
      errs.deliveryDate = 'Seleccioná el día de entrega';
    }
    if (!deliveryTime) {
      errs.deliveryTime = 'Seleccioná el horario de entrega';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCheckoutWhatsApp = () => {
    if (cartItems.length === 0) return;

    if (!validateForm()) {
      return;
    }

    trackFunnelEvent('cart_checkout_whatsapp_click', {
      itemCount: cartItems.length,
      totalAmount,
      discoveryCount
    });

    let bottlesSection = '';
    if (bottleItems.length > 0) {
      bottlesSection =
        `*🍾 FRASCOS COMPLETOS DE PERFUME:*\n` +
        bottleItems
          .map(
            (item, idx) =>
              `${idx + 1}. *${item.product.producto}* (${item.product.marca} - ${item.product.cantidad})\n` +
              `   • Cantidad: ${item.quantity} u.\n` +
              `   • Subtotal: $${(item.product.precioVenta * item.quantity).toLocaleString('es-AR')} ARS`
          )
          .join('\n\n') + '\n\n';
    }

    let discoverySection = '';
    if (discoveryItems.length > 0) {
      discoverySection =
        `*🧪 KIT DE DESCUBRIMIENTO (${discoveryCount} Muestras a $${DISCOVERY_SAMPLE_PRICE.toLocaleString('es-AR')} c/u):*\n` +
        discoveryItems
          .map((item, idx) => `   ${idx + 1}. *${item.product.producto}* (${item.product.marca}) x ${item.quantity} muestra(s)`)
          .join('\n') +
        `\n   • *Subtotal Kit:* $${discoveryTotal.toLocaleString('es-AR')} ARS\n` +
        `   • 🎁 *Crédito a favor para próxima compra:* $${discoveryTotal.toLocaleString('es-AR')} ARS (se descontará íntegramente de mi siguiente pedido de frasco completo de perfume, no acumulable en esta compra).\n\n`;
    }

    const orderText =
      `🎩 *NUEVO PEDIDO - MR . PERKINS*\n` +
      `=========================================\n` +
      `*Cliente:* ${customerName}\n` +
      `*Email:* ${customerEmail}\n` +
      `*Teléfono:* ${customerPhone}\n` +
      `*Dirección de Envío:* ${customerAddress}\n` +
      `*Día de Entrega:* ${deliveryDate}\n` +
      `*Horario de Entrega:* ${deliveryTime} hs\n` +
      `*Medio de Pago:* ${selectedPayment}\n` +
      `=========================================\n\n` +
      bottlesSection +
      discoverySection +
      `=========================================\n` +
      `*TOTAL A PAGAR:* $${totalAmount.toLocaleString('es-AR')} ARS\n` +
      `*Cuotas sin interés:* Hasta 3 cuotas s/i de $${Math.round(totalAmount / 3).toLocaleString('es-AR')}\n` +
      (notes ? `*Notas adicionales:* ${notes}\n` : '') +
      `=========================================\n` +
      `¡Hola Mr . Perkins! Confirmo mi pedido con todos los datos requeridos para coordinar la entrega.`;

    const encoded = encodeURIComponent(orderText);
    window.open(`https://wa.me/${WHATSAPP_PHONE_INTERNATIONAL}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border-l-4 border-black w-full max-w-lg h-full overflow-y-auto flex flex-col justify-between shadow-[-8px_0px_0px_0px_#000] relative p-4 sm:p-6">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b-3 border-black pb-4">
          <div className="flex items-center gap-2">
            <div className="bg-lime-400 p-2 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              <ShoppingBag className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase font-sans">TU CARRITO DE COMPRAS</h2>
              <p className="text-xs font-mono font-bold text-slate-600">
                {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'} agregados
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar carrito"
            className="bg-black text-white hover:bg-pink-500 hover:text-black p-2 border-2 border-black font-black transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        {cartItems.length === 0 ? (
          <div className="my-auto py-12 text-center space-y-4">
            <div className="w-20 h-20 bg-yellow-300 border-4 border-black mx-auto flex items-center justify-center shadow-[4px_4px_0px_0px_#000]">
              <ShoppingBag className="w-10 h-10 text-black" />
            </div>
            <h3 className="text-lg font-black uppercase font-sans">El carrito está vacío</h3>
            <p className="text-xs font-mono text-slate-600 max-w-xs mx-auto">
              Elegí tus fragancias o desodorantes preferidos en nuestro catálogo Brutalista.
            </p>
            <button
              onClick={onClose}
              className="bg-black text-white hover:bg-lime-400 hover:text-black border-2 border-black px-6 py-2.5 font-black text-xs uppercase shadow-[3px_3px_0px_0px_#000] transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <span>Explorar Productos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1">
            <div className="flex justify-between items-center text-xs font-mono mb-2">
              <span className="font-bold text-slate-500 uppercase">Productos seleccionados</span>
              <button
                onClick={onClearCart}
                className="text-pink-600 hover:underline font-bold uppercase cursor-pointer"
              >
                Vaciar Carrito
              </button>
            </div>

            {/* Discovery Kit Special Status Banner */}
            {discoveryCount > 0 && (
              <div
                className={`p-3.5 border-3 border-black shadow-[3px_3px_0px_0px_#000] space-y-2 ${
                  isDiscoveryIncomplete
                    ? 'bg-amber-100/90 text-amber-950'
                    : 'bg-emerald-50 text-emerald-950'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-1 font-mono">
                  <div className="flex items-center gap-1.5 font-black text-xs uppercase">
                    <Sparkles className="w-4 h-4 text-[#E5A93C] fill-[#E5A93C]" />
                    <span>KIT DE DESCUBRIMIENTO ({discoveryCount}/{DISCOVERY_MAX_SAMPLES} MUESTRAS)</span>
                  </div>
                  <span className="font-black text-xs">
                    ${discoveryTotal.toLocaleString('es-AR')} ARS
                  </span>
                </div>

                {isDiscoveryIncomplete ? (
                  <div className="flex items-start gap-2 text-xs font-serif leading-snug">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Mínimo de muestras requerido:</strong> El kit requiere entre {DISCOVERY_MIN_SAMPLES} y {DISCOVERY_MAX_SAMPLES} muestras (tenés {discoveryCount}). 
                      Sumá <strong>{DISCOVERY_MIN_SAMPLES - discoveryCount} muestra(s) más</strong> desde la tienda para poder finalizar el pedido.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-xs font-serif leading-snug">
                    <div className="flex items-center gap-2 font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>¡Kit de Descubrimiento habilitado para compra!</span>
                    </div>
                    <div className="bg-white/80 p-2 border border-emerald-300 font-mono text-[11px] text-emerald-950">
                      ✦ <strong>Crédito a favor:</strong> Recibirás <strong>${discoveryTotal.toLocaleString('es-AR')} ARS</strong> a favor para descontar de tu siguiente compra de cualquier frasco de perfume (no acumulable en este pedido).
                    </div>
                  </div>
                )}
              </div>
            )}

            {errors.discovery && (
              <div className="bg-pink-100 border-2 border-pink-600 p-2 text-xs font-mono text-pink-700 font-bold">
                ⚠️ {errors.discovery}
              </div>
            )}

            {cartItems.map((item) => {
              const isSample = item.itemType === 'discovery_sample';
              const unitPrice = getItemPrice(item);
              const itemTotal = unitPrice * item.quantity;
              const itemId = getItemId(item);

              return (
                <div
                  key={itemId}
                  className={`border-3 border-black p-3 flex flex-col xs:flex-row gap-3 xs:items-center justify-between shadow-[3px_3px_0px_0px_#000] ${
                    isSample ? 'bg-[#FFFDF9] border-[#E5A93C]' : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={item.product.imgUrl}
                      alt={item.product.producto}
                      className="w-14 h-14 object-cover border-2 border-black bg-white shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=300&auto=format&fit=crop&q=80';
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold bg-black text-yellow-300 px-1.5 py-0.2 uppercase inline-block">
                          {item.product.marca}
                        </span>
                        {isSample ? (
                          <span className="text-[10px] font-mono font-black bg-[#E5A93C] text-black px-1.5 py-0.2 uppercase border border-black inline-flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            MUESTRA KIT
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-800 px-1.5 py-0.2 uppercase">
                            FRASCO ORIGINAL
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-xs uppercase truncate font-serif text-black mt-0.5">
                        {item.product.producto}
                      </h4>
                      <div className="text-[11px] font-mono font-bold text-black mt-0.5">
                        ${unitPrice.toLocaleString('es-AR')} x {item.quantity} ={' '}
                        <span className="font-black text-pink-600">
                          ${itemTotal.toLocaleString('es-AR')}
                        </span>
                      </div>
                      {isSample && (
                        <span className="text-[9px] font-mono text-amber-800 block">
                          Se descuenta luego de tu frasco
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between xs:justify-end gap-2 border-t xs:border-t-0 pt-2 xs:pt-0 border-black/10 shrink-0">
                    <div className="flex items-center border-2 border-black bg-white text-xs font-bold">
                      <button
                        onClick={() => onUpdateQuantity(itemId, -1)}
                        className="px-2.5 py-1 hover:bg-yellow-300 cursor-pointer"
                        aria-label="Restar una unidad"
                      >
                        -
                      </button>
                      <span className="px-2.5 py-1 font-mono">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(itemId, 1)}
                        className="px-2.5 py-1 hover:bg-yellow-300 cursor-pointer"
                        aria-label="Sumar una unidad"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(itemId)}
                      className="text-slate-400 hover:text-pink-600 p-1.5 cursor-pointer"
                      title="Eliminar producto"
                      aria-label="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Customer Details Form */}
            <div className="bg-yellow-50 border-3 border-black p-4 space-y-3 mt-4 shadow-[4px_4px_0px_0px_#000]">
              <div className="border-b-2 border-black pb-1.5 flex items-center justify-between">
                <h4 className="font-black text-xs uppercase font-sans text-black">
                  DATOS OBLIGATORIOS PARA ENVÍO Y ENTREGA
                </h4>
                <span className="text-[10px] font-mono font-bold bg-pink-500 text-white px-1.5 py-0.2">
                  *REQUERIDOS
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-sans">
                {/* Nombre y Apellido */}
                <div>
                  <label className="block font-mono font-bold mb-0.5 text-slate-800">
                    Nombre y Apellido <span className="text-pink-600 font-black">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (errors.customerName) setErrors({ ...errors, customerName: '' });
                    }}
                    placeholder="Ej: Juan Pérez"
                    className={`w-full bg-white border-2 ${
                      errors.customerName ? 'border-pink-600 bg-pink-50' : 'border-black'
                    } px-2.5 py-1.5 text-xs font-bold focus:outline-none`}
                  />
                  {errors.customerName && (
                    <p className="text-[10px] font-mono text-pink-600 font-bold mt-0.5">
                      ⚠️ {errors.customerName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block font-mono font-bold mb-0.5 text-slate-800 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-black" />
                    <span>Correo Electrónico (Mail)</span>
                    <span className="text-pink-600 font-black">*</span>
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => {
                      setCustomerEmail(e.target.value);
                      if (errors.customerEmail) setErrors({ ...errors, customerEmail: '' });
                    }}
                    placeholder="Ej: juan.perez@ejemplo.com"
                    className={`w-full bg-white border-2 ${
                      errors.customerEmail ? 'border-pink-600 bg-pink-50' : 'border-black'
                    } px-2.5 py-1.5 text-xs font-bold focus:outline-none`}
                  />
                  {errors.customerEmail && (
                    <p className="text-[10px] font-mono text-pink-600 font-bold mt-0.5">
                      ⚠️ {errors.customerEmail}
                    </p>
                  )}
                </div>

                {/* Telefono */}
                <div>
                  <label className="block font-mono font-bold mb-0.5 text-slate-800">
                    Teléfono / WhatsApp <span className="text-pink-600 font-black">*</span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      if (errors.customerPhone) setErrors({ ...errors, customerPhone: '' });
                    }}
                    placeholder="Ej: 11 2345 6789"
                    className={`w-full bg-white border-2 ${
                      errors.customerPhone ? 'border-pink-600 bg-pink-50' : 'border-black'
                    } px-2.5 py-1.5 text-xs font-bold focus:outline-none`}
                  />
                  {errors.customerPhone && (
                    <p className="text-[10px] font-mono text-pink-600 font-bold mt-0.5">
                      ⚠️ {errors.customerPhone}
                    </p>
                  )}
                </div>

                {/* Direccion */}
                <div>
                  <label className="block font-mono font-bold mb-0.5 text-slate-800">
                    Dirección / Localidad de Entrega <span className="text-pink-600 font-black">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => {
                      setCustomerAddress(e.target.value);
                      if (errors.customerAddress) setErrors({ ...errors, customerAddress: '' });
                    }}
                    placeholder="Ej: Av. Corrientes 1234, CABA"
                    className={`w-full bg-white border-2 ${
                      errors.customerAddress ? 'border-pink-600 bg-pink-50' : 'border-black'
                    } px-2.5 py-1.5 text-xs font-bold focus:outline-none`}
                  />
                  {errors.customerAddress && (
                    <p className="text-[10px] font-mono text-pink-600 font-bold mt-0.5">
                      ⚠️ {errors.customerAddress}
                    </p>
                  )}
                </div>

                {/* Dia y Horario de Entrega (Calendario y Reloj) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block font-mono font-bold mb-0.5 text-slate-800 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-black" />
                      <span>Día de Entrega</span>
                      <span className="text-pink-600 font-black">*</span>
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={deliveryDate}
                      onChange={(e) => {
                        setDeliveryDate(e.target.value);
                        if (errors.deliveryDate) setErrors({ ...errors, deliveryDate: '' });
                      }}
                      className={`w-full bg-white border-2 ${
                        errors.deliveryDate ? 'border-pink-600 bg-pink-50' : 'border-black'
                      } px-2.5 py-1.5 text-xs font-bold focus:outline-none`}
                    />
                    {errors.deliveryDate && (
                      <p className="text-[10px] font-mono text-pink-600 font-bold mt-0.5">
                        ⚠️ {errors.deliveryDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-mono font-bold mb-0.5 text-slate-800 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-black" />
                      <span>Horario</span>
                      <span className="text-pink-600 font-black">*</span>
                    </label>
                    <input
                      type="time"
                      value={deliveryTime}
                      onChange={(e) => {
                        setDeliveryTime(e.target.value);
                        if (errors.deliveryTime) setErrors({ ...errors, deliveryTime: '' });
                      }}
                      className={`w-full bg-white border-2 ${
                        errors.deliveryTime ? 'border-pink-600 bg-pink-50' : 'border-black'
                      } px-2.5 py-1.5 text-xs font-bold focus:outline-none`}
                    />
                    {errors.deliveryTime && (
                      <p className="text-[10px] font-mono text-pink-600 font-bold mt-0.5">
                        ⚠️ {errors.deliveryTime}
                      </p>
                    )}
                  </div>
                </div>

                {/* Medio de Pago */}
                <div className="pt-1">
                  <label className="block font-mono font-bold mb-0.5 text-slate-800">
                    Medio de Pago:
                  </label>
                  <select
                    value={selectedPayment}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="w-full bg-white border-2 border-black px-2.5 py-1.5 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    {activePayments.map((pm, idx) => (
                      <option key={idx} value={pm.medio_de_pago}>
                        {pm.medio_de_pago}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Drawer Footer Total & Checkout */}
        {cartItems.length > 0 && (
          <div className="border-t-3 border-black pt-4 space-y-3">
            <div className="bg-black text-white p-3 border-2 border-black flex flex-col xs:flex-row xs:items-center justify-between gap-1 font-mono">
              <span className="text-xs uppercase font-bold text-slate-300">TOTAL A PAGAR:</span>
              <span className="text-2xl font-black text-yellow-300">
                ${totalAmount.toLocaleString('es-AR')} ARS
              </span>
            </div>

            <button
              onClick={handleCheckoutWhatsApp}
              className="w-full bg-[#25D366] hover:bg-green-500 text-black border-3 border-black py-3 px-4 font-black text-xs sm:text-sm uppercase flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer leading-snug text-center"
            >
              <MessageCircle className="w-5 h-5 fill-black stroke-none shrink-0" />
              <span>CONFIRMAR PEDIDO POR WHATSAPP</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
