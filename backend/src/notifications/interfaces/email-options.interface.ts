export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  templateData?: Record<string, any>;
}

export interface EmailJobData {
  notificationLogId: string;
  emailOptions: EmailOptions;
  notificationType: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}
