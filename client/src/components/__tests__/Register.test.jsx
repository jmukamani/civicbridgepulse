import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../Register';
import { server } from '../../tests/setup';
import { rest } from 'msw';

// Wrapper component for Router context
const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Register Component', () => {
  it('renders registration form correctly', () => {
    render(
      <RouterWrapper>
        <Register />
      </RouterWrapper>
    );

    expect(screen.getByText(/register/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Choose a strong password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Nairobi, Kiambu, etc.')).toBeInTheDocument();
    expect(screen.getByText(/privacy policy/i)).toBeInTheDocument();
  });

  it('shows validation error for privacy policy agreement', async () => {
    render(
      <RouterWrapper>
        <Register />
      </RouterWrapper>
    );

    const submitButton = screen.getByRole('button', { type: 'submit' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/you must agree to the privacy policy/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for password mismatch', async () => {
    render(
      <RouterWrapper>
        <Register />
      </RouterWrapper>
    );

    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const passwordInput = screen.getByPlaceholderText('Choose a strong password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
    const countyInput = screen.getByPlaceholderText('e.g. Nairobi, Kiambu, etc.');
    const privacyCheckbox = screen.getByRole('checkbox');
    const submitButton = screen.getByRole('button', { type: 'submit' });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });
    fireEvent.change(countyInput, { target: { value: 'Nairobi' } });
    fireEvent.click(privacyCheckbox);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords must match/i)).toBeInTheDocument();
    });
  });

  it('opens privacy policy modal when link is clicked', () => {
    render(
      <RouterWrapper>
        <Register />
      </RouterWrapper>
    );

    const privacyPolicyLink = screen.getByText(/view privacy policy/i);
    fireEvent.click(privacyPolicyLink);

    expect(screen.getByText(/CivicBridgePulse Kenya Privacy Policy/i)).toBeInTheDocument();
  });

  it('submits form with valid data and privacy policy agreement', async () => {
    server.use(
      rest.post('/api/auth/register', (req, res, ctx) => {
        return res(
          ctx.status(201),
          ctx.json({
            message: 'Registration successful. Check your email for verification link.'
          })
        );
      }),
      rest.post('http://localhost:5000/api/auth/register', (req, res, ctx) => {
        return res(
          ctx.status(201),
          ctx.json({
            message: 'Registration successful. Check your email for verification link.'
          })
        );
      })
    );

    render(
      <RouterWrapper>
        <Register />
      </RouterWrapper>
    );

    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const passwordInput = screen.getByPlaceholderText('Choose a strong password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
    const countyInput = screen.getByPlaceholderText('e.g. Nairobi, Kiambu, etc.');
    const privacyCheckbox = screen.getByRole('checkbox');
    const submitButton = screen.getByRole('button', { type: 'submit' });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.change(countyInput, { target: { value: 'Nairobi' } });
    fireEvent.click(privacyCheckbox);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(nameInput.value).toBe('John Doe');
      expect(emailInput.value).toBe('john@example.com');
      expect(passwordInput.value).toBe('password123');
      expect(confirmPasswordInput.value).toBe('password123');
      expect(countyInput.value).toBe('Nairobi');
      expect(privacyCheckbox.checked).toBe(true);
    });
  });

  it('handles API error during registration and shows resend option', async () => {
    server.use(
      rest.post('/api/auth/register', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            message: 'Email already exists'
          })
        );
      }),
      rest.post('http://localhost:5000/api/auth/register', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            message: 'Email already exists'
          })
        );
      })
    );

    render(
      <RouterWrapper>
        <Register />
      </RouterWrapper>
    );

    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const passwordInput = screen.getByPlaceholderText('Choose a strong password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
    const countyInput = screen.getByPlaceholderText('e.g. Nairobi, Kiambu, etc.');
    const privacyCheckbox = screen.getByRole('checkbox');
    const submitButton = screen.getByRole('button', { type: 'submit' });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.change(countyInput, { target: { value: 'Nairobi' } });
    fireEvent.click(privacyCheckbox);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
      expect(screen.getByText(/resend verification email/i)).toBeInTheDocument();
    });
  });

  it('handles resend verification successfully', async () => {
    server.use(
      rest.post('/api/auth/register', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            message: 'Email already exists'
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
      rest.post('http://localhost:5000/api/auth/register', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            message: 'Email already exists'
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

    render(
      <RouterWrapper>
        <Register />
      </RouterWrapper>
    );

    const nameInput = screen.getByPlaceholderText('Enter your full name');
    const emailInput = screen.getByPlaceholderText('Enter your email address');
    const passwordInput = screen.getByPlaceholderText('Choose a strong password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
    const countyInput = screen.getByPlaceholderText('e.g. Nairobi, Kiambu, etc.');
    const privacyCheckbox = screen.getByRole('checkbox');
    const submitButton = screen.getByRole('button', { type: 'submit' });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.change(countyInput, { target: { value: 'Nairobi' } });
    fireEvent.click(privacyCheckbox);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });

    const resendButton = screen.getByText(/resend verification email/i);
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(screen.getByText('Verification email sent successfully')).toBeInTheDocument();
    });
  });
}); 