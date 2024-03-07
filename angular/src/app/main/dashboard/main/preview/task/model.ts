export interface Task {
  id: number;
  project_id: number;
  sprint_id: number;
  status_id: number;
  parent_ticket_ids: number[];
  sub_ticket_ids: number[];
  name: string;
  title: string;
  type_id: number;
  assigned_id: number;
  reporter_id: number;
  description: string;
  trustedDescription: any;
  estimate_time: number;
  priority: number;
  hidden: true;
  created_at: string;
  updated_at: string | Date;
  deleted_at: string;
  parent_tickets: {
    data: {
      id: number;
      project_id: number;
      sprint_id: number;
      status_id: number;
      name: string;
      title: string;
      type_id: number;
      assigned_id: number;
      reporter_id: number;
      description: string;
      estimate_time: number;
      scheduled_time_start: number;
      scheduled_time_end: number;
      priority: number;
      hidden: true;
      created_at: string;
      updated_at: string
    }[]
  };
  sub_tickets: {
    data: {
      id: number;
      project_id: number;
      sprint_id: number;
      status_id: number;
      name: string;
      title: string;
      type_id: number;
      assigned_id: number;
      reporter_id: number;
      description: string;
      estimate_time: number;
      scheduled_time_start: number;
      scheduled_time_end: number;
      priority: number;
      hidden: true;
      created_at: string;
      updated_at: string
    }[];
  };
  files: {
    data: {
      id: number;
      project_id: number;
      user_id: number;
      owner: {
        data: [
          {
            id: number;
            email: string;
            first_name: string;
            last_name: string;
            avatar: string;
            deleted: true;
            activated: true
          }
        ]
      };
      name: string;
      size: number;
      extension: string;
      description: string;
      created_at: string;
      updated_at: string;
      icon: string; // set on front
      thumb: string; // set on front
    }[];
  };
  stories: {
    data: Story[];
  };
  story_id: number[];
  sprint: {
    data: {
      id: number;
      name: string;
      project_id: number;
      status: string;
      priority: number;
      created_at: string;
      updated_at: string
    }
  };
  type: {
    data: {
      id: number;
      name: string;
    }
  };
  status: {
    data: {
      id: number;
      name: string;
      project_id: number;
      priority: number;
      created_at: string;
      updated_at: string | Date;
    }
  };
  comments: {
    data: {
      id: number;
      text: string;
      trustedText: any;
      ticket_id: number;
      user_id: number;
      created_at: string;
      updated_at: string | Date;
      status: {
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
  };
  assigned_user: {
    data: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      avatar: string;
      deleted: true;
      activated: true;
    }
  };
  reporting_user: {
    data: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      avatar: string;
      deleted: true;
      activated: true;
    }
  };
  time_tracking_summary: {
    data: {
      time_tracking_user_id: number;
      user_id: number;
      ticket_id: number;
      tracked_sum: number;
      activity_sum: number;
      activity_level: number;
      user: {
        data: {
          id: number;
          email: string;
          first_name: string;
          last_name: string;
          avatar: string;
          deleted: true;
          activated: true;
        }[];
      };
      time_tracking_user: {
        data: {
          id: number;
          integration_id: number;
          user_id: number;
          external_user_id: string;
          external_user_email: string;
          external_user_name: string;
          created_at: string;
          updated_at: string;
        }[];
      }
    }[];
  };
  stats: {
    data: {
      tracked_summary: number;
      activity_summary: number;
      activity_level: number;
      time_usage: number;
    }
  };
  involved: {
    data: {
      user_id: number;
      first_name: string;
      last_name: string;
      avatar: string;
    }[];
  }
}

export interface Story {
  id: number;
  project_id: number;
  name: string;
  color: string;
  priority: number;
  created_at: string;
  updated_at: string;
}
