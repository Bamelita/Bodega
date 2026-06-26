const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
let { customers, products, movements } = require("../data/store");
const { supabase, hasSupabase } = require("../config/supabaseClient");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || null;

// Helper to get data based on local store vs supabase
async function getContextData() {
  if (hasSupabase) {
    const [customersRes, productsRes, movementsRes] = await Promise.all([
      supabase.from("customers").select("*"),
      supabase.from("products").select("*"),
      supabase.from("movements").select("*").order("ts", { ascending: false }).limit(50),
    ]);
    return {
      customers: customersRes.data || [],
      products: productsRes.data || [],
      movements: movementsRes.data || []
    };
  }
  return { customers, products, movements };
}

router.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Mensaje es requerido" });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ 
      message: "Falta configurar GEMINI_API_KEY en el servidor", 
      error: "MISSING_API_KEY" 
    });
  }

  try {
    const data = await getContextData();
    
    // Generate simple reports
    const today = new Date().toISOString().split('T')[0];
    const todaySales = data.movements
      .filter(m => m.type === 'SALE' && m.ts.startsWith(today))
      .reduce((sum, m) => sum + (m.total || 0), 0);

    const debtors = data.customers
      .filter(c => c.debt && c.debt.enabled && c.debt.currentDebt > 0)
      .map(c => `${c.firstName} ${c.lastName}: $${c.debt.currentDebt} (vence: ${c.debt.daysOverdue || 'N/A'} días)`)
      .join(", ");
    
    const inventorySummary = data.products
      .map(p => `${p.name} (Stock: ${p.stock}, Precio: $${p.price})`)
      .join(", ");

    const systemPrompt = `
Eres "Invexis AI", el asistente inteligente del sistema de gestión de inventarios y clientes Invexis.
Tu trabajo es responder las consultas del usuario dueño de la tienda de forma amable, directa y profesional.

A continuación, te proporciono el contexto actual de la base de datos de la tienda:
1. Resumen de Inventario: ${inventorySummary || "No hay productos"}
2. Ventas de hoy: $${todaySales}
3. Clientes con deuda pendiente: ${debtors || "Ninguno"}

Reglas:
- Si el usuario te pregunta por algo que no sabes (como el clima), indícale amablemente que solo puedes ayudar con la tienda Invexis.
- Responde de forma concisa (1 o 2 párrafos máximo). No des respuestas excesivamente largas.
- Si te piden consejos sobre deudores, sé estratégico y sugiere tacto.
- Formatea tus respuestas de forma clara.

El usuario dice: "${message}"
`;

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();

    res.json({ reply: responseText });
  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ message: "Error procesando tu mensaje con IA", detail: err.message });
  }
});

module.exports = router;
