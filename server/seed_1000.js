const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

const categories = ['Granos', 'Lácteos', 'Carnes', 'Limpieza', 'Bebidas', 'Snacks', 'Panadería', 'Verduras'];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

try {
  let db = { users: [], products: [], movements: [], customers: [], auditLogs: [] };
  if (fs.existsSync(DB_PATH)) {
    db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  }

  if (!db.auditLogs) db.auditLogs = [];

  // Get current max IDs
  let maxProductId = db.products.reduce((max, p) => Math.max(max, p.id), 0);
  let maxMovementId = db.movements.reduce((max, m) => Math.max(max, m.id), 0);
  let maxCustomerId = db.customers.reduce((max, c) => Math.max(max, c.id), 0);
  let maxAuditId = db.auditLogs.reduce((max, a) => Math.max(max, a.id), 0);

  // Generate 1000 products
  for (let i = 0; i < 1000; i++) {
    maxProductId++;
    const price = +(Math.random() * 50 + 1).toFixed(2);
    db.products.push({
      id: maxProductId,
      name: `Producto Generado ${maxProductId}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      stock: Math.floor(Math.random() * 500),
      minStock: Math.floor(Math.random() * 50) + 5,
      price: price,
      cost: +(price * 0.6).toFixed(2),
      expirationDate: randomDate(new Date(), new Date(2028, 1, 1))
    });
  }

  // Generate 1000 movements
  for (let i = 0; i < 1000; i++) {
    maxMovementId++;
    const isOut = Math.random() > 0.5;
    const p = db.products[Math.floor(Math.random() * db.products.length)];
    db.movements.push({
      id: maxMovementId,
      type: isOut ? 'OUT' : 'IN',
      productId: p.id,
      productName: p.name,
      quantity: Math.floor(Math.random() * 20) + 1,
      date: randomDate(new Date(2024, 0, 1), new Date()),
      userId: 1
    });
  }

  // Generate 1000 customers
  for (let i = 0; i < 1000; i++) {
    maxCustomerId++;
    db.customers.push({
      id: maxCustomerId,
      firstName: `Cliente`,
      lastName: `Prueba ${maxCustomerId}`,
      cedula: `${Math.floor(10000000 + Math.random() * 20000000)}`,
      phone: `555-${Math.floor(1000 + Math.random() * 9000)}`,
      debt: { enabled: false, parts: 0, installmentAmount: 0, frequency: null },
      specialOrder: { enabled: false, product: '', payInAdvance: false, advanceAmount: 0, notes: '' },
      createdAt: randomDate(new Date(2024, 0, 1), new Date())
    });
  }

  // Generate 1000 audit logs
  const actions = ['LOGIN', 'CREATE_USER', 'UPDATE_PRODUCT', 'DELETE_PRODUCT', 'NEW_SALE', 'IMPORT_DATA', 'BACKUP_CREATED'];
  for (let i = 0; i < 1000; i++) {
    maxAuditId++;
    db.auditLogs.push({
      id: maxAuditId,
      action: actions[Math.floor(Math.random() * actions.length)],
      detail: `Acción automática generada por script (Ref: ${Math.floor(Math.random() * 9999)})`,
      admin: 'admin',
      date: randomDate(new Date(2024, 0, 1), new Date())
    });
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  console.log('Seeded 1000 products, 1000 movements, 1000 customers, and 1000 audit logs successfully!');
} catch (e) {
  console.error('Error seeding:', e);
}
