export interface HospitalNode {
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  status: 'active' | 'idle' | 'offline';
  lastSeen: string;
  trainingJobs: number;
  approvedJobs: number;
  privacyBudgetUsed: number;
  contributionScore: number;
  isActive: boolean;
}
