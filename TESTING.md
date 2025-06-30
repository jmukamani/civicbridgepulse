# Testing Guide for CivicBridgePulse Kenya

This guide covers the comprehensive testing setup for the CivicBridgePulse Kenya platform, including unit tests, integration tests, component tests, and end-to-end tests.

## Overview

Our testing strategy includes:

- **Backend Testing**: Unit tests for models and utilities, integration tests for API endpoints
- **Frontend Testing**: Component tests for React components, integration tests with API mocking
- **End-to-End Testing**: Full user journey testing with Playwright
- **Database Testing**: Isolated test database for safe testing

## Setup

### Prerequisites

1. Node.js (v18 or higher)
2. PostgreSQL database
3. Test database setup

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Install Playwright browsers:
```bash
npx playwright install
```

3. Create test database:
```sql
CREATE DATABASE civicbridge_test;
```

4. Create `.env.test` file in the `server` directory:
```env
NODE_ENV=test
PORT=5001
CLIENT_URL=http://localhost:5173

JWT_SECRET=test_jwt_secret_key_for_testing_only

# Test Database Configuration
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=civicbridgepulse_test

# Test Email Configuration
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=test@example.com
EMAIL_PASS=testpassword
EMAIL_FROM="CivicBridgePulse Test <test@example.com>"
```

**Important for Windows Users:** 
- Update `DB_USER` and `DB_PASSWORD` to match your PostgreSQL configuration
- If PostgreSQL is installed locally, the default user is usually `postgres`
- Make sure PostgreSQL service is running

## Backend Testing

### Running Backend Tests

```bash
# Run all backend tests
npm run test:server

# Run tests in watch mode
npm run test:server:watch

# Run with coverage
npm run test:server:coverage

# Run only unit tests
cd server && npm run test:unit

# Run only integration tests
cd server && npm run test:integration
```

### Test Structure

```
server/
├── tests/
│   ├── setup.js                    # Test environment setup
│   │   └── models/
│   │       └── User.test.js         # Model unit tests
│   └── integration/
│       ├── auth.test.js             # Authentication API tests
│       └── issues.test.js           # Issues API tests
├── jest.config.js                  # Jest configuration
└── .babelrc                        # Babel configuration
```

### Writing Backend Tests

#### Unit Test Example (Model Testing):
```javascript
import User from '../../../src/models/User.js';

describe('User Model', () => {
  it('should create a user with valid data', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: await bcrypt.hash('password123', 10),
      role: 'citizen'
    };

    const user = await User.create(userData);
    expect(user.id).toBeDefined();
    expect(user.name).toBe('John Doe');
  });
});
```

#### Integration Test Example (API Testing):
```javascript
import request from 'supertest';
import app from '../../src/app.js';

describe('POST /api/auth/register', () => {
  it('should register a new user successfully', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'citizen'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.message).toContain('Registration successful');
  });
});
```

## Frontend Testing

### Running Frontend Tests

```bash
# Run all frontend tests
npm run test:client

# Run tests in watch mode
npm run test:client:watch

# Run with coverage
npm run test:client:coverage
```

### Test Structure

```
client/
├── src/
│   ├── components/
│   │   └── __tests__/
│   │       ├── Login.test.jsx        # Component tests
│   │       └── IssueForm.test.jsx
│   └── tests/
│       └── setup.js                  # Test setup with MSW
├── jest.config.js                   # Jest configuration
└── babel.config.js                  # Babel configuration
```

### Writing Frontend Tests

#### Component Test Example:
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../Login';

describe('Login Component', () => {
  it('renders login form correctly', () => {
    render(<Login />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
```

#### API Mocking with MSW:
```javascript
// In setup.js
import { setupServer } from 'msw/node';
import { rest } from 'msw';

export const server = setupServer(
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(ctx.json({ token: 'mock-jwt-token' }));
  })
);
```

## End-to-End Testing

### Running E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific test file
npx playwright test auth.spec.js
```

### Test Structure

```
tests/
├── e2e/
│   ├── auth.spec.js                 # Authentication flow tests
│   └── issues.spec.js               # Issue management tests
└── playwright.config.js             # Playwright configuration
```

### Writing E2E Tests

```javascript
import { test, expect } from '@playwright/test';

test('user can create an issue', async ({ page }) => {
  await page.goto('/login');
  
  // Login
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'password123');
  await page.click('[data-testid="login-button"]');
  
  // Navigate to issues
  await page.click('[data-testid="nav-issues"]');
  
  // Create issue
  await page.click('[data-testid="create-issue-button"]');
  await page.fill('[data-testid="issue-title"]', 'Test Issue');
  await page.fill('[data-testid="issue-description"]', 'Test Description');
  await page.click('[data-testid="submit-issue"]');
  
  // Verify
  await expect(page.locator('text=Issue created successfully')).toBeVisible();
});
```

## Running All Tests

```bash
# Run all tests (backend + frontend + e2e)
npm run test:all

# Run backend and frontend tests only
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage reports
npm run test:coverage
```

## Test Data Management

### Database Testing

- Each test run uses a fresh database state
- Tests are isolated and don't affect each other
- Database is reset between test suites

### Test Utilities

The backend tests include helpful utilities:

```javascript
// Create test user
const user = await global.testUtils.createTestUser({
  email: 'test@example.com',
  role: 'citizen'
});

// Generate JWT token
const token = global.testUtils.generateTestToken(user);
```

## Continuous Integration

### GitHub Actions Setup

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: civicbridge_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm run install:all
        
      - name: Run backend tests
        run: npm run test:server
        env:
          NODE_ENV: test
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: civicbridge_test
          DB_USER: postgres
          DB_PASSWORD: postgres
          
      - name: Run frontend tests
        run: npm run test:client
        
      - name: Install Playwright
        run: npx playwright install
        
      - name: Run E2E tests
        run: npm run test:e2e
```

## Best Practices

### Backend Testing

1. **Isolation**: Each test should be independent
2. **Database**: Use transactions or reset between tests
3. **Mocking**: Mock external services (email, payments)
4. **Coverage**: Aim for >80% code coverage
5. **Naming**: Use descriptive test names

### Frontend Testing

1. **User-Centric**: Test user interactions, not implementation details
2. **Accessibility**: Include accessibility tests
3. **API Mocking**: Mock API calls for predictable tests
4. **Components**: Test components in isolation
5. **Integration**: Test component interactions

### E2E Testing

1. **Real Scenarios**: Test complete user journeys
2. **Data Setup**: Use consistent test data
3. **Stability**: Make tests resilient to timing issues
4. **Coverage**: Focus on critical user paths
5. **Environment**: Run in production-like environment

## Debugging Tests

### Backend Debugging

```bash
# Run single test file
npm test -- --testNamePattern="User Model"

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Frontend Debugging

```bash
# Run with verbose output
npm test -- --verbose

# Debug in browser
npm test -- --watch --no-coverage
```

### E2E Debugging

```bash
# Run in headed mode
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Generate trace
npx playwright test --trace on
```

## Code Coverage

Coverage reports are generated in:
- `server/coverage/` - Backend coverage
- `client/coverage/` - Frontend coverage

View HTML reports by opening `coverage/lcov-report/index.html` in your browser.

## Windows-Specific Setup

### 1. Environment Variables

If you encounter `'NODE_ENV' is not recognized` error, the cross-env package handles this automatically. If you still have issues:

**PowerShell:**
```powershell
$env:NODE_ENV="test"; npm test
```

**Command Prompt:**
```cmd
set NODE_ENV=test && npm test
```

### 2. PostgreSQL Setup

For Windows PostgreSQL installation:

1. **Install PostgreSQL**: Download from https://www.postgresql.org/download/windows/
2. **Default credentials**: Usually `postgres` user with password set during installation
3. **Create test database**:
   ```sql
   -- Connect as postgres user
   psql -U postgres
   
   -- Create test database
   CREATE DATABASE civicbridgepulse_test;
   
   -- Grant permissions
   GRANT ALL PRIVILEGES ON DATABASE civicbridgepulse_test TO postgres;
   ```

4. **Update .env.test**:
   ```env
   DB_USER=postgres
   DB_PASSWORD=your_installation_password
   DB_HOST=localhost
   DB_NAME=civicbridgepulse_test
   ```

### 3. Common Windows Issues

- **Path separators**: Use forward slashes `/` in file paths, even on Windows
- **Long paths**: Enable long path support if encountering path length issues
- **Firewall**: Ensure PostgreSQL port (5432) is accessible
- **Services**: Make sure PostgreSQL service is running (services.msc)

## Common Issues

### Database Connection Issues
- Ensure test database exists
- Check connection credentials in `.env.test`
- Verify PostgreSQL is running
- For Windows: Check PostgreSQL service status

### Port Conflicts
- Make sure ports 3000 (client) and 5000 (server) are available
- Update `playwright.config.js` if using different ports
- For Windows: Use `netstat -ano | findstr :5000` to check port usage

### Module Resolution
- Ensure all test dependencies are installed
- Check import paths in test files
- Verify babel configuration for ES modules
- For Windows: Ensure Node.js and npm are properly installed

## Adding New Tests

1. **Backend**: Add to `server/tests/` following the existing structure
2. **Frontend**: Add to `client/src/components/__tests__/` or relevant component directories
3. **E2E**: Add to `tests/e2e/` with descriptive filenames

Remember to update this documentation when adding new testing patterns or tools! 