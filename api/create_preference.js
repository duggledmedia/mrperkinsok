import { MercadoPagoConfig, Preference } from 'mercadopago';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  
  if (!accessToken) {
    return res.status(500).json({ error: "MP Access Token no configurado" });
  }

  const client = new MercadoPagoConfig({ accessToken });

  try {
    const { items, shippingCost, external_reference } = req.body;

    const mpItems = items.map(item => ({
      title: item.title,
      unit_price: Number(item.unit_price),
      quantity: Number(item.quantity),
      currency_id: 'ARS'
    }));

    if (shippingCost > 0) {
      mpItems.push({
        title: "Costo de Envío",
        unit_price: Number(shippingCost),
        quantity: 1,
        currency_id: 'ARS'
      });
    }

    // Determinar la URL base dinámicamente o usar localhost como fallback
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['host'];
    const baseUrl = `${protocol}://${host}`;

    const body = {
      items: mpItems,
      back_urls: {
        success: `${baseUrl}/`,
        failure: `${baseUrl}/`,
        pending: `${baseUrl}/`
      },
      auto_return: "approved",
      external_reference: external_reference,
      statement_descriptor: "MR PERKINS",
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }],
        installments: 6
      }
    };

    const preference = new Preference(client);
    const result = await preference.create({ body });

    return res.status(200).json({ id: result.id, init_point: result.init_point });
  } catch (error) {
    console.error("Error MercadoPago:", error);
    return res.status(500).json({ error: "Error al crear preferencia de pago" });
  }
}