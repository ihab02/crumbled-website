# Crumbled Documentation

This folder contains comprehensive documentation for the Crumbled cookie delivery e-commerce platform. These documents are designed to help AI assistants and developers understand the application's structure, business logic, and implementation details.

## Documentation Files

### 1. [DB_structure.md](./DB_structure.md)
**Purpose**: Complete database schema and relationship documentation

**Contents**:
- Database table structures and relationships
- Field descriptions and data types
- Foreign key relationships and constraints
- Special data flows and business logic
- API endpoint structures
- Security and performance considerations

**Use Cases**:
- Understanding data relationships
- Database queries and modifications
- API development and debugging
- Data migration planning
- Performance optimization

### 2. [Application_Architecture.md](./Application_Architecture.md)
**Purpose**: Overall application architecture and technical implementation

**Contents**:
- Technology stack and frameworks
- Application structure and directory layout
- Core components and their interactions
- API architecture and design patterns
- State management strategies
- Security implementation
- Performance optimizations
- Deployment architecture

**Use Cases**:
- Understanding application structure
- Component development and modification
- API development and integration
- Performance troubleshooting
- Security implementation
- Deployment planning

### 3. [Business_Logic_Workflows.md](./Business_Logic_Workflows.md)
**Purpose**: Business processes, user journeys, and workflow documentation

**Contents**:
- Core business model and revenue streams
- User personas and customer journeys
- Business workflows and processes
- Business rules and constraints
- Data validation rules
- Error handling strategies
- Performance considerations
- Security and compliance requirements
- Debug logging workflows and troubleshooting

**Use Cases**:
- Understanding business requirements
- Feature development and modification
- User experience optimization
- Business logic implementation
- Testing and quality assurance
- Customer support and troubleshooting
- System debugging and monitoring

## How to Use This Documentation

### For AI Assistants

1. **Start with Business Logic**: Read `Business_Logic_Workflows.md` first to understand the core business processes and user journeys.

2. **Understand Architecture**: Review `Application_Architecture.md` to understand the technical implementation and component interactions.

3. **Reference Database Structure**: Use `DB_structure.md` when working with data, queries, or database-related features.

### For Developers

1. **Feature Development**: Use all three documents to understand the complete context before implementing new features.

2. **Bug Fixing**: Reference the relevant documentation based on the issue type:
   - Database issues → `DB_structure.md`
   - UI/Component issues → `Application_Architecture.md`
   - Business logic issues → `Business_Logic_Workflows.md`

3. **Code Reviews**: Use documentation to validate implementation against business requirements and technical standards.

### For New Team Members

1. **Onboarding**: Read all three documents in order to get a complete understanding of the application.

2. **Reference Guide**: Keep these documents as reference material for ongoing development work.

3. **Knowledge Sharing**: Use these documents to explain system behavior and business logic to stakeholders.

## Key Concepts to Understand

### 1. Dual Authentication System
- **Customer Authentication**: NextAuth.js for customer accounts
- **Admin Authentication**: Custom JWT for admin dashboard
- **Guest Orders**: OTP verification for non-registered customers

### 2. Enhanced Data Storage
- **Cached Fields**: Product and flavor data cached at order time for historical preservation
- **JSON Storage**: Flavor details stored as JSON for flexible customization
- **Soft Delete System**: Active_* tables for efficient soft delete implementation
- **Admin Preferences**: Per-user view preferences for admin dashboard

### 3. Performance Considerations
- **Cart Polling Issue**: Current excessive API calls (every few seconds) need optimization
- **Database Indexing**: Optimized queries with proper indexes on frequently accessed fields
- **Caching Strategy**: Cached fields reduce complex joins and improve performance
- **Debug Logging**: Conditional debug mode system with performance optimization

### 2. Product Customization System
- **Base Products**: Cookie packs with predefined configurations
- **Flavor Customization**: Customers select flavors for each position in a pack
- **Pricing Logic**: Base price + flavor adjustments
- **Stock Management**: Real-time stock validation

### 3. Order Processing Workflow
- **Status Flow**: pending → confirmed → preparing → out_for_delivery → delivered
- **Delivery Assignment**: Zone-based delivery with personnel assignment
- **Payment Processing**: Cash on delivery with online payment options

### 4. Zone-Based Delivery System
- **Delivery Zones**: Geographic areas with specific delivery fees
- **Delivery Personnel**: Assigned to specific zones with availability schedules
- **Time Slots**: Fixed delivery windows per zone

### 5. Debug Logging System
- **Conditional Logging**: Debug logs only execute when debug mode is enabled
- **Admin Control**: Debug mode can be toggled via admin settings
- **Performance Optimized**: Caching and conditional execution minimize overhead
- **Multi-level Logging**: Backend and frontend debug capabilities
- **Security**: Debug mode restricted to administrators only

## Common Development Scenarios

### Adding New Features
1. Review business requirements in `Business_Logic_Workflows.md`
2. Understand technical constraints in `Application_Architecture.md`
3. Plan database changes in `DB_structure.md`
4. Implement feature following established patterns

### Debugging Issues
1. Identify issue type (UI, API, Database, Business Logic)
2. Reference appropriate documentation
3. Understand the expected behavior
4. Trace through the relevant workflow
5. Implement fix following established patterns

### Database Changes
1. Review current structure in `DB_structure.md`
2. Understand relationships and constraints
3. Plan migration strategy
4. Update documentation after changes

### API Development
1. Follow patterns in `Application_Architecture.md`
2. Reference database structure in `DB_structure.md`
3. Implement business logic from `Business_Logic_Workflows.md`
4. Follow security and performance guidelines

## Maintenance and Updates

### Keeping Documentation Current
- Update documentation when making significant changes
- Review documentation regularly for accuracy
- Add new sections for new features or workflows
- Remove outdated information

### Version Control
- Include documentation changes in commit messages
- Review documentation changes during code reviews
- Maintain documentation alongside code changes

### Collaboration
- Use documentation for team discussions
- Reference specific sections in issue reports
- Share documentation with stakeholders
- Use documentation for training and onboarding

## Additional Resources

### Related Files
- `package.json`: Dependencies and scripts
- `schema.sql`: Database schema file
- `migrations/`: Database migration files
- `lib/services/`: Business logic services
- `components/`: Reusable React components

### External Resources
- Next.js Documentation: https://nextjs.org/docs
- React Documentation: https://react.dev
- MySQL Documentation: https://dev.mysql.com/doc
- Tailwind CSS Documentation: https://tailwindcss.com/docs

This documentation provides a comprehensive foundation for understanding and working with the Crumbled application. Use it as a reference guide for all development and maintenance activities. 