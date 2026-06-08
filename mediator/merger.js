const mapStoreA = require("./mapperA");
const mapStoreB = require("./mapperB");

function mergeStores(dataA, dataB) {
  const mappedA = mapStoreA(dataA);
  const mappedB = mapStoreB(dataB);
  const merged = [...mappedA, ...mappedB];
  merged.sort((a, b) => a.price - b.price);
  return merged;
}

module.exports = mergeStores;