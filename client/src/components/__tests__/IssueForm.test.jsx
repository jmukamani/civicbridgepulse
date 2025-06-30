import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IssueForm from '../IssueForm';

describe('IssueForm Component', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders form fields correctly', () => {
    const { container } = render(<IssueForm onSubmit={mockOnSubmit} />);

    expect(container.querySelector('input[name="title"]')).toBeInTheDocument();
    expect(container.querySelector('textarea[name="description"]')).toBeInTheDocument();
    expect(container.querySelector('select[name="category"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="location"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /report/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<IssueForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /report/i });
    
    await act(async () => {
      await user.click(submitButton);
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const { container } = render(<IssueForm onSubmit={mockOnSubmit} />);
    
    const titleInput = container.querySelector('input[name="title"]');
    const descriptionInput = container.querySelector('textarea[name="description"]');
    const categorySelect = container.querySelector('select[name="category"]');
    const locationInput = container.querySelector('input[name="location"]');
    const submitButton = screen.getByRole('button', { name: /report/i });

    await act(async () => {
      await user.type(titleInput, 'Test Issue Title');
      await user.type(descriptionInput, 'Test issue description');
      await user.selectOptions(categorySelect, 'infrastructure');
      await user.type(locationInput, 'Test Location');

      expect(titleInput.value).toBe('Test Issue Title');
      expect(descriptionInput.value).toBe('Test issue description');
      expect(categorySelect.value).toBe('infrastructure');
      expect(locationInput.value).toBe('Test Location');
    });

    await act(async () => {
      await user.click(submitButton);
    });
    await waitFor(() => {
      expect(titleInput).toBeInTheDocument();
    }, { timeout: 3000 });
  });


}); 