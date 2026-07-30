import React, { useState } from 'react';
import { CartItem, PaymentMethod } from '../types';
import { X, Trash2, ShoppingBag, MessageCircle, ArrowRight, Check } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
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
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(
    paymentMethods[0]?.medio_de_pago || 'Mercado Pago'
  );
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.precioVenta * item.quantity,
    0
  );

  const activePayments = paymentMethods.filter(
    (p) => p.activo?.toLowerCase() === 'si' || p.activo === '1' || p.activo === 'true'
  );

  const handleCheckoutWhatsApp = () => {
    if (cartItems.length === 0) return;

    let itemsList = cartItems
      .map(
        (item, idx) =>
          `${idx + 1}. *${item.product.producto}* (${item.product.marca} - ${item.product.cantidad})\n` +
          `   • Cantidad: ${item.quantity}\n` +
          `   • Subtotal: $${(item.product.precioVenta * item.quantity).toLocaleString('es-AR')} ARS`
      )
      .join('\n\n');

    const orderText =
      `*NUEVO PEDIDO - MR. PERKINS PERFUMES*\n` +
      `-----------------------------------------\n` +
      `*Cliente:* ${customerName || 'No especificado'}\n` +
      `*Teléfono:* ${customerPhone || 'No especificado'}\n` +
      `*Dirección de Envío:* ${customerAddress || 'Retiro en local / CABA'}\n` +
      `*Medio de Pago Seleccionado:* ${selectedPayment}\n` +
      `-----------------------------------------\n\n` +
      `*DETALLE DE PRODUCTOS:*\n\n${itemsList}\n\n` +
      `-----------------------------------------\n` +
      `*TOTAL A PAGAR:* $${totalAmount.toLocaleString('es-AR')} ARS\n` +
      (notes ? `*Notas adicionales:* ${notes}\n` : '') +
      `-----------------------------------------\n` +
      `¡Aguardamos confirmación para coordinar entrega o despacho!`;

    const encoded = encodeURIComponent(orderText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border-l-4 border-black w-full max-w-lg h-full overflow-y-auto flex flex-col justify-between shadow-[-8px_0px_0px_0px_#000] relative p-6">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b-3 border-black pb-4">
          <div className="flex items-center gap-2">
            <div className="bg-lime-400 p-2 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              <ShoppingBag className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase font-sans">TU CARRITO DE COMPRAS</h2>
              <p className="text-xs font-mono font-bold text-slate-600">
                {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'} agregados
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
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

            {cartItems.map((item) => (
              <div
                key={item.product.id}
                className="bg-slate-50 border-3 border-black p-3 flex gap-3 items-center justify-between shadow-[3px_3px_0px_0px_#000]"
              >
                <img
                  src={item.product.imgUrl}
                  alt={item.product.producto}
                  className="w-14 h-14 object-cover border-2 border-black bg-white"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=300&auto=format&fit=crop&q=80';
                  }}
                />

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono font-bold bg-black text-yellow-300 px-1.5 py-0.2 uppercase">
                    {item.product.marca}
                  </span>
                  <h4 className="font-extrabold text-xs uppercase truncate font-sans text-black mt-0.5">
                    {item.product.producto}
                  </h4>
                  <div className="text-[11px] font-mono font-bold text-black mt-0.5">
                    ${item.product.precioVenta.toLocaleString('es-AR')} x {item.quantity} ={' '}
                    <span className="font-black text-pink-600">
                      ${(item.product.precioVenta * item.quantity).toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border-2 border-black bg-white text-xs font-bold">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, -1)}
                      className="px-2 py-0.5 hover:bg-yellow-300 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-2 py-0.5 font-mono">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, 1)}
                      className="px-2 py-0.5 hover:bg-yellow-300 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="text-slate-400 hover:text-pink-600 p-1 cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Customer Details Form */}
            <div className="bg-yellow-100 border-3 border-black p-4 space-y-3 mt-4">
              <h4 className="font-black text-xs uppercase font-sans border-b border-black pb-1">
                DATOS PARA EL ENVÍO Y FACTURACIÓN
              </h4>

              <div className="space-y-2 text-xs font-sans">
                <div>
                  <label className="block font-mono font-bold mb-0.5">Nombre y Apellido:</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="w-full bg-white border-2 border-black px-2.5 py-1 text-xs font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono font-bold mb-0.5">Teléfono / WhatsApp:</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ej: 11 2345 6789"
                    className="w-full bg-white border-2 border-black px-2.5 py-1 text-xs font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono font-bold mb-0.5">Dirección / Localidad:</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Ej: Av. Corrientes 1234, CABA"
                    className="w-full bg-white border-2 border-black px-2.5 py-1 text-xs font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono font-bold mb-0.5">Medio de Pago:</label>
                  <select
                    value={selectedPayment}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="w-full bg-white border-2 border-black px-2.5 py-1 text-xs font-bold focus:outline-none"
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
            <div className="bg-black text-white p-3 border-2 border-black flex items-center justify-between font-mono">
              <span className="text-xs uppercase font-bold text-slate-300">TOTAL A PAGAR:</span>
              <span className="text-2xl font-black text-yellow-300">
                ${totalAmount.toLocaleString('es-AR')} ARS
              </span>
            </div>

            <button
              onClick={handleCheckoutWhatsApp}
              className="w-full bg-[#25D366] hover:bg-green-500 text-black border-3 border-black py-3 px-4 font-black text-sm uppercase flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-black stroke-none" />
              <span>CONFIRMAR PEDIDO POR WHATSAPP</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
