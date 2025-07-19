import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PasswordInput from '../PasswordInput';

// Wrapper component for Router context
const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('PasswordInput Component', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    placeholder: 'Enter password',
    required: false,
    name: 'password',
    showToggle: true
  };

  it('renders password input correctly', () => {
    render(
      <RouterWrapper>
        <PasswordInput {...defaultProps} />
      </RouterWrapper>
    );

    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'password');
  });

  it('toggles password visibility when toggle button is clicked', () => {
    render(
      <RouterWrapper>
        <PasswordInput {...defaultProps} />
      </RouterWrapper>
    );

    const input = screen.getByPlaceholderText('Enter password');
    const toggleButton = screen.getByRole('button');

    // Initially password should be hidden
    expect(input).toHaveAttribute('type', 'password');

    // Click toggle button to show password
    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');

    // Click toggle button again to hide password
    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('calls onChange when input value changes', () => {
    const mockOnChange = jest.fn();
    render(
      <RouterWrapper>
        <PasswordInput {...defaultProps} onChange={mockOnChange} />
      </RouterWrapper>
    );

    const input = screen.getByPlaceholderText('Enter password');
    fireEvent.change(input, { target: { value: 'newpassword' } });

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('applies required attribute when required prop is true', () => {
    render(
      <RouterWrapper>
        <PasswordInput {...defaultProps} required={true} />
      </RouterWrapper>
    );

    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toBeRequired();
  });

  it('hides toggle button when showToggle is false', () => {
    render(
      <RouterWrapper>
        <PasswordInput {...defaultProps} showToggle={false} />
      </RouterWrapper>
    );

    const toggleButton = screen.queryByRole('button');
    expect(toggleButton).not.toBeInTheDocument();
  });

  it('uses custom name attribute', () => {
    render(
      <RouterWrapper>
        <PasswordInput {...defaultProps} name="confirmPassword" />
      </RouterWrapper>
    );

    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveAttribute('name', 'confirmPassword');
  });

  it('applies custom className', () => {
    render(
      <RouterWrapper>
        <PasswordInput {...defaultProps} className="custom-class" />
      </RouterWrapper>
    );

    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveClass('custom-class');
  });
}); 