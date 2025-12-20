import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { authService, dbService } from '../services/supabase';

// Mock the services
vi.mock('../services/supabase', () => ({
  authService: {
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(),
    signOut: vi.fn(),
  },
  dbService: {
    getProfile: vi.fn(),
    getSubscription: vi.fn(),
  },
}));

// Mock logger to avoid console noise
vi.mock('../lib/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

// Test component to consume context
const TestComponent = () => {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return <div>Loading...</div>;
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Guest'}</span>
      <span data-testid="user-email">{user?.email || 'No Email'}</span>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    authService.getUser.mockResolvedValue(null);
    authService.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('provides guest state when no user found', async () => {
    authService.getUser.mockResolvedValue(null);
    authService.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Guest');
    });
    expect(screen.getByTestId('user-email')).toHaveTextContent('No Email');
  });

  it('provides authenticated state when user exists', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    authService.getUser.mockResolvedValue(mockUser);
    dbService.getProfile.mockResolvedValue({ full_name: 'Test User' });
    dbService.getSubscription.mockResolvedValue({ plan: 'pro' });
    authService.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
  });
});
