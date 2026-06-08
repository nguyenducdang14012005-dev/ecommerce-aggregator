// ===================================================
// CONFLICT RESOLUTION
// Xử lý khi 2 store có cùng tên sản phẩm nhưng giá khác nhau
// Strategies: lowest_price | highest_price | store_a_wins | store_b_wins | merge_avg
// ===================================================

function resolveConflicts(unifiedData, strategy = "lowest_price") {
  const seen = {};
  const conflicts = [];
  const resolved = [];

  // Tìm conflicts — sản phẩm trùng tên
  unifiedData.forEach(product => {
    const key = product.name.toLowerCase().trim();
    if (seen[key]) {
      conflicts.push({
        name: product.name,
        products: [seen[key], product]
      });
    } else {
      seen[key] = product;
    }
  });

  // Áp dụng strategy để resolve
  const conflictNames = new Set(
    conflicts.map(c => c.name.toLowerCase().trim())
  );

  // Giữ các sản phẩm không có conflict
  unifiedData.forEach(p => {
    if (!conflictNames.has(p.name.toLowerCase().trim())) {
      resolved.push(p);
    }
  });

  // Resolve từng conflict
  conflicts.forEach(conflict => {
    const [p1, p2] = conflict.products;
    let winner;

    switch (strategy) {
      case "lowest_price":
        winner = p1.price <= p2.price ? p1 : p2;
        winner = { ...winner, conflictResolved: true, strategy, otherPrice: p1.price <= p2.price ? p2.price : p1.price };
        break;

      case "highest_price":
        winner = p1.price >= p2.price ? p1 : p2;
        winner = { ...winner, conflictResolved: true, strategy, otherPrice: p1.price >= p2.price ? p2.price : p1.price };
        break;

      case "store_a_wins":
        winner = p1.source === "Store A" ? p1 : p2;
        winner = { ...winner, conflictResolved: true, strategy };
        break;

      case "store_b_wins":
        winner = p1.source === "Store B" ? p1 : p2;
        winner = { ...winner, conflictResolved: true, strategy };
        break;

      case "merge_avg":
        winner = {
          ...p1,
          price: parseFloat(((p1.price + p2.price) / 2).toFixed(2)),
          source: "Store A + Store B",
          conflictResolved: true,
          strategy,
          originalPrices: { storeA: p1.price, storeB: p2.price }
        };
        break;

      default:
        winner = p1;
    }

    resolved.push(winner);
  });

  return {
    resolved,
    conflictsFound: conflicts.length,
    conflictDetails: conflicts.map(c => ({
      name: c.name,
      storeAPrice: c.products.find(p => p.source === "Store A")?.price,
      storeBPrice: c.products.find(p => p.source === "Store B")?.price,
      strategy
    }))
  };
}

module.exports = resolveConflicts;