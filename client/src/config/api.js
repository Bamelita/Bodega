import axios from "axios";
import { INITIAL_MOCK_DATA } from "./mockData";

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
  window.__MOCK_DATA__ = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));
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
        (u) => u.username === username,
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
