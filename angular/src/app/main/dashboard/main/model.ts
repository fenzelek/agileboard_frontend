export interface Notification {
  id: string;
  type: NotificationType;
  created_at: string;
  read_at: string | Date | null; // when notification was not read, it has null value
  company_id?: number;
  data: NotificationInteraction;
}

export type NotificationType = 'interaction';

export interface NotificationInteraction {
  project_id: number;
  title: string;
  author_name: string;
  event_type: InteractionEventType;
  action_type: InteractionActionType;
  source_type: InteractionSourceType;
  sourceType: 'ticket' | 'knowledge_page';
  ref: string;
  message: string;
  source_properties: InteractionSourceProp[];
  eventLabel: string; // this is not from api, set on frontend
}

export type InteractionEventType = 'ticket_new' | 'ticket_edit' | 'ticket_comment_new' | 'ticket_comment_edit' | 'document_new' | 'document_edit' | 'document_comment_new' | 'document_comment_edit';
export type InteractionActionType = 'ping';
export type InteractionSourceType = 'tickets' | 'ticket_comments' | 'knowledge_pages' | 'knowledge_page_comments';

export interface InteractionSourceProp {
  type: InteractionSourcePropType;
  id: string;
}

export type InteractionSourcePropType = 'ticket' | 'ticket_comment' | 'knowledge_page' | 'knowledge_page_comment';


export interface PreviewConfig {
  type: PreviewElementType;
  ref: string;
  companyId: number;
  projectId: number;
  id: number;
}

export type PreviewElementType = 'task' | 'knowledge-page';
