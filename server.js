const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));
const resolveConflicts = require("./mediator/conflictResolver");

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE");
  next();
});
app.use((req, res, next) => {
  if (req.query.delay === 'true') {
    const delayMs = Math.floor(Math.random() * 800) + 200; // 200-1000ms
    console.log(`⏱️  Simulating network delay: ${delayMs}ms`);
    setTimeout(next, delayMs);
  } else {
    next();
  }
});

// ===== DATA STORE (in-memory, có thể thêm/xóa) =====
let storeAData = require("./data/storeA.json");
let storeBData = require("./data/storeB.json");
// ===== FAILURE SIMULATION =====
let storeBOnline = true;
let storeAOnline = true;

// ===== MEDIATOR =====
const mergeStores = require("./mediator/merger");
const mapStoreA = require("./mediator/mapperA");
const mapStoreB = require("./mediator/mapperB");

// ===================================================
// 1. UNIFIED ENDPOINT — filter + sort + search + paginate
// GET /api/products?source=storeA&sort=price_asc&search=áo&page=1&limit=10
// ===================================================
app.get("/api/products", (req, res) => {
  const { source, sort, search, page = 1, limit = 50 } = req.query;

  // ===== GRACEFUL FALLBACK =====
  let unified = [];
  const warnings = [];

  try {
    const mappedA = storeAOnline ? mapStoreA(storeAData) : [];
    const mappedB = storeBOnline ? mapStoreB(storeBData) : [];

    if (!storeAOnline) warnings.push("Store A OFFLINE — không có dữ liệu từ Store A");
    if (!storeBOnline) warnings.push("Store B OFFLINE — hệ thống đang chạy partial data");

    unified = [...mappedA, ...mappedB];

  } catch (e) {
    console.error("Merge error:", e.message);
    warnings.push("Merge error: " + e.message);
    try { unified = storeAOnline ? mapStoreA(storeAData) : []; } catch {}
  }

  // Filter theo source
  if (source === "storeA") unified = unified.filter(p => p.source === "Store A");
  if (source === "storeB") unified = unified.filter(p => p.source === "Store B");

  // Search
  if (search) {
    unified = unified.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Sort
  if (sort === "price_asc")  unified.sort((a, b) => a.price - b.price);
  if (sort === "price_desc") unified.sort((a, b) => b.price - a.price);
  if (sort === "name_asc")   unified.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "name_desc")  unified.sort((a, b) => b.name.localeCompare(a.name));

  // Pagination
  const pageNum   = parseInt(page);
  const limitNum  = parseInt(limit);
  const start     = (pageNum - 1) * limitNum;
  const paginated = unified.slice(start, start + limitNum);

  res.json({
    success: true,
    total: unified.length,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(unified.length / limitNum),
    storeStatus: { storeA: storeAOnline, storeB: storeBOnline },
    warnings,
    data: paginated
  });
});

// ===================================================
// 2. RAW DATA — xem data thô chưa qua mapping
// ===================================================
app.get("/api/store-a/raw", (req, res) => {
  res.json({ success: true, total: storeAData.length, schema: "flat", data: storeAData });
});

app.get("/api/store-b/raw", (req, res) => {
  res.json({ success: true, total: storeBData.length, schema: "nested", data: storeBData });
});

// ===================================================
// 3. LAV ENDPOINT — demo Local As View
// Mỗi store tự khai báo mapping về global schema
// ===================================================
app.get("/api/lav/mappings", (req, res) => {
  res.json({
    success: true,
    approach: "LAV - Local As View",
    description: "Mỗi store tự mô tả mình theo ngôn ngữ của Global Schema",
    mappings: {
      storeA: {
        source: "Store A",
        localSchema: { prod_name: "string", price: "number" },
        lavDeclaration: {
          "global.name":     "local.prod_name",
          "global.price":    "local.price",
          "global.currency": { default: "USD" },
          "global.source":   { constant: "Store A" }
        }
      },
      storeB: {
        source: "Store B",
        localSchema: { item: "string", cost: { amt: "number", cur: "string" } },
        lavDeclaration: {
          "global.name":     "local.item",
          "global.price":    "local.cost.amt",
          "global.currency": "local.cost.cur",
          "global.source":   { constant: "Store B" }
        }
      }
    }
  });
});

// ===================================================
// 4. SCHEMA ENDPOINT — xem Global Schema
// ===================================================
app.get("/api/schema", (req, res) => {
  res.json({
    success: true,
    globalSchema: {
      id:       { type: "string", example: "A-1", description: "ID duy nhất" },
      name:     { type: "string", example: "Áo thun", description: "Tên sản phẩm" },
      price:    { type: "number", example: 10, description: "Giá sản phẩm" },
      currency: { type: "string", example: "USD", description: "Đơn vị tiền tệ" },
      source:   { type: "string", example: "Store A", description: "Nguồn dữ liệu" }
    },
    approach: "GAV - Global As View",
    sources: ["Store A", "Store B"]
  });
});

// ===================================================
// 5. STATS ENDPOINT — thống kê tổng hợp
// ===================================================
app.get("/api/stats", (req, res) => {
  const unified = mergeStores(storeAData, storeBData);
  const prices  = unified.map(p => p.price);
  const countA  = unified.filter(p => p.source === "Store A").length;
  const countB  = unified.filter(p => p.source === "Store B").length;
  const avg     = prices.reduce((a, b) => a + b, 0) / prices.length;

  res.json({
    success: true,
    stats: {
      totalProducts:  unified.length,
      storeACount:    countA,
      storeBCount:    countB,
      minPrice:       Math.min(...prices),
      maxPrice:       Math.max(...prices),
      avgPrice:       parseFloat(avg.toFixed(2)),
      currencies:     [...new Set(unified.map(p => p.currency))],
      sources:        [...new Set(unified.map(p => p.source))]
    }
  });
});

// ===================================================
// 6. ADD PRODUCT — thêm sản phẩm mới
// POST /api/store-a/add  body: { prod_name, price }
// POST /api/store-b/add  body: { item, cost: { amt, cur } }
// ===================================================
app.post("/api/store-a/add", (req, res) => {
  const { prod_name, price } = req.body;
  if (!prod_name || price === undefined) {
    return res.status(400).json({ success: false, message: "Thiếu prod_name hoặc price" });
  }
  const newItem = { prod_name, price: parseFloat(price) };
  storeAData.push(newItem);
  res.json({ success: true, message: "Đã thêm vào Store A", added: newItem, total: storeAData.length });
});

app.post("/api/store-b/add", (req, res) => {
  const { item, cost } = req.body;
  if (!item || !cost || cost.amt === undefined) {
    return res.status(400).json({ success: false, message: "Thiếu item hoặc cost" });
  }
  const newItem = { item, cost: { amt: parseFloat(cost.amt), cur: cost.cur || "USD" } };
  storeBData.push(newItem);
  res.json({ success: true, message: "Đã thêm vào Store B", added: newItem, total: storeBData.length });
});

// ===================================================
// 7. DELETE PRODUCT
// DELETE /api/store-a/:index
// DELETE /api/store-b/:index
// ===================================================
app.delete("/api/store-a/:index", (req, res) => {
  const idx = parseInt(req.params.index);
  if (idx < 0 || idx >= storeAData.length) {
    return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
  }
  const removed = storeAData.splice(idx, 1)[0];
  res.json({ success: true, message: "Đã xóa khỏi Store A", removed, total: storeAData.length });
});

app.delete("/api/store-b/:index", (req, res) => {
  const idx = parseInt(req.params.index);
  if (idx < 0 || idx >= storeBData.length) {
    return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
  }
  const removed = storeBData.splice(idx, 1)[0];
  res.json({ success: true, message: "Đã xóa khỏi Store B", removed, total: storeBData.length });
});

// ===================================================
// 8. RESET — reset về data gốc
// ===================================================
app.post("/api/reset", (req, res) => {
  storeAData = require("./data/storeA.json");
  storeBData = require("./data/storeB.json");
  res.json({ success: true, message: "Đã reset về data gốc" });
});

// ===================================================
// 9. API DOCS — liệt kê tất cả endpoints
// ===================================================
app.get("/api", (req, res) => {
  res.json({
    name: "E-Commerce Aggregator API",
    version: "2.0",
    approach: "GAV Mediator",
    endpoints: [
      { method: "GET",    path: "/api/products",           desc: "Unified endpoint — filter, sort, search, paginate" },
      { method: "GET",    path: "/api/products?source=storeA", desc: "Lọc chỉ Store A" },
      { method: "GET",    path: "/api/products?source=storeB", desc: "Lọc chỉ Store B" },
      { method: "GET",    path: "/api/products?sort=price_asc", desc: "Sắp xếp giá tăng dần" },
      { method: "GET",    path: "/api/products?sort=price_desc", desc: "Sắp xếp giá giảm dần" },
      { method: "GET",    path: "/api/products?search=áo", desc: "Tìm kiếm theo tên" },
      { method: "GET",    path: "/api/store-a/raw",        desc: "Data thô Store A" },
      { method: "GET",    path: "/api/store-b/raw",        desc: "Data thô Store B" },
      { method: "GET",    path: "/api/schema",             desc: "Global Schema definition" },
      { method: "GET",    path: "/api/stats",              desc: "Thống kê tổng hợp" },
      { method: "GET",    path: "/api/lav/mappings",       desc: "LAV mapping declarations" },
      { method: "POST",   path: "/api/store-a/add",        desc: "Thêm sản phẩm vào Store A" },
      { method: "POST",   path: "/api/store-b/add",        desc: "Thêm sản phẩm vào Store B" },
      { method: "DELETE", path: "/api/store-a/:index",     desc: "Xóa sản phẩm khỏi Store A" },
      { method: "DELETE", path: "/api/store-b/:index",     desc: "Xóa sản phẩm khỏi Store B" },
      { method: "POST",   path: "/api/reset",              desc: "Reset về data gốc" }
    ]
  });
});
// 10. CONFLICT RESOLUTION ENDPOINT
// GET /api/conflicts?strategy=lowest_price
// Strategies: lowest_price | highest_price | store_a_wins | store_b_wins | merge_avg
// ===================================================
app.get("/api/conflicts", (req, res) => {
  const { strategy = "lowest_price" } = req.query;

  // Tạo data có conflict để demo
  const dataAWithConflict = [
    ...storeAData,
    { prod_name: "Túi xách da", price: 45 },   // conflict với Store B
    { prod_name: "Đồng hồ thông minh", price: 99 } // conflict với Store B
  ];

  const unified = mergeStores(dataAWithConflict, storeBData);
  const result  = resolveConflicts(unified, strategy);

  res.json({
    success: true,
    strategy,
    availableStrategies: ["lowest_price", "highest_price", "store_a_wins", "store_b_wins", "merge_avg"],
    conflictsFound: result.conflictsFound,
    conflictDetails: result.conflictDetails,
    total: result.resolved.length,
    data: result.resolved
  });
});
app.post("/api/store-a/toggle", (req, res) => {
  storeAOnline = !storeAOnline;
  console.log(`Store A: ${storeAOnline ? "ONLINE ✅" : "OFFLINE ❌"}`);
  res.json({
    success: true,
    storeAOnline,
    message: storeAOnline ? "Store A back ONLINE" : "Store A is DOWN"
  });
});
app.post("/api/store-b/toggle", (req, res) => {
  storeBOnline = !storeBOnline;
  console.log(`Store B: ${storeBOnline ? "ONLINE ✅" : "OFFLINE ❌"}`);
  res.json({
    success: true,
    storeBOnline,
    message: storeBOnline ? "Store B back ONLINE" : "Store B is DOWN"
  });
});
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    stores: {
      storeA: { online: storeAOnline, products: storeAData.length },
      storeB: { online: storeBOnline, products: storeBData.length }
    }
  });
});
// START
const PORT = 3000;
app.listen(PORT, () => {
  console.log("╔══════════════════════════════════════╗");
  console.log("║   E-Commerce Aggregator API v2.0     ║");
  console.log("╠══════════════════════════════════════╣");
  console.log(`║  http://localhost:${PORT}/api            ║`);
  console.log(`║  http://localhost:${PORT}/api/products   ║`);
  console.log(`║  http://localhost:${PORT}/api/stats      ║`);
  console.log("╚══════════════════════════════════════╝");
});