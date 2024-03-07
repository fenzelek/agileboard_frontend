export interface KnowledgePageComment {
  id: number;
  knowledge_page_id: number;
  user_id: number;
  type: CommentType;
  text: string; // content (html)
  ref: string;
}

export interface KnowledgePageCommentPayload {
  type: CommentType;
  text: string; // content (html)
  ref: string;
  interactions: {
    data: Interaction[],
  }
}

export enum CommentType {
  global = 'global',
  internal = 'internal',
}

export enum GroupRecipient {
  all = 1,
  involved = 2,
}

export type Notifiable = 'group' | 'user';

export interface Interaction {
  recipient_id: number | GroupRecipient;
  ref: string;
  notifiable: Notifiable;
  message: string;
}

export interface QuillMentionConfig {
  allowedChars?: RegExp;
  mentionDenotationChars?: string[];
  dataAttributes: string[];
  positioningStrategy: 'normal' | 'fixed';
  source: (searchTerm: string, renderList: (items: MentionSuggestionItem[]) => unknown) => void;
  onSelect?: (item: MentionSuggestionItem, insertItem: (item: MentionSuggestionItem) => unknown) => void;
  renderItem?: (item: MentionSuggestionItem, searchTerm: string) => string;
}

export interface MentionSuggestionItem {
  targetType: Notifiable,
  id: number;
  value: string;
  ref: string;
  icon?: string;
  imgUrl?: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
  company_role_id: number;
  company_status: number;
  company_title: string;
  company_skills: string;
  company_description: string;
}
