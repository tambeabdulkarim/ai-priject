export type UserProfile = {
  name: string;
  email: string;
  role: string;
};

export function getDemoUser(): UserProfile {
  return {
    name: 'Amina Al-Sayed',
    email: 'amina@opsive.app',
    role: 'Product Lead'
  };
}
