import axios from "axios";

const originApi =
  typeof window !== "undefined"
    ? `${window.location.origin}/api`
    : "http://localhost:3001/api";
export const API_URL = import.meta.env?.VITE_API_URL || originApi;

const api = axios.create({
  baseURL: API_URL,
});

// Mock data for Netlify/Demo mode - MUTABLE STATE
// We use a global variable on window if it exists to persist state across hot reloads or component re-renders
// IF the page refreshes, this resets (unless we used localStorage, but simple memory is fine for a demo session).

if (typeof window !== "undefined" && !window.__MOCK_DATA__) {
  window.__MOCK_DATA__ = {
    users: [
      {
        id: 1,
        username: "admin",
        password: "admin123",
        role: "admin",
        firstName: "System",
        lastName: "Admin",
        email: "admin@bodega.com",
        cedula: "0000000000",
        phone: "555-5555",
        paymentMethod: "Efectivo",
        paymentAmount: 0,
        startDate: new Date().toISOString(),
        cutoffDate: "",
        isActive: true,
      },
      {
        id: 2,
        username: "user",
        password: "user123",
        role: "user",
        firstName: "Vendedor",
        lastName: "Demo",
        email: "vendedor@bodega.com",
        cedula: "1111111111",
        phone: "555-1234",
        paymentMethod: "Efectivo",
        paymentAmount: 0,
        startDate: new Date().toISOString(),
        cutoffDate: "",
        isActive: true,
      },
    ],
    products: [
      {
        id: 1,
        name: "Arroz 1kg",
        category: "Granos",
        stock: 45,
        minStock: 20,
        price: 1.2,
        cost: 0.8,
        expirationDate: "2025-12-31",
      },
      {
        id: 2,
        name: "Aceite 1L",
        category: "Aceites",
        stock: 8,
        minStock: 10,
        price: 2.5,
        cost: 1.6,
        expirationDate: "2026-06-30",
      },
      {
        id: 3,
        name: "Leche 1L",
        category: "Lácteos",
        stock: 5,
        minStock: 15,
        price: 0.9,
        cost: 0.6,
        expirationDate: "2024-02-15",
      },
      {
        id: 4,
        name: "Atún en lata",
        category: "Conservas",
        stock: 100,
        minStock: 20,
        price: 1.5,
        cost: 1.0,
        expirationDate: "2027-01-01",
      },
      {
        id: 5,
        name: "Yogurt Fresa",
        category: "Lácteos",
        stock: 12,
        minStock: 10,
        price: 0.8,
        cost: 0.55,
        expirationDate: "2024-02-01",
      },
    ],
    movements: [],
    customers: [
      {
        id: 1,
        firstName: "Juan",
        lastName: "Pérez",
        cedula: "12345678",
        phone: "555-1111",
        debt: {
          enabled: true,
          currentDebt: 50,
          daysOverdue: 3,
        },
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        firstName: "Ana",
        lastName: "López",
        cedula: "87654321",
        phone: "555-2222",
        debt: {
          enabled: true,
          currentDebt: 120,
          daysOverdue: 12,
        },
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
      {
        id: 3,
        firstName: "Luis",
        lastName: "Gómez",
        cedula: "11223344",
        phone: "555-3333",
        debt: { enabled: false, currentDebt: 0, daysOverdue: 0 },
        createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
      },
    ],
    backups: [],
    logs: [
      {
        type: "CREATE",
        message: "Respaldo automático creado",
        ts: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        type: "LOGIN",
        message: "Inicio de sesión exitoso (Admin)",
        ts: new Date().toISOString(),
      },
      // New Activity Feed Mock
      {
        type: "SALE",
        message: "Venta registrada #1024",
        amount: 45.0,
        user: "Juan",
        ts: new Date().toISOString(),
      },
      {
        type: "ADD_PRODUCT",
        message: "Producto agregado: Harina PAN",
        user: "Admin",
        ts: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        type: "PAYMENT",
        message: "Pago recibido: Ana López",
        amount: 120.0,
        user: "Admin",
        ts: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        type: "STOCK_LOW",
        message: "Stock bajo: Leche 1L",
        user: "System",
        ts: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    // New Orders (Encargos)
    orders: [
      {
        id: 1,
        client: "Carlos Pérez",
        product: "Caja de Aceite x12",
        status: "pending",
        date: new Date().toISOString(),
      },
      {
        id: 2,
        client: "María Rodriguez",
        product: "5 Sacos de Arroz",
        status: "ready",
        date: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 3,
        client: "Pedro D.",
        product: "Queso Especial",
        status: "delivered",
        date: new Date(Date.now() - 172800000).toISOString(),
      },
    ],
    // Sales History for Chart (Last 7 days)
    salesHistory: Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        date: d.toLocaleDateString("es-ES", { weekday: "short" }),
        sales: Math.floor(Math.random() * 500) + 100,
        payments: Math.floor(Math.random() * 400) + 50,
      };
    }),
    plans: [
      {
        id: 1,
        name: "🥉 Básico",
        price: 9.99,
        currency: "USD",
        features: ["Hasta 50 Productos", "1 Usuario", "Soporte Básico"],
        status: "active",
      },
      {
        id: 2,
        name: "🥈 Profesional",
        price: 29.99,
        currency: "USD",
        features: [
          "Hasta 500 Productos",
          "5 Usuarios",
          "Facturación",
          "Soporte Prioritario",
        ],
        status: "active",
      },
      {
        id: 3,
        name: "🥇 Premium",
        price: 99.99,
        currency: "USD",
        features: [
          "Productos Ilimitados",
          "Usuarios Ilimitados",
          "API Access",
          "Soporte 24/7",
        ],
        status: "active",
      },
    ],
    // New mock collections for extended settings
    sessions: [
      {
        id: 1,
        device: "Chrome / Windows",
        ip: "192.168.1.1",
        location: "Caracas, VE",
        lastActive: new Date().toISOString(),
        current: true,
      },
      {
        id: 2,
        device: "Safari / iPhone",
        ip: "201.21.10.5",
        location: "Maracaibo, VE",
        lastActive: new Date(Date.now() - 3600000 * 2).toISOString(),
        current: false,
      },
    ],
    notifications: {
      admin: { userExpiring: true, userSuspended: true },
      user: { closeCutoff: true, suspended: true },
      channels: { system: true, email: false },
    },
    supportMessages: [
      {
        id: 1,
        user: "vendedor",
        subject: "Problema con impresora",
        text: "No puedo imprimir el ticket de venta #1024",
        date: new Date(Date.now() - 7200000).toISOString(),
        read: false,
      },
      {
        id: 2,
        user: "vendedor",
        subject: "Duda sobre cierre",
        text: "¿A qué hora se debe hacer el cierre hoy?",
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        read: true,
      },
    ],
    auditLogs: [
      {
        id: 1,
        action: "CREATE_USER",
        detail: 'Creó usuario "vendedor2"',
        admin: "admin",
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 2,
        action: "UPDATE_SETTINGS",
        detail: "Cambió moneda a USD",
        admin: "admin",
        date: new Date(Date.now() - 86400000 * 10).toISOString(),
      },
    ],
    systemConfig: {
      currency: "USD",
      symbol: "$",
      taxCookies: true,
      taxRate: 16,
      themeColor: "#2563eb",
      dateFormat: "DD/MM/YYYY",
      timezone: "America/Caracas",
      limits: { maxProducts: 500, maxClients: 100 }, // per user default
    },
  };
}

const getMockData = () =>
  typeof window !== "undefined" ? window.__MOCK_DATA__ : null;

api.interceptors.request.use(async (config) => {
  const parseBody = (data) => {
    try {
      return typeof data === "string" ? JSON.parse(data) : data || {};
    } catch {
      return {};
    }
  };
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.access_token) {
    config.headers.Authorization = `Bearer ${user.access_token}`;
  }

  // Detect Netlify environment
  const isNetlify =
    typeof window !== "undefined" &&
    /netlify\.app$/.test(window.location.hostname);

  // If on Netlify, hijack the request and return mock data
  if (isNetlify) {
    // console.log('[Mock Adapter] Intercepting request:', config.url);
    const mockDB = getMockData();

    // Handle Login
    if (config.url === "/auth/login" && config.method === "post") {
      const { username, password } = config.data || {};
      const mockUser = mockDB.users.find(
        (u) => u.username === username && u.password === password,
      );

      if (mockUser) {
        const { password: _, ...userWithoutPass } = mockUser;
        config.adapter = () =>
          Promise.resolve({
            data: {
              user: userWithoutPass,
              access_token: "mock_token_" + Date.now(),
            },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
            request: {},
          });
        return config;
      } else {
        config.adapter = () =>
          Promise.reject({
            response: {
              status: 401,
              data: { message: "Credenciales inválidas (Demo Mode)" },
            },
          });
        return config;
      }
    }

    // Handle GET endpoints
    if (config.method === "get") {
      let data = null;
      if (config.url === "/users") data = mockDB.users;
      else if (config.url === "/products") data = mockDB.products;
      else if (config.url === "/customers") data = mockDB.customers;
      else if (config.url === "/movements") data = mockDB.movements;
      else if (config.url === "/backups") data = mockDB.backups;
      else if (config.url === "/backups/logs") data = mockDB.logs;
      // New GET endpoints
      else if (config.url === "/settings/sessions") data = mockDB.sessions;
      else if (config.url === "/settings/audit") data = mockDB.auditLogs;
      else if (config.url === "/settings/notifications")
        data = mockDB.notifications;
      else if (config.url === "/settings/system") data = mockDB.systemConfig;
      else if (config.url === "/support/messages")
        data = mockDB.supportMessages;
      else if (config.url === "/orders") data = mockDB.orders;
      else if (config.url === "/sales/history") data = mockDB.salesHistory;
      else if (config.url === "/activity") data = mockDB.logs;
      else if (config.url === "/plans") data = mockDB.plans;

      if (data) {
        config.adapter = () =>
          Promise.resolve({
            data,
            status: 200,
            statusText: "OK",
            headers: {},
            config,
            request: {},
          });
        return config;
      }
    }

    // Handle POST (Create)
    if (config.method === "post") {
      let createdDetails = { id: Date.now() };

      if (config.url === "/users") {
        const newUser = {
          id: Date.now(),
          ...parseBody(config.data),
          isActive: true,
        };
        mockDB.users.push(newUser);
        createdDetails = newUser;
      } else if (config.url === "/products") {
        const newProd = { id: Date.now(), ...parseBody(config.data) };
        mockDB.products.push(newProd);
        createdDetails = newProd;
      } else if (config.url === "/customers") {
        const newCust = {
          id: Date.now(),
          ...parseBody(config.data),
          createdAt: new Date().toISOString(),
        };
        mockDB.customers.unshift(newCust); // Add to beginning
        createdDetails = newCust;
      } else if (config.url === "/plans") {
        const newPlan = { id: Date.now(), ...parseBody(config.data) };
        mockDB.plans.push(newPlan);
        createdDetails = newPlan;
      } else if (config.url === "/sales/single") {
        const { productId, quantity } = parseBody(config.data);
        const prod = mockDB.products.find((p) => p.id === Number(productId));
        if (!prod)
          return Promise.reject({
            response: {
              status: 404,
              data: { message: "Producto no encontrado" },
            },
          });

        if (prod.stock < quantity)
          return Promise.reject({
            response: { status: 400, data: { message: "Stock insuficiente" } },
          });

        prod.stock -= quantity;
        const newMovement = {
          id: Date.now() + Math.random(),
          type: "OUT",
          productId: Number(productId),
          productName: prod.name,
          quantity: Number(quantity),
          date: new Date().toISOString(),
        };
        mockDB.movements.push(newMovement);

        config.adapter = () =>
          Promise.resolve({
            data: { movement: newMovement, product: prod },
            status: 201,
            statusText: "Created",
            headers: {},
            config,
            request: {},
          });
        return config;
      } else if (config.url === "/sales/batch") {
        const { items } = parseBody(config.data);
        const newMovements = [];

        for (const item of items) {
          const prod = mockDB.products.find(
            (p) => p.id === Number(item.productId),
          );
          if (prod && prod.stock >= item.quantity) {
            prod.stock -= item.quantity;
            const mv = {
              id: Date.now() + Math.random(),
              type: "OUT",
              productId: Number(item.productId),
              productName: prod.name,
              quantity: Number(item.quantity),
              date: new Date().toISOString(),
            };
            mockDB.movements.push(mv);
            newMovements.push(mv);
          }
        }

        config.adapter = () =>
          Promise.resolve({
            data: { movements: newMovements },
            status: 201,
            statusText: "Created",
            headers: {},
            config,
            request: {},
          });
        return config;
      }

      config.adapter = () =>
        Promise.resolve({
          data: createdDetails,
          status: 201,
          statusText: "Created",
          headers: {},
          config,
          request: {},
        });
      return config;
    }

    // Handle DELETE
    if (config.method === "delete") {
      const urlParts = config.url.split("/");
      const id = parseInt(urlParts[urlParts.length - 1]);
      const resource = urlParts[1]; // 'users', 'products', etc.

      if (resource === "users") {
        mockDB.users = mockDB.users.filter((u) => u.id !== id);
      } else if (resource === "products") {
        mockDB.products = mockDB.products.filter((u) => u.id !== id);
      } else if (resource === "customers") {
        mockDB.customers = mockDB.customers.filter((u) => u.id !== id);
      } else if (resource === "plans") {
        mockDB.plans = mockDB.plans.filter((p) => p.id !== id);
      }

      config.adapter = () =>
        Promise.resolve({
          data: { message: "Eliminado correctamente (Demo)" },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
          request: {},
        });
      return config;
    }

    // Handle PUT (Update)
    if (config.method === "put") {
      const urlParts = config.url.split("/");
      const id = parseInt(urlParts[urlParts.length - 1]);
      const resource = urlParts[1];
      const updateData = parseBody(config.data);

      if (resource === "users") {
        const idx = mockDB.users.findIndex((u) => u.id === id);
        if (idx !== -1)
          mockDB.users[idx] = { ...mockDB.users[idx], ...updateData };
      } else if (resource === "customers") {
        const idx = mockDB.customers.findIndex((c) => c.id === id);
        if (idx !== -1)
          mockDB.customers[idx] = { ...mockDB.customers[idx], ...updateData };
      } else if (resource === "plans") {
        const idx = mockDB.plans.findIndex((p) => p.id === id);
        if (idx !== -1)
          mockDB.plans[idx] = { ...mockDB.plans[idx], ...updateData };
      }

      config.adapter = () =>
        Promise.resolve({
          data: { ...updateData, id },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
          request: {},
        });
      return config;
    }

    // Handle PATCH (Partial Update)
    if (config.method === "patch") {
      if (config.url === "/settings/notifications") {
        const payload = parseBody(config.data);
        mockDB.notifications = { ...mockDB.notifications, ...payload };
        config.adapter = () =>
          Promise.resolve({
            data: mockDB.notifications,
            status: 200,
            statusText: "OK",
            headers: {},
            config,
            request: {},
          });
        return config;
      }
      if (config.url === "/settings/system") {
        const payload = parseBody(config.data);
        mockDB.systemConfig = { ...mockDB.systemConfig, ...payload };
        config.adapter = () =>
          Promise.resolve({
            data: mockDB.systemConfig,
            status: 200,
            statusText: "OK",
            headers: {},
            config,
            request: {},
          });
        return config;
      }
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    // Check for accidental HTML responses
    if (
      response.headers["content-type"] &&
      response.headers["content-type"].includes("text/html")
    ) {
      return Promise.reject(
        new Error(
          "API responded with HTML instead of JSON. Backend might be down.",
        ),
      );
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
