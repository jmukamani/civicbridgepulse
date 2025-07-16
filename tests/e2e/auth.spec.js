import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can register and login', async ({ page }) => {
    // Go to registration page
    await page.goto('http://localhost:5173/register');

    // Use a unique email for each test run
    const uniqueEmail = `testuser_${Date.now()}@example.com`;

    // Fill registration form
    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="email"]', uniqueEmail);
    await page.fill('[name="password"]', 'password123');
    await page.fill('[name="county"]', 'Nairobi');
    await page.selectOption('[name="role"]', 'citizen');

    // Submit registration
    await page.click('button:has-text("Register")');

    
    // Continue with the rest of the test if registration succeeded
    // Wait for navigation to login page
    await page.waitForURL('**/login');

    // Check for the success message on the login page
    await expect(page.locator('p.text-green-600')).toHaveText('Registration successful, please check your email');


    // Auto-verify the user via backend test endpoint
    await page.request.post('http://localhost:5000/api/users/verify-test-user', {
      data: { email: uniqueEmail }
    });

    // Add a short wait to allow backend/frontend to sync
    await page.waitForTimeout(1000);

    // Wait for page to be stable
    await page.waitForLoadState('networkidle');

    // Ensure we're on the login page and form is ready
    await expect(page).toHaveURL('http://localhost:5173/login');
    
    // Wait for any Toastify notifications to disappear completely
    await page.waitForFunction(() => {
      const toasts = document.querySelectorAll('.Toastify__toast');
      return toasts.length === 0;
    }, { timeout: 15000 });

    // Additional wait for any animations to complete
    await page.waitForTimeout(500);

    // Wait for the email input to be ready for interaction (using placeholder selector)
    await page.waitForSelector('input[placeholder="Enter your email"]', { state: 'visible' });

    // Fill the form fields using placeholder selectors
    await page.fill('input[placeholder="Enter your email"]', uniqueEmail);
    await page.fill('input[placeholder="Enter your password"]', 'password123');
    await page.click('button:has-text("Login")');

    // Should redirect to dashboard
    await expect(page).toHaveURL('http://localhost:5173/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('shows error for invalid login credentials', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    // Updated selectors to use placeholder instead of name
    await page.fill('input[placeholder="Enter your email"]', 'invalid@example.com');
    await page.fill('input[placeholder="Enter your password"]', 'wrongpassword');
    await page.click('button:has-text("Login")');
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL('http://localhost:5173/login');
  });
});

test.describe('Issue Management', () => {
  test.beforeEach(async ({ page }) => {
    // Create and verify a test user for login
    const testEmail = `testuser_${Date.now()}@example.com`;
    
    // Go to registration page
    await page.goto('http://localhost:5173/register');
    
    // Fill registration form
    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="password"]', 'password123');
    await page.fill('[name="county"]', 'Nairobi');
    await page.selectOption('[name="role"]', 'citizen');
    
    // Submit registration
    await page.click('button:has-text("Register")');
    
    // Wait for navigation to login page
    await page.waitForURL('**/login');
    
    // Auto-verify the user via backend test endpoint
    await page.request.post('http://localhost:5000/api/users/verify-test-user', {
      data: { email: testEmail }
    });
    
    // Wait for any toast notifications to disappear
    await page.waitForFunction(() => {
      const toasts = document.querySelectorAll('.Toastify__toast');
      return toasts.length === 0;
    }, { timeout: 15000 });
    
    // Login with the verified user
    await page.fill('input[placeholder="Enter your email"]', testEmail);
    await page.fill('input[placeholder="Enter your password"]', 'password123');
    await page.click('button:has-text("Login")');
    await page.waitForURL('http://localhost:5173/dashboard');
  });

  test('citizen can create an issue', async ({ page }) => {
    // Navigate to issues page
    await page.click('a:has-text("Issues")');
    await expect(page).toHaveURL('http://localhost:5173/dashboard/issues');


    // Fill issue form
    await page.fill('[name="title"]', 'Road needs repair');
    await page.fill('[name="description"]', 'There are potholes on Main Street that need immediate attention');
    await page.selectOption('[name="category"]', 'infrastructure');
    await page.fill('[name="location"]', 'Main Street, Nairobi');

    // Submit issue
    await page.click('button:has-text("Report Issue")');

    // Should show success message and new issue in list
    await expect(page.locator('text=Issue reported successfully')).toBeVisible({ timeout: 10000 });;
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Road needs repair')).toBeVisible();
  });

  test('citizen can view their issues', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard/issues');
  });
}); 