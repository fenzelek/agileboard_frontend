import { IHttpService, IPromise } from 'angular';
import { EventDispose } from './utils/events';
import { PreviewConfig } from './model';
import { Story, Task } from './preview/task/model';
import { KnowlegePage } from './preview/knowledge-page/model';
import { Notification } from './model';
import { TextareaSanitizerService } from '../../../directives/textarea-editor/textarea-sanitizer.service';


export class DashboardMainService {

  private apiUrl = this.__env.apiUrl;

  notifications: Notification[] = [];
  unreadCount: number;
  pagination: { current_page: number, per_page: number };

  onPreview = new EventDispose<PreviewConfig>('on-preview');
  onFetchNotificationsStatus = new EventDispose<'loading' | 'loaded' | 'error'>('on-fetch-notifications-status');
  onFetchNotificationsData = new EventDispose<{ data: Notification[], newData: Notification[], pagination: { current_page: number, per_page: number }, newPagination: { current_page: number, per_page: number } }>('on-fetch-notifications-data');
  onFetchNotificationsUnreadCount = new EventDispose<{ unreadCount: number }>('on-fetch-notifications-unread-count');

  constructor(
    private $http: IHttpService,
    private textareaSanitizerService: TextareaSanitizerService,
    private $translate: any,
    private __env: any,
  ) { }

  onProjectChange() {
    try {
      this.notifications = [];
      this.pagination = { current_page: 1, per_page: 15 };
      this.unreadCount = 0;
      this.onFetchNotificationsData.emit({
        data: this.notifications,
        newData: [],
        pagination: null,
        newPagination: null
      });
      this.onFetchNotificationsUnreadCount.emit({ unreadCount: 0 });
      this.fetchNotifications(1, false);
    } catch (error) {
      console.log('DashboardMainService.onProjectChange error', error);
    }
  }

  async fetchNotifications(page?: number, isInternalFetch?: boolean) {
    const params: any = {};
    if (page) {
      params.page = page;
    }

    this.onFetchNotificationsStatus.emit('loading');

    const { data: { data, current_page, per_page } } = await this.$http.get<{ data: Notification[], current_page: number, per_page: number }>(`${this.apiUrl}user/notifications`, { params });

    this.parseNotifications(data).then(() => {
      if (isInternalFetch) { // check for new
        const newItems = this.getNewItems(data);
        this.notifications.unshift(...newItems);
      } else { // load more
        this.notifications.push(...data);
      }
    });


    if (!isInternalFetch) {
      this.pagination = { current_page, per_page };
    }

    this.onFetchNotificationsData.emit({
      data: this.notifications,
      newData: data,
      pagination: this.pagination,
      newPagination: { current_page, per_page }
    });
    
    this.onFetchNotificationsStatus.emit('loaded');

    this.fetchNotificationsUnreadCount();
  }

  private async fetchNotificationsUnreadCount() {
    try {
      const { data: { count } } = await this.$http.get<{ count: number }>(`${this.apiUrl}user/notifications/unread-count`);
      this.unreadCount = count;
      this.onFetchNotificationsUnreadCount.emit({ unreadCount: count });
    } catch (error) { }
  }

  private parseNotifications(notifications: Notification[]): IPromise<void> {
    return this.$translate.onReady().then(() => {
      notifications.forEach(item => {
        // gender distinction only applies to pl language, eng translations are the same for both
        const name = item.data.author_name.split(/\s+/)[0];
        const isFemale = name.substring(name.length - 1).toLowerCase() === 'a';
        const genderKey = isFemale ? 'FEMALE' : 'MALE';
        const eventLabel = `DASHBOARD.EVENT_TYPE.${genderKey}.${item.data.event_type}`;

        const sourceType = item.data.source_type.includes('ticket') ? 'ticket' : 'knowledge_page';
        const parsedMessage = this.textareaSanitizerService.sanitizeHTML(item.data.message);

        item.data.eventLabel = eventLabel;
        item.data.sourceType = sourceType;
        item.data.message = parsedMessage;
      });

    });
  }

  private getNewItems(notifications: Notification[]): Notification[] {
    if (!this.notifications || !this.notifications.length) return notifications;

    const lastMostRecentItemId = this.notifications[0].id;
    const firstCommonIndex = notifications.findIndex(item => item.id === lastMostRecentItemId);

    if (firstCommonIndex === -1) return notifications;

    return notifications.slice(0, firstCommonIndex);
  }

  fetchTask(projectId: number, ticketId: number) {
    const url = `${this.apiUrl}projects/${projectId}/tickets/${ticketId}`;
    return this.$http.get(url);
  }

  searchTasks(projectId: number, search: string, limit?: number) {
    const url = `${this.apiUrl}projects/${projectId}/tickets`;
    const params = { search, limit };
    return this.$http.get(url, { params });
  }

  fetchKnowledgePage(projectId: number, pageId: number) {
    const url = `${this.apiUrl}project/${projectId}/pages/${pageId}`;
    return this.$http.get(url);
  }

  setNotificationAsRead(notification: Notification) {
    const data = {
      notification_ids: [notification.id],
    }

    try {
      this.$http.put(`${this.apiUrl}user/notifications/read`, data);
      notification.read_at = new Date();
      this.onFetchNotificationsUnreadCount.emit({ unreadCount: this.unreadCount - 1 });
    } catch (error) {

    }

    return
  }

  markAllNotificationsAsRead() {
    try {
      this.$http.put(`${this.apiUrl}user/notifications/read-all`, {});
      this.notifications.forEach(item => !item.read_at && (item.read_at = new Date()));
      this.onFetchNotificationsUnreadCount.emit({ unreadCount: 0 });
      this.onFetchNotificationsData.emit({
        data: this.notifications,
        newData: [],
        pagination: this.pagination,
        newPagination: null
      });
    } catch (error) { }
  }

  openTaskInNewTab(task: Task): void {
    const url = `/projects/${task.project_id}/ticket/${task.id}`;
    window.open(url, '_blank');
  }

  openKnowledgePageInNewTab(page: KnowlegePage): void {
    const url = `/projects/${page.project_id}/knowledge#${page.id}`;
    window.open(url, '_blank');
  }

  highlightRef(scrollEl: HTMLElement, ref: string): void {
    const refEl: HTMLSpanElement = scrollEl.querySelector(`[data-ref="${ref}"]`);
    if (!refEl) return;

    const scrollElHeight = scrollEl.getBoundingClientRect().height;

    refEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const checkScrollPositionInterval = setInterval(() => {
      const isInView = scrollEl.offsetTop + scrollEl.scrollTop + scrollElHeight > refEl.offsetTop;

      if (isInView) {
        refEl.classList.add('highlight');
        clearInterval(checkScrollPositionInterval);
      }
    }, 50);

  }

  getFileUrl(companyId: number, projectId: number, id: number): string {
    const url = `${this.apiUrl}projects/${projectId}/files/${id}/download?selected_company_id=${companyId}&token=${localStorage.token}`;
    return url;
  }

  downloadFile(companyId: number, projectId: number, id: number) {
    const url = `${this.apiUrl}projects/${projectId}/files/${id}/download?selected_company_id=${companyId}&token=${localStorage.token}`;
    window.open(url, '_blank');
  }

  createStory(name: string, projectId: number) {
    const url = `${this.apiUrl}projects/${projectId}/stories`;
    const data = { name };
    return this.$http.post<{ data: Story }>(url, data);
  }

}


DashboardMainService.$inject = ['$http', 'textareaSanitizerService', '$translate', '__env'];

// @ts-ignore
angular.module('app.dashboard').service('dashboardMainService', DashboardMainService);
