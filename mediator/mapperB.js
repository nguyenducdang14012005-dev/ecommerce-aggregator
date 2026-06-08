// GAV Mapping: Store B → Global Schema
// Quy tắc:
//   item      →  name
//   cost.amt  →  price       ← lấy từ object lồng nhau!
//   cost.cur  →  currency    ← lấy từ object lồng nhau!
//   (tự thêm) →  source = "Store B"

function mapStoreB(items) {
  return items.map((item, index) => {
    return {
      id:       `B-${index + 1}`,
      name:     item.item,
      price:    item.cost.amt,
      currency: item.cost.cur,
      source:   "Store B"
    };
  });
}

module.exports = mapStoreB;