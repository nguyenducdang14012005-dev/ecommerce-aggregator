// Đây là "hợp đồng chung" mà mọi store phải tuân theo
// Sau khi qua Mediator, TẤT CẢ sản phẩm đều có dạng này

const globalSchema = {
  id:       "string",   // số thứ tự
  name:     "string",   // tên sản phẩm
  price:    "number",   // giá tiền
  currency: "string",   // đơn vị tiền tệ
  source:   "string"    // đến từ store nào
};

module.exports = globalSchema;