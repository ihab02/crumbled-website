# Contact Feature Documentation

## Overview
The contact feature allows customers to send messages through a contact form, which are stored in the database and can be managed through the admin panel.

## Components

### 1. Contact Form (`/contact`)
- **Location**: `app/contact/page.tsx`
- **Features**:
  - Clean, centered form design matching the web app theme
  - Form validation (required fields, email format)
  - Success/error toast notifications
  - Responsive design
  - Form resets after successful submission

### 2. Contact API (`/api/contact`)
- **Location**: `app/api/contact/route.ts`
- **Features**:
  - POST endpoint for form submissions
  - Input validation
  - Database storage
  - Error handling

### 3. Admin Messages Page (`/admin/messages`)
- **Location**: `app/admin/messages/page.tsx`
- **Features**:
  - View all contact messages
  - Mark messages as read/unread
  - Pagination support
  - Message detail modal
  - Reply via email functionality
  - Visual indicators for unread messages

### 4. Admin Messages API (`/api/admin/messages`)
- **Location**: `app/api/admin/messages/route.ts`
- **Features**:
  - GET: Fetch messages with pagination
  - PATCH: Update message read status

## Database Schema

### contact_messages Table
```sql
CREATE TABLE contact_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Usage

### For Customers
1. Navigate to `/contact`
2. Fill out the contact form
3. Submit the form
4. Receive confirmation toast

### For Administrators
1. Navigate to `/admin/messages`
2. View all incoming messages
3. Click on a message to view details
4. Mark messages as read/unread
5. Reply to customers via email

## Styling
- Uses the web app's pink/rose color scheme
- Consistent with existing design patterns
- Responsive design for mobile and desktop
- Smooth animations and transitions

## Security
- Input validation on both client and server
- SQL injection protection through parameterized queries
- Email format validation
- Required field validation

## Testing
- Test script available at `scripts/test-contact-api.js`
- Can be used to verify API functionality
- Manual testing through the web interface

## Migration
The database migration is located at `migrations/add_contact_messages.sql` and should be run to create the necessary table. 