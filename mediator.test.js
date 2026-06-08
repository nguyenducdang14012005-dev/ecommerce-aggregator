const mapStoreA = require("./mediator/mapperA");
const mapStoreB = require("./mediator/mapperB");
const mergeStores = require("./mediator/merger");

// ===== TEST MAPPER A =====
describe("mapStoreA", () => {
  test("chuyển đổi prod_name → name", () => {
    const input = [{ prod_name: "Áo thun", price: 10 }];
    const result = mapStoreA(input);
    expect(result[0].name).toBe("Áo thun");
  });

  test("chuyển đổi price đúng", () => {
    const input = [{ prod_name: "Áo thun", price: 10 }];
    const result = mapStoreA(input);
    expect(result[0].price).toBe(10);
  });

  test("tự động thêm currency = USD", () => {
    const input = [{ prod_name: "Áo thun", price: 10 }];
    const result = mapStoreA(input);
    expect(result[0].currency).toBe("USD");
  });

  test("tự động thêm source = Store A", () => {
    const input = [{ prod_name: "Áo thun", price: 10 }];
    const result = mapStoreA(input);
    expect(result[0].source).toBe("Store A");
  });

  test("tạo ID đúng định dạng A-1", () => {
    const input = [{ prod_name: "Áo thun", price: 10 }];
    const result = mapStoreA(input);
    expect(result[0].id).toBe("A-1");
  });
});

// ===== TEST MAPPER B =====
describe("mapStoreB", () => {
  test("chuyển đổi item → name", () => {
    const input = [{ item: "Giày Nike", cost: { amt: 50, cur: "USD" } }];
    const result = mapStoreB(input);
    expect(result[0].name).toBe("Giày Nike");
  });

  test("lấy giá từ cost.amt", () => {
    const input = [{ item: "Giày Nike", cost: { amt: 50, cur: "USD" } }];
    const result = mapStoreB(input);
    expect(result[0].price).toBe(50);
  });

  test("lấy currency từ cost.cur", () => {
    const input = [{ item: "Giày Nike", cost: { amt: 50, cur: "USD" } }];
    const result = mapStoreB(input);
    expect(result[0].currency).toBe("USD");
  });

  test("tự động thêm source = Store B", () => {
    const input = [{ item: "Giày Nike", cost: { amt: 50, cur: "USD" } }];
    const result = mapStoreB(input);
    expect(result[0].source).toBe("Store B");
  });

  test("tạo ID đúng định dạng B-1", () => {
    const input = [{ item: "Giày Nike", cost: { amt: 50, cur: "USD" } }];
    const result = mapStoreB(input);
    expect(result[0].id).toBe("B-1");
  });
});

// ===== TEST MERGER =====
describe("mergeStores", () => {
  const dataA = [{ prod_name: "Áo thun", price: 10 }];
  const dataB = [{ item: "Giày Nike", cost: { amt: 50, cur: "USD" } }];

  test("gộp 2 store thành 1 mảng", () => {
    const result = mergeStores(dataA, dataB);
    expect(result.length).toBe(2);
  });

  test("sắp xếp theo giá tăng dần", () => {
    const result = mergeStores(dataA, dataB);
    expect(result[0].price).toBeLessThanOrEqual(result[1].price);
  });

  test("kết quả có đủ 5 fields của Global Schema", () => {
    const result = mergeStores(dataA, dataB);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("name");
    expect(result[0]).toHaveProperty("price");
    expect(result[0]).toHaveProperty("currency");
    expect(result[0]).toHaveProperty("source");
  });

  test("không mất data khi merge", () => {
    const bigA = Array(5).fill({ prod_name: "SP", price: 10 });
    const bigB = Array(5).fill({ item: "Item", cost: { amt: 20, cur: "USD" } });
    const result = mergeStores(bigA, bigB);
    expect(result.length).toBe(10);
  });
});