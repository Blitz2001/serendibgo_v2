# Stripe Payment Integration - Testing Guide

## 🧪 Complete Testing Checklist

### 1. Environment Setup ✅

**Backend Environment Variables:**
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Frontend Environment Variables:**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

### 2. Test Cards

| Card Number | Description | Expected Result |
|-------------|-------------|-----------------|
| `4242 4242 4242 4242` | Visa Success | ✅ Payment succeeds |
| `4000 0000 0000 0002` | Card Declined | ❌ Payment fails |
| `4000 0025 0000 3155` | Requires Authentication | 🔐 3D Secure challenge |
| `4000 0000 0000 9995` | Insufficient Funds | ❌ Payment fails |

**Test Card Details:**
- **Expiry:** Any future date (e.g., 12/25)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

### 3. Payment Flow Testing

#### A. Guide Booking Payment Flow
1. **Navigate to:** `/guides`
2. **Select a guide** and click "Book Now"
3. **Fill booking form:**
   - Date: Future date
   - Duration: half-day/full-day/multi-day
   - Group size: 1-5 people
   - Guest information
4. **Submit booking** → Should redirect to `/payment`
5. **Payment page should show:**
   - Guide details
   - Booking dates and duration
   - Group size
   - Pricing breakdown
   - Stripe payment form
6. **Enter test card:** `4242 4242 4242 4242`
7. **Submit payment** → Should redirect to success page
8. **Check email** for payment confirmation

#### B. Tour Booking Payment Flow
1. **Navigate to:** `/tours`
2. **Select a tour** and click "Book Now"
3. **Fill booking form:**
   - Start/End dates
   - Group size
   - Contact information
4. **Submit booking** → Should redirect to `/payment`
5. **Complete payment** with test card
6. **Verify booking confirmation**

#### C. Vehicle Booking Payment Flow
1. **Navigate to:** `/vehicles`
2. **Select a vehicle** and click "Book Now"
3. **Complete booking flow:**
   - Pickup/Dropoff locations
   - Date and time
   - Passenger details
4. **Submit booking** → Should redirect to `/payment`
5. **Complete payment** with test card
6. **Verify booking confirmation**

### 4. Backend API Testing

#### Test Payment Intent Creation
```bash
curl -X POST http://localhost:5000/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "bookingId": "BOOKING_ID",
    "amount": 100,
    "currency": "USD"
  }'
```

#### Test Payment Confirmation
```bash
curl -X POST http://localhost:5000/api/payments/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "paymentIntentId": "pi_test_..."
  }'
```

#### Test Payment Status
```bash
curl -X GET http://localhost:5000/api/payments/status/BOOKING_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Webhook Testing

#### Using Stripe CLI (Recommended)
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:5000/api/payments/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
```

#### Using ngrok for Local Testing
```bash
# Install ngrok
ngrok http 5000

# Use the HTTPS URL in Stripe Dashboard webhook settings
# https://your-ngrok-url.ngrok.io/api/payments/webhook
```

### 6. Database Verification

#### Check Booking Updates
```javascript
// In MongoDB
db.bookings.find({
  paymentStatus: "paid",
  paymentIntentId: { $exists: true }
}).pretty()
```

#### Verify Payment Fields
- `paymentStatus`: Should be "paid"
- `paymentIntentId`: Should contain Stripe payment intent ID
- `amountPaid`: Should match payment amount
- `paymentDate`: Should be set to payment completion time
- `status`: Should be "confirmed"

### 7. Email Testing

#### Check Email Delivery
1. **Complete a successful payment**
2. **Check email inbox** for payment confirmation
3. **Verify email content:**
   - Booking details
   - Payment amount
   - Booking reference
   - Contact information

#### Test Email Templates
- Payment confirmation email
- Payment failure email
- Refund confirmation email

### 8. Admin Panel Testing

#### Refund Management
1. **Navigate to:** `/admin/refunds`
2. **View bookings** with different payment statuses
3. **Test refund process:**
   - Select a paid booking
   - Enter refund amount
   - Add refund reason
   - Process refund
4. **Verify refund:**
   - Booking status updated to "refunded"
   - Refund confirmation email sent
   - Stripe refund processed

### 9. Error Handling Testing

#### Test Payment Failures
1. **Use declined card:** `4000 0000 0000 0002`
2. **Verify error handling:**
   - User sees error message
   - Booking remains in "pending" status
   - No payment confirmation email sent

#### Test Network Issues
1. **Disconnect internet** during payment
2. **Verify graceful handling:**
   - User sees appropriate error
   - No partial payments processed

### 10. Security Testing

#### Authentication
- **Test without token:** Should return 401
- **Test with invalid token:** Should return 401
- **Test with expired token:** Should return 401

#### Authorization
- **Test booking ownership:** Users can only pay for their own bookings
- **Test admin access:** Only admins can access refund management

### 11. Performance Testing

#### Load Testing
```bash
# Test payment intent creation under load
ab -n 100 -c 10 -H "Authorization: Bearer TOKEN" \
  -p payment_data.json \
  http://localhost:5000/api/payments/create-intent
```

#### Response Time Monitoring
- Payment intent creation: < 2 seconds
- Payment confirmation: < 3 seconds
- Webhook processing: < 1 second

### 12. Production Checklist

#### Before Going Live
- [ ] Update to live Stripe keys
- [ ] Set up production webhook endpoint
- [ ] Configure production email settings
- [ ] Test with real payment methods (small amounts)
- [ ] Verify SSL certificate
- [ ] Set up monitoring and logging
- [ ] Test refund process with real cards

#### Monitoring Setup
- [ ] Stripe Dashboard monitoring
- [ ] Application error logging
- [ ] Payment success/failure tracking
- [ ] Email delivery monitoring

## 🐛 Common Issues & Solutions

### Issue: Payment Intent Creation Fails
**Solution:** Check Stripe secret key and booking ID validity

### Issue: Webhook Not Receiving Events
**Solution:** Verify webhook URL and signature verification

### Issue: Email Not Sending
**Solution:** Check email service configuration and credentials

### Issue: Refund Not Processing
**Solution:** Verify Stripe refund permissions and booking status

## 📊 Success Metrics

- **Payment Success Rate:** > 95%
- **Payment Processing Time:** < 5 seconds
- **Email Delivery Rate:** > 98%
- **Refund Processing Time:** < 24 hours
- **Customer Satisfaction:** > 4.5/5

## 🔧 Debugging Tools

### Stripe Dashboard
- View payment intents
- Monitor webhook events
- Check refund status
- View customer data

### Application Logs
```bash
# Backend logs
tail -f backend/logs/app.log

# Payment-specific logs
grep "payment" backend/logs/app.log
```

### Database Queries
```javascript
// Check payment status distribution
db.bookings.aggregate([
  { $group: { _id: "$paymentStatus", count: { $sum: 1 } } }
])
```
