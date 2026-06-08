                            E-Commerce Aggregator
    A unified API that aggregates product data from two heterogeneous store APIs into a single normalized JSON output using the GAV Mediator/Wrapper architecture.
*Hệ thống giải quyết bài toán tích hợp dữ liệu dị cấu trúc từ 2 nguồn:
•	Store A — flat schema: { "prod_name": "...", "price": 10 }
•	Store B — nested schema: { "item": "...", "cost": { "amt": 10, "cur": "USD" } }
Thông qua kiến trúc Mediator/Wrapper (GAV), hệ thống chuẩn hóa về Global Schema thống nhất:
{
  "id": "A-1",
  "name": "Áo thun trắng",
  "price": 10,
  "currency": "USD",
  "source": "Store A"
}

*Cài đặt và  Chạy
Yêu cầu
•	Node.js v14+
•	npm v6+


*Cài đặt
chay may chu 
node server.js
 Máy chủ chẻ tại:http://localhost:3000


*Chạy Kiểm thử đơn vị
npm test

*cấu trúc thư mục 
ecommerce-aggregator/
├── server.js                      # Entry point — REST API server
├── package.json                   # Dependencies & scripts
├── package-lock.json              # Lock file
├── index.html                     # Frontend Dashboard
├── mediator.test.js               # Unit tests — mapperA, mapperB, merger
├── data/
│   ├── storeA.json                # Nguồn dữ liệu Store A (flat schema)
│   └── storeB.json                # Nguồn dữ liệu Store B (nested schema)
├── mediator/
│   ├── mapperA.js                 # Wrapper: Store A → Global Schema
│   ├── mapperB.js                 # Wrapper: Store B → Global Schema
│   ├── merger.js                  # Mediator: gộp 2 nguồn, sort theo giá
│   ├── conflictResolver.js        # Xử lý xung đột instance-level
│   └── globalSchema.js            # Định nghĩa Global Schema (GAV)
└── README.md

*Quy tắc lập bản đồ (GAV)
Global Schema	            Store A	                    Store B
id	                        "A-" + index	            "B-" + index
name	                    prod_name	                 item
price	                    price	                     cost.amt
currency	                "USD" (default)	             cost.cur
source	                    "Store A"	                 "Store B"

*Các điểm cuối API
Điểm cuối thống nhất
GET /api/products
Tham số (Param)	            Giá trị / Kiểu dữ liệu	                    Mô tả
source	               storeA / storeB	                     Lọc kết quả theo nguồn cửahàng
sort	        price_asc / price_desc / name_asc / name_desc Sắp xếp tăng dần/giảm dần theo giá hoặc tên
search	                string	                                    Tìm kiếm sản phẩm theo tên
minPrice	            number	                                Lọc theo mức giá tối thiểu
maxPrice	            number	                                    Lọc theo mức giá tối đa
page	                number	            Trang hiện tại dùng cho phân trang (mặc định: 1)
limit	                number	        Số lượng kết quả hiển thị trên mỗi trang (mặc định: 50)



*Dữ liệu thô
GET /api/store-a/raw
GET /api/store-b/raw


*Lược đồ và Thống kê
GET /api/schema
GET /api/stats
GET /api/lav/mappings

*Giải quyết xung đột
GET /api/conflicts?strategy=lowest_price
Chiến lược (Strategy)	                            Mô tả nghiệp vụ
lowest_price	                            Giữ sản phẩm có mức giá thấp hơn
highest_price	                            Giữ sản phẩm có mức giá cao hơn
store_a_wins	                            Ưu tiên lấy dữ liệu của Store A
store_b_wins	                            Ưu tiên lấy dữ liệu của Store B
merge_avg	                            Gộp chung và tính mức giá trung bình của cả hai cửa hàng

*Hoạt động CRUD
POST   /api/store-a/add
POST   /api/store-b/add
DELETE /api/store-a/:index
DELETE /api/store-b/:index
POST   /api/reset

*Hệ thống kiến ​​trúc
Store A (flat JSON)   →   mapperA.js   →  ↘
                                           merger.js  →  GET /api/products
Store B (nested JSON) →   mapperB.js   →  ↗

Dựa trên lý thuyết Mediator/Wrapper (Özsu & Valduriez, Sect. 1.6.4) và cách tiếp cận GAV — Global As View (Sect. 7.1.4, 7.2.3).

