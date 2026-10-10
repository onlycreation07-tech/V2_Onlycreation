export type NotificationType = 
  | 'new_order' 
  | 'payout_processed' 
  | 'status_changed' 
  | 'raw_footage_ready' 
  | 'rental_due';

export interface PartnerNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  amount?: number;
  timestamp: string;
  read: boolean;
  orderId?: string;
  clientName?: string;
  location?: string;
  priority?: 'high' | 'normal';
  roleTarget?: string;
  actionPayload?: {
    orderId?: string;
    gigTitle?: string;
    amount?: number;
  };
}
