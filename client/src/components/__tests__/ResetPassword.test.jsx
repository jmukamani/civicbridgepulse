import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ResetPassword from '../ResetPassword';
import { server } from '../../tests/setup';
import { rest } from 'msw';

// Mock useSearchParams
const mockSearchParams = new URLSearchParams('?token=valid-token');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [mockSearchParams],
  useNavigate: () => jest.fn()
}));

// Wrapper component for Router context
const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('ResetPassword Component', () => {
  beforeEach(() => {
    // Reset mock search params
    mockSearchParams.set('token', 'valid-token');
  });

  it('renders reset password form correctly with valid token', () => {
    render(
      <RouterWrapper>
        <ResetPassword />
      </RouterWrapper>
    );

    expect(screen.getByText(/reset password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter new password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument();
    expect(screen.getByRole('button', { type: 'submit' })).toBeInTheDocument();
  });

  it('shows error for missing token', () => {
    mockSearchParams.delete('token');
    
    render(
      <RouterWrapper>
        <ResetPassword />
      </RouterWrapper>
    );

    expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument();
    expect(screen.getByText(/request new reset link/i)).toBeInTheDocument();
  });

  it('validates password confirmation match', async () => {
    render(
      <RouterWrapper>
        <ResetPassword />
      </RouterWrapper>
    );

    const newPasswordInput = screen.getByPlaceholderText('Enter new password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
    const submitButton = screen.getByRole('button', { type: 'submit' });

    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords must match/i)).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    render(
      <RouterWrapper>
        <ResetPassword />
      </RouterWrapper>
    );

    const newPasswordInput = screen.getByPlaceholderText('Enter new password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
    const submitButton = screen.getByRole('button', { type: 'submit' });

    fireEvent.change(newPasswordInput, { target: { value: '123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
    });
  });

  it('submits form with valid passwords', async () => {
    server.use(
      rest.post('/api/auth/reset-password', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            message: 'Password reset successful'
          })
        );
      }),
      rest.post('http://localhost:5000/api/auth/reset-password', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            message: 'Password reset successful'
          })
        );
      })
    );

    render(
      <RouterWrapper>
        <ResetPassword />
      </RouterWrapper>
    );

    const newPasswordInput = screen.getByPlaceholderText('Enter new password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
    const submitButton = screen.getByRole('button', { type: 'submit' });

    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(newPasswordInput.value).toBe('newpassword123');
      expect(confirmPasswordInput.value).toBe('newpassword123');
    });
  });

  it('handles API error', async () => {
    server.use(
      rest.post('/api/auth/reset-password', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            message: 'Invalid or expired token'
          })
        );
      }),
      rest.post('http://localhost:5000/api/auth/reset-password', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            message: 'Invalid or expired token'
          })
        );
      })
    );

    render(
      <RouterWrapper>
        <ResetPassword />
      </RouterWrapper>
    );

    const newPasswordInput = screen.getByPlaceholderText('Enter new password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
    const submitButton = screen.getByRole('button', { type: 'submit' });

    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid or expired token')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    server.use(
      rest.post('/api/auth/reset-password', (req, res, ctx) => {
        return new Promise(resolve => 
          setTimeout(() => resolve(
            res(ctx.status(200), ctx.json({ message: 'Password reset successful' }))
          ), 100)
        );
      }),
      rest.post('http://localhost:5000/api/auth/reset-password', (req, res, ctx) => {
        return new Promise(resolve => 
          setTimeout(() => resolve(
            res(ctx.status(200), ctx.json({ message: 'Password reset successful' }))
          ), 100)
        );
      })
    );

    render(
      <RouterWrapper>
        <ResetPassword />
      </RouterWrapper>
    );

    const newPasswordInput = screen.getByPlaceholderText('Enter new password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
    const submitButton = screen.getByRole('button', { type: 'submit' });

    fireEvent.change(newPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Resetting...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
}); 