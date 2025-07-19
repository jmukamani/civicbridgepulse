import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PrivacyPolicy from '../PrivacyPolicy';

// Wrapper component for Router context
const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('PrivacyPolicy Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn()
  };

  it('renders privacy policy modal when isOpen is true', () => {
    render(
      <RouterWrapper>
        <PrivacyPolicy {...defaultProps} />
      </RouterWrapper>
    );

    expect(screen.getByText(/CivicBridgePulse Kenya Privacy Policy/i)).toBeInTheDocument();
    expect(screen.getByText(/Effective Date: 19\/07\/2025/i)).toBeInTheDocument();
    expect(screen.getByText(/Last Updated: 19\/07\/2025/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <RouterWrapper>
        <PrivacyPolicy {...defaultProps} isOpen={false} />
      </RouterWrapper>
    );

    expect(screen.queryByText(/CivicBridgePulse Kenya Privacy Policy/i)).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    render(
      <RouterWrapper>
        <PrivacyPolicy {...defaultProps} onClose={mockOnClose} />
      </RouterWrapper>
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when X button is clicked', () => {
    const mockOnClose = jest.fn();
    render(
      <RouterWrapper>
        <PrivacyPolicy {...defaultProps} onClose={mockOnClose} />
      </RouterWrapper>
    );

    const xButton = screen.getByText('×');
    fireEvent.click(xButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('displays all privacy policy sections', () => {
    render(
      <RouterWrapper>
        <PrivacyPolicy {...defaultProps} />
      </RouterWrapper>
    );

    expect(screen.getByText('Introduction')).toBeInTheDocument();
    expect(screen.getByText('Information We Collect')).toBeInTheDocument();
    expect(screen.getByText('How We Use Your Information')).toBeInTheDocument();
    expect(screen.getByText('Information Sharing')).toBeInTheDocument();
    expect(screen.getByText('Data Security')).toBeInTheDocument();
    expect(screen.getByText('Your Rights')).toBeInTheDocument();
    expect(screen.getByText('Data Retention')).toBeInTheDocument();
    expect(screen.getByText('Special Considerations')).toBeInTheDocument();
    expect(screen.getByText('Contact and Complaints')).toBeInTheDocument();
    expect(screen.getByText('Policy Updates')).toBeInTheDocument();
  });

  it('displays contact information', () => {
    render(
      <RouterWrapper>
        <PrivacyPolicy {...defaultProps} />
      </RouterWrapper>
    );

    expect(screen.getByText(/j\.mukamani@alustudent\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/www\.odpc\.go\.ke/i)).toBeInTheDocument();
    expect(screen.getByText(/info@odpc\.go\.ke/i)).toBeInTheDocument();
    expect(screen.getByText(/\+254-20-2628000/i)).toBeInTheDocument();
  });

  it('displays version information', () => {
    render(
      <RouterWrapper>
        <PrivacyPolicy {...defaultProps} />
      </RouterWrapper>
    );

    expect(screen.getByText(/Version 1\.0 - 19\/07\/2025/i)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <RouterWrapper>
        <PrivacyPolicy {...defaultProps} />
      </RouterWrapper>
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });
}); 