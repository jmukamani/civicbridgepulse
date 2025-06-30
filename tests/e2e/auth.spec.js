import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can register and login', async ({ page }) => {
    // Go to registration page
    await page.goto('/register');

    // Fill registration form
    await page.fill('[data-testid="name-input"]', 'Test User');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.selectOption('[data-testid="role-select"]', 'citizen');

    // Submit registration
    await page.click('[data-testid="register-button"]');

    // Should show success message
    await expect(page.locator('text=Registration successful')).toBeVisible();

    // For E2E testing, we would typically verify email or manually set user as verified
    // For now, let's go to login
    await page.goto('/login');

    // Fill login form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');

    // Submit login
    await page.click('[data-testid="login-button"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('shows error for invalid login credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');

    await page.click('[data-testid="login-button"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Issue Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'citizen@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('citizen can create an issue', async ({ page }) => {
    // Navigate to issues page
    await page.click('[data-testid="nav-issues"]');
    await expect(page).toHaveURL('/issues');

    // Click create issue button
    await page.click('[data-testid="create-issue-button"]');

    // Fill issue form
    await page.fill('[data-testid="issue-title"]', 'Road needs repair');
    await page.fill('[data-testid="issue-description"]', 'There are potholes on Main Street that need immediate attention');
    await page.selectOption('[data-testid="issue-category"]', 'infrastructure');
    await page.fill('[data-testid="issue-location"]', 'Main Street, Nairobi');

    // Submit issue
    await page.click('[data-testid="submit-issue"]');

    // Should show success message and new issue in list
    await expect(page.locator('text=Issue created successfully')).toBeVisible();
    await expect(page.locator('text=Road needs repair')).toBeVisible();
  });

  test('citizen can view their issues', async ({ page }) => {
    await page.goto('/issues');

    // Should see issues list
    await expect(page.locator('[data-testid="issues-list"]')).toBeVisible();
    
    // Should be able to click on an issue to view details
    await page.click('[data-testid="issue-item"]:first-child');
    await expect(page.locator('[data-testid="issue-details"]')).toBeVisible();
  });
}); 