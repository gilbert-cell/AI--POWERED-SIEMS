import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AuthPage from './AuthPage';
import { loginUser } from '../utils/auth';

jest.mock('../utils/auth', () => ({
  loginUser: jest.fn(),
  resetPassword: jest.fn(),
}));

const renderAuthPage = (mode = 'login') => render(
  <MemoryRouter>
    <AuthPage mode={mode} />
  </MemoryRouter>
);

test('validates login fields before submitting', async () => {
  renderAuthPage();

  await userEvent.type(screen.getByLabelText(/email address/i), 'not-an-email');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

  expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
  expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  expect(loginUser).not.toHaveBeenCalled();
});
