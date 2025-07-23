"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = testConnection;
exports.saveOrder = saveOrder;
exports.getOrders = getOrders;
exports.getOrderDetails = getOrderDetails;
exports.getOrderByTracking = getOrderByTracking;
exports.updateOrderStatus = updateOrderStatus;
var promise_1 = __importDefault(require("mysql2/promise"));
// Create MySQL connection pool
var pool = promise_1.default.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Goodmorning@1',
    database: process.env.DB_NAME || 'crumbled_nextDB',
    waitForConnections: true,
    connectionLimit: 10, // Reduced from 50 to prevent too many connections
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000, // 10 seconds
    idleTimeout: 60000, // 1 minute
    maxIdle: 5 // Maximum number of idle connections to keep
});
// Test connection function
function testConnection() {
    return __awaiter(this, void 0, void 0, function () {
        var connection, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 5]);
                    return [4 /*yield*/, pool.getConnection()];
                case 1:
                    connection = _a.sent();
                    return [4 /*yield*/, connection.query('SELECT NOW() as `current_time`, VERSION() as mysql_version')];
                case 2:
                    result = (_a.sent())[0];
                    return [2 /*return*/, {
                            success: true,
                            message: "Database connected successfully",
                            timestamp: result[0].current_time,
                            version: result[0].mysql_version,
                        }];
                case 3:
                    error_1 = _a.sent();
                    console.error("Database connection failed:", error_1);
                    return [2 /*return*/, {
                            success: false,
                            error: error_1 instanceof Error ? error_1.message : "Unknown connection error",
                        }];
                case 4:
                    if (connection) {
                        connection.release();
                    }
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function saveOrder(orderData) {
    return __awaiter(this, void 0, void 0, function () {
        var connection, tableCheck, orderResult, orderId, _i, _a, item, stockUpdate, _b, _c, bundleItem, stockUpdate, error_2;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 13, 14, 15]);
                    return [4 /*yield*/, pool.getConnection()];
                case 1:
                    connection = _d.sent();
                    return [4 /*yield*/, connection.query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'crumbled_nextDB' AND table_name = 'orders'")];
                case 2:
                    tableCheck = (_d.sent())[0];
                    if (tableCheck[0].count === 0) {
                        return [2 /*return*/, { success: false, error: "Orders table does not exist. Please set up the database first." }];
                    }
                    // Generate tracking ID if not provided
                    if (!orderData.trackingId) {
                        orderData.trackingId = "CC".concat(Math.random().toString(36).substring(2, 10).toUpperCase());
                    }
                    return [4 /*yield*/, connection.query("INSERT INTO orders (\n        customer_name, \n        customer_email, \n        customer_phone, \n        address, \n        city, \n        state, \n        zip_code, \n        total_amount,\n        tracking_id,\n        order_status\n      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')", [
                            orderData.customerName,
                            orderData.customerEmail,
                            orderData.customerPhone,
                            orderData.address,
                            orderData.city,
                            orderData.state,
                            orderData.zipCode,
                            orderData.totalAmount,
                            orderData.trackingId || "CC".concat(Math.random().toString(36).substring(2, 10).toUpperCase())
                        ])];
                case 3:
                    orderResult = (_d.sent())[0];
                    orderId = orderResult.insertId;
                    _i = 0, _a = orderData.items;
                    _d.label = 4;
                case 4:
                    if (!(_i < _a.length)) return [3 /*break*/, 12];
                    item = _a[_i];
                    // Insert order item
                    return [4 /*yield*/, connection.query("INSERT INTO order_items (\n          order_id, \n          product_id, \n          product_name, \n          quantity, \n          price, \n          is_bundle, \n          bundle_size, \n          bundle_items\n        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
                            orderId,
                            item.id,
                            item.name,
                            item.quantity,
                            item.price,
                            !!item.isBundle,
                            item.bundleSize || null,
                            item.bundleItems ? JSON.stringify(item.bundleItems) : null
                        ])];
                case 5:
                    // Insert order item
                    _d.sent();
                    if (!!item.isBundle) return [3 /*break*/, 7];
                    return [4 /*yield*/, connection.query("UPDATE stock \n           SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP\n           WHERE product_id = ?\n           RETURNING quantity", [item.quantity, item.id])];
                case 6:
                    stockUpdate = (_d.sent())[0];
                    // Check if stock went negative (optional warning)
                    if (stockUpdate.length > 0 && stockUpdate[0].quantity < 0) {
                        console.warn("Warning: Stock for product ".concat(item.name, " (ID: ").concat(item.id, ") went negative: ").concat(stockUpdate[0].quantity));
                    }
                    return [3 /*break*/, 11];
                case 7:
                    if (!(item.bundleItems && Array.isArray(item.bundleItems))) return [3 /*break*/, 11];
                    _b = 0, _c = item.bundleItems;
                    _d.label = 8;
                case 8:
                    if (!(_b < _c.length)) return [3 /*break*/, 11];
                    bundleItem = _c[_b];
                    return [4 /*yield*/, connection.query("UPDATE stock \n               SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP\n               WHERE product_id = ?\n               RETURNING quantity, product_name", [item.quantity, bundleItem.id])];
                case 9:
                    stockUpdate = (_d.sent())[0];
                    if (stockUpdate.length > 0 && stockUpdate[0].quantity < 0) {
                        console.warn("Warning: Stock for bundled product ".concat(stockUpdate[0].product_name, " (ID: ").concat(bundleItem.id, ") went negative: ").concat(stockUpdate[0].quantity));
                    }
                    _d.label = 10;
                case 10:
                    _b++;
                    return [3 /*break*/, 8];
                case 11:
                    _i++;
                    return [3 /*break*/, 4];
                case 12: return [2 /*return*/, { success: true, orderId: orderId, trackingId: orderData.trackingId }];
                case 13:
                    error_2 = _d.sent();
                    console.error("Error saving order:", error_2);
                    return [2 /*return*/, { success: false, error: error_2 instanceof Error ? error_2.message : "Database operation failed" }];
                case 14:
                    if (connection) {
                        connection.release();
                    }
                    return [7 /*endfinally*/];
                case 15: return [2 /*return*/];
            }
        });
    });
}
function getOrders() {
    return __awaiter(this, void 0, void 0, function () {
        var connection, tableCheck, orders, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, 5, 6]);
                    return [4 /*yield*/, pool.getConnection()];
                case 1:
                    connection = _a.sent();
                    return [4 /*yield*/, connection.query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'crumbled_nextDB' AND table_name = 'orders'")];
                case 2:
                    tableCheck = (_a.sent())[0];
                    if (tableCheck[0].count === 0) {
                        return [2 /*return*/, { success: false, error: "Orders table does not exist. Please set up the database first." }];
                    }
                    return [4 /*yield*/, connection.query("SELECT * FROM orders ORDER BY created_at DESC")];
                case 3:
                    orders = (_a.sent())[0];
                    return [2 /*return*/, { success: true, orders: orders }];
                case 4:
                    error_3 = _a.sent();
                    console.error("Error fetching orders:", error_3);
                    return [2 /*return*/, { success: false, error: error_3 instanceof Error ? error_3.message : "Database connection failed" }];
                case 5:
                    if (connection) {
                        connection.release();
                    }
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function getOrderDetails(orderId) {
    return __awaiter(this, void 0, void 0, function () {
        var connection, order, items, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, 5, 6]);
                    return [4 /*yield*/, pool.getConnection()];
                case 1:
                    connection = _a.sent();
                    return [4 /*yield*/, connection.query("SELECT * FROM orders WHERE id = ?", [orderId])];
                case 2:
                    order = (_a.sent())[0];
                    if (order.length === 0) {
                        return [2 /*return*/, { success: false, error: "Order not found" }];
                    }
                    return [4 /*yield*/, connection.query("SELECT * FROM order_items WHERE order_id = ?", [orderId])];
                case 3:
                    items = (_a.sent())[0];
                    return [2 /*return*/, { success: true, order: order[0], items: items }];
                case 4:
                    error_4 = _a.sent();
                    console.error("Error fetching order details:", error_4);
                    return [2 /*return*/, { success: false, error: error_4 instanceof Error ? error_4.message : "Database operation failed" }];
                case 5:
                    if (connection) {
                        connection.release();
                    }
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function getOrderByTracking(trackingId, email) {
    return __awaiter(this, void 0, void 0, function () {
        var connection, order, items, processedOrder, processedItems, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, 5, 6]);
                    return [4 /*yield*/, pool.getConnection()];
                case 1:
                    connection = _a.sent();
                    return [4 /*yield*/, connection.query("SELECT o.*, c.email as customer_email \n       FROM orders o \n       JOIN customers c ON o.customer_id = c.id \n       WHERE o.id = ? AND c.email = ?", [trackingId, email])];
                case 2:
                    order = (_a.sent())[0];
                    if (order.length === 0) {
                        return [2 /*return*/, { success: false, error: "Order not found or email doesn't match" }];
                    }
                    return [4 /*yield*/, connection.query("SELECT * FROM order_items WHERE order_id = ?", [order[0].id])];
                case 3:
                    items = (_a.sent())[0];
                    processedOrder = __assign(__assign({}, order[0]), { total: parseFloat(order[0].total_amount || 0), delivery_fee: parseFloat(order[0].delivery_fee || 0), subtotal: parseFloat(order[0].subtotal || 0) });
                    processedItems = items.map(function (item) { return (__assign(__assign({}, item), { price: parseFloat(item.price || 0) })); });
                    return [2 /*return*/, { success: true, order: processedOrder, items: processedItems }];
                case 4:
                    error_5 = _a.sent();
                    console.error("Error fetching order by tracking:", error_5);
                    return [2 /*return*/, { success: false, error: error_5 instanceof Error ? error_5.message : "Database operation failed" }];
                case 5:
                    if (connection) {
                        connection.release();
                    }
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function updateOrderStatus(orderId, status) {
    return __awaiter(this, void 0, void 0, function () {
        var connection, result, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 5]);
                    return [4 /*yield*/, pool.getConnection()];
                case 1:
                    connection = _a.sent();
                    return [4 /*yield*/, connection.query("UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [status, orderId])];
                case 2:
                    result = (_a.sent())[0];
                    return [2 /*return*/, { success: true, message: "Order status updated successfully" }];
                case 3:
                    error_6 = _a.sent();
                    console.error("Error updating order status:", error_6);
                    return [2 /*return*/, { success: false, error: error_6 instanceof Error ? error_6.message : "Database operation failed" }];
                case 4:
                    if (connection) {
                        connection.release();
                    }
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Export the pool as default
exports.default = pool;
