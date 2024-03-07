import { CommentType } from "../../../../../directives/textarea-editor/mention/model";

export interface KnowlegePage {
  id: number;
  project_id: number;
  creator_id: number;
  pinned: true;
  knowledge_directory_id: number;
  name: string;
  content: string;
  trustedContent: any; // set on front
  created_at: string;
  updated_at: string;
  users: {
    data: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      avatar: string;
    }[];
  },
  roles: {
    data: {
      id: number;
      name: string;
    }[];
  },
  stories: {
    data: {
      id: number;
      project_id: number;
      name: string;
      color: string;
      priority: number;
      created_at: string;
      updated_at: string;
      deleted_at: string;
    }[];
  },
  files: {
    data: {
      id: number;
      project_id: number;
      user_id: number;
      name: string;
      size: number;
      extension: string;
      description: string;
      created_at: string;
      updated_at: string;
      icon: string;
      thumb: string;
    }[];
  },
  comments: {
    data: {
      id: number;
      text: string;
      trustedText: string; // set on front
      ticket_id: number;
      user_id: number;
      type: CommentType;
      ref: string;
      created_at: string;
      updated_at: string | Date;
      user: {
        data: {
          id: number;
          email: string;
          first_name: string;
          last_name: string;
          avatar: string;
          deleted: true;
          activated: true;
        }
      }
    }[];
  },
  involved: {
    data: {
      user_id: number;
      first_name: string;
      last_name: string;
      avatar: string;
    }[];
  }
}
