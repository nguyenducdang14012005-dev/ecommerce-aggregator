
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