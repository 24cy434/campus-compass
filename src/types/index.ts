export type UserRole = 'student' | 'faculty' | 'admin';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ComplaintStatus = 'pending' | 'processing' | 'done' | 'undone';
export type Visibility = 'public' | 'private';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  approval_status: ApprovalStatus;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  created_by: string;
}

export interface Complaint {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description: string;
  visibility: Visibility;
  status: ComplaintStatus;
  assigned_to: string | null;
  created_at: string;
  // joined
  category?: Category;
  user?: User;
  vote_count?: number;
  user_voted?: boolean;
}

export interface Vote {
  id: string;
  complaint_id: string;
  user_id: string;
}

export interface StatusLog {
  id: string;
  complaint_id: string;
  action_type: string;
  performed_by: string;
  timestamp: string;
  performer?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  complaint_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
