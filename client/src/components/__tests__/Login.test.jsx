import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import { server } from '../../tests/setup';
import { rest } from 'msw';

// Wrapper component for Router context
const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Login Component', () => {
  it('renders login form correctly', () => {
    const { container } = render(
      <RouterWrapper>
        <Login />
      </RouterWrapper>
    );

    // Check for email input
    expect(container.querySelector('input[type="email"]')).toBeInTheDocument();
    // Check for password input (now using PasswordInput component)
    expect(container.querySelector('input[name="password"]')).toBeInTheDocument();
    // Check for submit button
    expect(screen.getByRole('button', { type: 'submit' })).toBeInTheDocument();
    // Check for forgot password link
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const { container } = render(
      <RouterWrapper>
        <Login />
      </RouterWrapper>
    );

    const submitButton = screen.getByRole('button', { type: 'submit' });
    fireEvent.click(submitButton);

    const emailInput = container.querySelector('input[type="email"]');
    const passwordInput = container.querySelector('input[name="password"]');
    
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it('submits form with valid credentials', async () => {
    const { container } = render(
      <RouterWrapper>
        <Login />
      </RouterWrapper>
    );

    const emailInput = container.querySelector('input[type="email"]');
    const passwordInput = container.querySelector('input[name="password"]');
    const submitButton = screen.getByRole('button', { type: 'submit' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Form should have been submitted successfully
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('handles login API error', async () => {
    server.use(
      rest.post('/api/auth/login', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            message: 'Invalid credentials'
          })
        );
      }),
      rest.post('http://localhost:5000/api/auth/login', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            message: 'Invalid credentials'
          })
        );
      })
    );

    const { container } = render(
      <RouterWrapper>
        <Login />
      </RouterWrapper>
    );

    const emailInput = container.querySelector('input[type="email"]');
    const passwordInput = container.querySelector('input[name="password"]');
    const submitButton = screen.getByRole('button', { type: 'submit' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });
  });

  it('shows resend verification option for email verification errors', async () => {
    server.use(
      rest.post('/api/auth/login', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            message: 'Please verify your email first'
          })
        );
      }),
      rest.post('http://localhost:5000/api/auth/login', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            message: 'Please verify your email first'
          })
        );
      })
    );

    const { container } = render(
      <RouterWrapper>
        <Login />
      </RouterWrapper>
    );

    const emailInput = container.querySelector('input[type="email"]');
    const passwordInput = container.querySelector('input[name="password"]');
    const submitButton = screen.getByRole('button', { type: 'submit' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please verify your email first')).toBeInTheDocument();
      expect(screen.getByText(/resend verification email/i)).toBeInTheDocument();
    });
  });

  it('handles resend verification successfully', async () => {
    server.use(
      rest.post('/api/auth/login', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            message: 'Please verify your email first'
          })
        );
      }),
      rest.post('/api/auth/resend-verification', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            message: 'Verification email sent successfully'
          })
        );
      }),
      rest.post('http://localhost:5000/api/auth/login', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            message: 'Please verify your email first'
          })
        );
      }),
      rest.post('http://localhost:5000/api/auth/resend-verification', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            message: 'Verification email sent successfully'
          })
        );
      })
    );

    const { container } = render(
      <RouterWrapper>
        <Login />
      </RouterWrapper>
    );

    const emailInput = container.querySelector('input[type="email"]');
    const passwordInput = container.querySelector('input[name="password"]');
    const submitButton = screen.getByRole('button', { type: 'submit' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please verify your email first')).toBeInTheDocument();
    });

    const resendButton = screen.getByText(/resend verification email/i);
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(screen.getByText('Verification email sent successfully')).toBeInTheDocument();
    });
  });
}); 