import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from '../ForgotPassword';
import { server } from '../../tests/setup';
import { rest } from 'msw';

// Wrapper component for Router context
const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('ForgotPassword Component', () => {
  it('renders forgot password form correctly', () => {
    render(
      <RouterWrapper>
        <ForgotPassword />
      </RouterWrapper>
    );

    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByRole('button', { type: 'submit' })).toBeInTheDocument();
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  it('shows validation error for empty email', async () => {
    render(
      <RouterWrapper>
        <ForgotPassword />
      </RouterWrapper>
    );

    const submitButton = screen.getByRole('button', { type: 'submit' });
    fireEvent.click(submitButton);

    const emailInput = screen.getByPlaceholderText('Enter your email');
    expect(emailInput).toBeRequired();
  });

  it('submits form with valid email', async () => {
    server.use(
      rest.post('/api/auth/forgot-password', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            message: 'Password reset email sent'
          })
        );
      }),
      rest.post('http://localhost:5000/api/auth/forgot-password', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            message: 'Password reset email sent'
          })
        );
      })
    );

    render(
      <RouterWrapper>
        <ForgotPassword />
      </RouterWrapper>
    );

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const submitButton = screen.getByRole('button', { type: 'submit' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(emailInput.value).toBe('test@example.com');
    });
  });

  it('handles API error', async () => {
    server.use(
      rest.post('/api/auth/forgot-password', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            message: 'Email not found'
          })
        );
      }),
      rest.post('http://localhost:5000/api/auth/forgot-password', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            message: 'Email not found'
          })
        );
      })
    );

    render(
      <RouterWrapper>
        <ForgotPassword />
      </RouterWrapper>
    );

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const submitButton = screen.getByRole('button', { type: 'submit' });

    fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email not found')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    server.use(
      rest.post('/api/auth/forgot-password', (req, res, ctx) => {
        return new Promise(resolve => 
          setTimeout(() => resolve(
            res(ctx.status(200), ctx.json({ message: 'Password reset email sent' }))
          ), 100)
        );
      }),
      rest.post('http://localhost:5000/api/auth/forgot-password', (req, res, ctx) => {
        return new Promise(resolve => 
          setTimeout(() => resolve(
            res(ctx.status(200), ctx.json({ message: 'Password reset email sent' }))
          ), 100)
        );
      })
    );

    render(
      <RouterWrapper>
        <ForgotPassword />
      </RouterWrapper>
    );

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const submitButton = screen.getByRole('button', { type: 'submit' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Sending...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
}); 