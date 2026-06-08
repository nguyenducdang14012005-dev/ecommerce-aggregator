function mapStoreA(items) {
  return items.map((item, index) => {
    return {
      id:       `A-${index + 1}`,
      name:     item.prod_name,
      price:    item.price,
      currency: "USD",
      source:   "Store A"
    };
  });
}

module.exports = mapStoreA;