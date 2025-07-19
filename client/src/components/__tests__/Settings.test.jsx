import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n.js';
import Settings from '../Settings.jsx';
import { toast } from 'react-toastify';
import axios from 'axios';

// Mock dependencies
jest.mock('axios');
jest.mock('react-toastify');
jest.mock('../../utils/auth.js', () => ({
  getUser: jest.fn(() => ({
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'citizen',
    county: 'Nairobi',
    ward: 'Test Ward',
    ageRange: '25-34',
    gender: 'male',
    isPublic: true
  })),
  getToken: jest.fn(() => 'test-token'),
  removeToken: jest.fn()
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    </BrowserRouter>
  );
};

describe('Settings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Delete Account Functionality', () => {
    it('should show delete account section', () => {
      renderWithProviders(<Settings />);
      
      expect(screen.getByText('Delete Account')).toBeInTheDocument();
      expect(screen.getByText(/Once you delete your account, there is no going back/)).toBeInTheDocument();
    });

    it('should show delete button initially', () => {
      renderWithProviders(<Settings />);
      
      expect(screen.getByRole('button', { name: 'Delete Account' })).toBeInTheDocument();
    });

    it('should show password form when delete button is clicked', () => {
      renderWithProviders(<Settings />);
      
      const deleteButton = screen.getByRole('button', { name: 'Delete Account' });
      fireEvent.click(deleteButton);
      
      expect(screen.getByLabelText(/Enter your password to confirm/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirm Delete' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should hide password form when cancel is clicked', () => {
      renderWithProviders(<Settings />);
      
      const deleteButton = screen.getByRole('button', { name: 'Delete Account' });
      fireEvent.click(deleteButton);
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);
      
      expect(screen.queryByLabelText(/Enter your password to confirm/)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete Account' })).toBeInTheDocument();
    });

    it('should show error when password is empty', async () => {
      renderWithProviders(<Settings />);
      
      const deleteButton = screen.getByRole('button', { name: 'Delete Account' });
      fireEvent.click(deleteButton);
      
      const confirmButton = screen.getByRole('button', { name: 'Confirm Delete' });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please enter your password');
      });
    });

    it('should call delete API when password is provided', async () => {
      // Mock window.confirm to return true
      window.confirm = jest.fn(() => true);
      
      axios.delete.mockResolvedValueOnce({ data: { message: 'Account deleted successfully' } });
      
      renderWithProviders(<Settings />);
      
      const deleteButton = screen.getByRole('button', { name: 'Delete Account' });
      fireEvent.click(deleteButton);
      
      const passwordInput = screen.getByLabelText(/Enter your password to confirm/);
      fireEvent.change(passwordInput, { target: { value: 'testpassword' } });
      
      const confirmButton = screen.getByRole('button', { name: 'Confirm Delete' });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(
          expect.stringContaining('/api/users/account'),
          {
            headers: { Authorization: 'Bearer test-token' },
            data: { password: 'testpassword' }
          }
        );
      });
    });

    it('should show success message and redirect on successful deletion', async () => {
      window.confirm = jest.fn(() => true);
      axios.delete.mockResolvedValueOnce({ data: { message: 'Account deleted successfully' } });
      
      const mockNavigate = jest.fn();
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));
      
      renderWithProviders(<Settings />);
      
      const deleteButton = screen.getByRole('button', { name: 'Delete Account' });
      fireEvent.click(deleteButton);
      
      const passwordInput = screen.getByLabelText(/Enter your password to confirm/);
      fireEvent.change(passwordInput, { target: { value: 'testpassword' } });
      
      const confirmButton = screen.getByRole('button', { name: 'Confirm Delete' });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Account deleted successfully');
      });
    });

    it('should show error message on API failure', async () => {
      window.confirm = jest.fn(() => true);
      axios.delete.mockRejectedValueOnce({
        response: { status: 400, data: { message: 'Invalid password' } }
      });
      
      renderWithProviders(<Settings />);
      
      const deleteButton = screen.getByRole('button', { name: 'Delete Account' });
      fireEvent.click(deleteButton);
      
      const passwordInput = screen.getByLabelText(/Enter your password to confirm/);
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      
      const confirmButton = screen.getByRole('button', { name: 'Confirm Delete' });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid password');
      });
    });

    it('should show loading state during deletion', async () => {
      window.confirm = jest.fn(() => true);
      
      // Mock a delayed response
      axios.delete.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { message: 'Account deleted successfully' } }), 100)));
      
      renderWithProviders(<Settings />);
      
      const deleteButton = screen.getByRole('button', { name: 'Delete Account' });
      fireEvent.click(deleteButton);
      
      const passwordInput = screen.getByLabelText(/Enter your password to confirm/);
      fireEvent.change(passwordInput, { target: { value: 'testpassword' } });
      
      const confirmButton = screen.getByRole('button', { name: 'Confirm Delete' });
      fireEvent.click(confirmButton);
      
      expect(screen.getByRole('button', { name: 'Deleting...' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled();
    });
  });
}); 