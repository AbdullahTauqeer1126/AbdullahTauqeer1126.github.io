import { userApi } from './api-client';

export const getPendingUsers = async () => {
  const response = await userApi.adminGetAll();
  if (response.success && response.data) {
    const users = response.data as any[];
    return users.filter((u: any) => u.approval_status === 'PENDING' || u.kyc_status === 'PENDING');
  }
  return [];
};

export const approveUser = async (userId: string) => {
  const response = await userApi.adminUpdateUser(userId, {
    approval_status: 'APPROVED',
    kyc_status: 'VERIFIED',
    kyc_verified: true
  });
  
  if (response.success) {
    // If it's the current user, we might want to refresh their session locally
    // but the source of truth is now the database.
    const currentUser = JSON.parse(typeof window !== 'undefined' ? (localStorage.getItem('user_session') || 'null') : 'null');
    if (currentUser && currentUser.id === userId) {
      localStorage.setItem('user_session', JSON.stringify({ 
        ...currentUser, 
        approval_status: 'APPROVED', 
        kyc_status: 'VERIFIED',
        kyc_verified: true
      }));
    }
  }
  return response;
};

