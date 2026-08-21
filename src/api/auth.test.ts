import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestPasswordReset, updatePassword } from './auth';

const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock('@/lib/supabaseClient', () => ({
    createClient: () => ({
        auth: {
            resetPasswordForEmail: mockResetPasswordForEmail,
            updateUser: mockUpdateUser
        }
    })
}));

beforeEach(() => {
    mockResetPasswordForEmail.mockReset();
    mockUpdateUser.mockReset();
});

describe('requestPasswordReset', () => {
    it('asks Supabase to send a reset email for the given address', async () => {
        mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });

        await requestPasswordReset('person@example.com');

        expect(mockResetPasswordForEmail).toHaveBeenCalledWith('person@example.com');
    });

    it('throws when Supabase returns an error', async () => {
        mockResetPasswordForEmail.mockResolvedValueOnce({ error: new Error('rate limited') });

        await expect(requestPasswordReset('person@example.com')).rejects.toThrow('rate limited');
    });
});

describe('updatePassword', () => {
    it('updates the current session user with the new password', async () => {
        mockUpdateUser.mockResolvedValueOnce({ error: null });

        await updatePassword('new-password-123');

        expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'new-password-123' });
    });

    it('throws when Supabase returns an error', async () => {
        mockUpdateUser.mockResolvedValueOnce({ error: new Error('Auth session missing') });

        await expect(updatePassword('new-password-123')).rejects.toThrow('Auth session missing');
    });
});
