Implement this complete checkout flow. The flow must support both registered users and guest users with the following logic:

1. **Start Checkout**:
   - Accepts a cart ID.
   - If a JWT token is provided, identify the registered user and fetch their saved addresses.
   - If no token is provided, collect guest name, mobile number, and address.

2. **For Guest Users**:
   - Send an OTP to the mobile number (use a mock or placeholder for now).
   - Require OTP verification before proceeding to order confirmation.

3. **Address Handling**:
   - For registered users, show an option to select a saved address or enter a new one.
   - For guest users, save the provided address temporarily with the order.

4. **Cart Validation**:
   - Validate that all items in the cart are in stock.
   - Calculate subtotal, delivery fee (based on zone), and total.

5. **Payment Options**:
   - Show two options: 
     - "Cash on Delivery"
     - "Paymob" (use placeholder function to simulate generating payment token and redirect URL)

6. **Confirm Order**:
   - If payment method is COD: save the order with `payment_status = "Pending"`.
   - If payment method is Paymob: save the order as `Unpaid`, return the redirect URL, and wait for webhook.
   - Save `orders`, `order_items`, and deduct stock if payment is successful.

7. **Paymob Webhook**:
   - Create an endpoint `/payment/callback` to receive payment confirmation.
   - Validate request (assume a secure hash or token).
   - Update `orders.payment_status = "Paid"` based on Paymob's response.

Create routes like:
- `POST /checkout/start`
- `POST /checkout/otp`
- `POST /checkout/confirm`
- `POST /checkout/payment`
- `POST /payment/callback`

Use async/await and modular structure. Assume MySQL table structure is already defined (e.g., `orders`, `order_items`, `customer`, `cart`, `zone`). Return meaningful JSON responses in every step.

