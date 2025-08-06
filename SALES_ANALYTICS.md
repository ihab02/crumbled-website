# Sales Analytics Dashboard

## Overview
The Sales Analytics Dashboard provides comprehensive insights into business performance, helping administrators make data-driven decisions for inventory management, marketing strategies, and operational improvements.

## Features

### 📊 Revenue Dashboard
- **Total Revenue**: Current period vs previous period with growth percentage
- **Revenue Growth Rate**: Percentage change from previous period
- **Average Order Value (AOV)**: Trends and analysis
- **Revenue by Payment Method**: COD vs Paymob breakdown
- **Revenue by Delivery Zone**: Geographic performance analysis

### 📦 Order Analytics
- **Order Volume**: Trends and patterns over time
- **Order Status Distribution**: Pending, confirmed, delivered, cancelled
- **Order Completion Rate**: Delivered vs total orders percentage
- **Cancellation Rate**: Analysis of cancelled orders
- **Peak Order Times**: Hourly/daily order patterns

### 🍪 Product Performance
- **Top-Selling Flavors**: By revenue and quantity sold
- **Flavor Performance by Size**: Mini, Medium, Large analysis
- **Product Category Performance**: Classic, Premium, Fruit, etc.
- **Stock Turnover Rate**: For each flavor
- **Low Stock Alerts**: With reorder recommendations

### 👥 Customer Insights
- **Customer Acquisition**: New vs returning customers
- **Customer Lifetime Value (CLV)**: Average customer value analysis
- **Customer Segmentation**: By order frequency and value
- **Customer Retention Rate**: Period-over-period analysis
- **Top Customers**: By total spend and order count

### 🚚 Delivery Performance
- **Delivery Zone Performance**: Revenue, order volume, delivery fees
- **Delivery Time Analysis**: Actual vs expected delivery times
- **Zone-wise Delivery Efficiency**: Performance metrics by location

### 🎫 Promotional Analytics
- **Promo Code Performance**: Usage, revenue impact, customer acquisition
- **Discount Analysis**: Total discounts given, impact on AOV
- **Promotional Campaign ROI**: Return on investment analysis

## API Endpoints

### GET `/api/admin/analytics/sales`
Returns comprehensive sales analytics data.

**Query Parameters:**
- `range` (optional): Date range for analysis
  - `this-week`: Current week (starting Sunday)
  - `this-month`: Current month (starting 1st of month)
  - `7d`: Last 7 days
  - `30d`: Last 30 days
  - `90d`: Last 90 days
  - `1y`: Last year
  - `custom`: Custom date range (requires `startDate` and `endDate` parameters)
  - Default: `this-month`
- `startDate` (optional): Start date for custom range (YYYY-MM-DD format)
- `endDate` (optional): End date for custom range (YYYY-MM-DD format)

**Response Structure:**
```typescript
{
  revenue: {
    total: number;
    growth: number;
    averageOrderValue: number;
    byPeriod: Array<{ date: string; revenue: number; orders: number }>;
    byPaymentMethod: Array<{ method: string; revenue: number; percentage: number }>;
    byZone: Array<{ zone: string; revenue: number; orders: number }>;
  };
  orders: {
    total: number;
    growth: number;
    completionRate: number;
    cancellationRate: number;
    byStatus: Array<{ status: string; count: number; percentage: number }>;
    byHour: Array<{ hour: number; orders: number }>;
  };
  products: {
    topSellers: Array<{
      id: number;
      name: string;
      category: string;
      revenue: number;
      quantity: number;
      stockLevel: 'in_stock' | 'low_stock' | 'out_of_stock';
    }>;
    byCategory: Array<{ category: string; revenue: number; orders: number }>;
    stockAlerts: Array<{
      id: number;
      name: string;
      currentStock: number;
      recommendedReorder: number;
    }>;
  };
  customers: {
    total: number;
    newCustomers: number;
    returningCustomers: number;
    averageCLV: number;
    topCustomers: Array<{
      id: number;
      name: string;
      email: string;
      totalSpent: number;
      orderCount: number;
    }>;
  };
  delivery: {
    zonePerformance: Array<{
      zone: string;
      revenue: number;
      orders: number;
      averageDeliveryTime: number;
    }>;
  };
  promotions: {
    totalDiscounts: number;
    promoCodeUsage: Array<{
      code: string;
      usage: number;
      revenueGenerated: number;
    }>;
  };
}
```

## Database Queries

The analytics system uses optimized SQL queries to aggregate data from existing tables:

### Revenue Analytics
- Aggregates from `orders` table
- Calculates growth by comparing with previous periods
- Groups by payment method and delivery zones

### Product Analytics
- Joins `order_items`, `orders`, and `flavors` tables
- Extracts flavor details from JSON stored in `order_items.flavor_details`
- Calculates stock levels and identifies low stock items

### Customer Analytics
- Analyzes customer behavior from `orders` and `customers` tables
- Identifies new vs returning customers
- Calculates Customer Lifetime Value (CLV)

### Delivery Analytics
- Joins `orders` and `zones` tables
- Calculates delivery performance metrics
- Analyzes delivery time efficiency

## Usage

### Accessing the Dashboard
1. Navigate to the admin panel
2. Go to **Analytics & Reports** → **Sales Analytics**
3. Select your desired date range:
   - **Predefined Ranges**: Choose from dropdown (This Week, This Month, Last 7 days, etc.)
   - **Custom Range**: Select "Custom Range" and pick specific start/end dates
   - **Quick Presets**: Use preset buttons for common ranges (Last 7 days, Last 30 days, This month)
4. Explore different tabs for detailed insights

### Key Metrics to Monitor
- **Revenue Growth**: Track business expansion
- **Order Completion Rate**: Monitor operational efficiency
- **Top Products**: Identify best performers
- **Stock Alerts**: Prevent stockouts
- **Customer Retention**: Measure customer satisfaction

### Exporting Data
- Use the "Export Report" button to download analytics data
- Reports can be generated in Excel or PDF format
- Scheduled reports can be set up for regular delivery

## Technical Implementation

### Frontend Components
- **MetricCard**: Displays key performance indicators
- **SimpleChart**: Visualizes data with progress bars
- **StockLevelIndicator**: Shows inventory status
- **Tabs**: Organizes different analytics sections

### Backend Services
- **Date Range Calculation**: Dynamic period analysis
- **Database Aggregation**: Optimized SQL queries
- **Growth Calculations**: Period-over-period comparisons
- **Error Handling**: Graceful failure management

### Performance Considerations
- **Caching**: Analytics data is cached for 30 seconds
- **Database Optimization**: Uses indexed queries
- **Lazy Loading**: Data loads progressively
- **Error Boundaries**: Graceful error handling

## Future Enhancements

### Planned Features
- **Real-time Updates**: WebSocket integration for live data
- **Advanced Charts**: Interactive charts with drill-down capabilities
- **Predictive Analytics**: Sales forecasting and trend prediction
- **Custom Dashboards**: User-configurable analytics views
- **Mobile Optimization**: Enhanced mobile experience
- **Scheduled Reports**: Automated report generation and delivery

### Integration Opportunities
- **Email Notifications**: Alert system for key metrics
- **SMS Alerts**: Critical stock and performance notifications
- **Third-party Analytics**: Google Analytics integration
- **Export APIs**: Integration with external reporting tools

## Security

- **Admin Authentication**: All endpoints require admin authentication
- **Data Privacy**: Customer data is anonymized in analytics
- **Access Control**: Role-based access to analytics features
- **Audit Logging**: All analytics access is logged for security

## Troubleshooting

### Common Issues
1. **No Data Displayed**: Check date range and ensure orders exist
2. **Slow Loading**: Verify database performance and indexes
3. **Authentication Errors**: Ensure admin session is valid
4. **Export Failures**: Check file permissions and disk space

### Debug Mode
Enable debug mode in admin settings to see detailed analytics processing logs.

## Support

For technical support or feature requests, contact the development team or create an issue in the project repository. 