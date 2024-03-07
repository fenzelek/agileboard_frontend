import { IController, IControllerConstructor, IIntervalService, IPromise, IRootScopeService, IScope } from 'angular';
import { DashboardMainService } from '../dashboard-main.service';
import { Notification, PreviewConfig } from '../model';
import { TextareaSanitizerService } from '../../../../directives/textarea-editor/textarea-sanitizer.service';
import { Subscription } from '../utils/events';


export class NotificationsComponent implements IController {
  private readonly notificationsFetchTimeInterval = 1000 * 20;
  private notificationsFetchInterval: IPromise<any>;

  private currentPage = 1;
  private lastPageLoaded = false;

  loading: boolean;
  readCount: number;
  notifications: Notification[] = [];

  subscriptions: Subscription[] = [];

  constructor(
    private $scope: IScope,
    private dashboardMainService: DashboardMainService,
    private $interval: IIntervalService,
    private $element: JQuery,
    private $rootScope: IRootScopeService,
  ) { }

  $onInit(): void {
    this.handleLoadMoreScroll = this.handleLoadMoreScroll.bind(this);
    this.loadNextPage = this.loadNextPage.bind(this);

    this.subscribeNotificationsStatus();
    this.subscribeNotificationsData();
    this.subscribeNotificationsUnreadCount();

    this.fetchNotifications(1);
    this.startInternalFetchNotifications();
  }

  $onDestroy(): void {
    this.$interval.cancel(this.notificationsFetchInterval);
    this.unsubscribeAll();
  }

  subscribeNotificationsStatus(): void {
    const subscription = this.dashboardMainService.onFetchNotificationsStatus.subscribe(status => {
      this.loading = status === 'loading';
    });

    this.subscriptions.push(subscription);
  }

  subscribeNotificationsData(): void {
    const onScroll = this.$rootScope.debounce((event) => this.handleLoadMoreScroll(event), 250);
    const subscription = this.dashboardMainService.onFetchNotificationsData.subscribe(({ data, newData, pagination, newPagination }) => {
      if (!pagination) {
        this.currentPage = 1;
        this.notifications = data;
        this.lastPageLoaded = false;
      } else {
        this.currentPage = pagination.current_page;
        this.notifications = data;
        if (newPagination.current_page !== 1) {
          this.lastPageLoaded = newData.length < pagination.per_page;
        }
      }

      const wrapperEl = this.$element.find('.notifications-wrapper')[0];
      wrapperEl.removeEventListener('scroll', onScroll);
      wrapperEl.addEventListener('scroll', onScroll);
    });

    this.subscriptions.push(subscription);
  }

  subscribeNotificationsUnreadCount(): void {
    const subscription = this.dashboardMainService.onFetchNotificationsUnreadCount.subscribe(({ unreadCount }) => {
      this.readCount = unreadCount;
    });

    this.subscriptions.push(subscription);
  }

  unsubscribeAll(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  startInternalFetchNotifications(): void {
    this.notificationsFetchInterval = this.$interval(() => this.fetchNotifications(1, true), this.notificationsFetchTimeInterval);
  }

  private fetchNotifications(page: number, isInternalFetch?: boolean): void {
    this.dashboardMainService.fetchNotifications(page, isInternalFetch);
  }

  private loadNextPage(): void {
    if (this.loading || this.lastPageLoaded) {
      return
    }

    const nextPage = this.currentPage + 1;
    this.fetchNotifications(nextPage);
  }

  private handleLoadMoreScroll(event: Event): void {
    const wrapperEl = this.$element.find('.notifications-wrapper')[0];

    const height = wrapperEl.getBoundingClientRect().height;
    const scrollTop = wrapperEl.scrollTop + height;
    const scrolledToBottom = wrapperEl.scrollHeight - scrollTop < 10;

    if (scrolledToBottom) {
      this.loadNextPage();
    }
  }

  markAllAsRead(): void {
    this.dashboardMainService.markAllNotificationsAsRead();
  }

  displayPreview(notification: Notification): void {
    if (!notification.data.source_properties) {
      if (!notification.read_at) {
        this.setAsRead(notification);
      }
      return;
    }

    const isTicketNotification = notification.data.sourceType === 'ticket';
    let id: number;

    try {
      id = isTicketNotification
        ? +notification.data.source_properties.find(prop => prop.type === 'ticket').id
        : +notification.data.source_properties.find(prop => prop.type === 'knowledge_page').id;
    } catch (err) {
      console.error('[NotificationsComponent] Notification data error', err, notification);
      return;
    }

    const cfg: PreviewConfig = {
      type: isTicketNotification ? 'task' : 'knowledge-page',
      id,
      companyId: notification.company_id,
      projectId: notification.data.project_id,
      ref: notification.data.ref,
    };

    this.dashboardMainService.onPreview.emit(cfg);
    this.setAsRead(notification);
  }

  private setAsRead(notification: Notification): void {
    if (notification.read_at) return;
    this.dashboardMainService.setNotificationAsRead(notification);
  }

}


NotificationsComponent.$inject = ['$scope', 'dashboardMainService', '$interval', '$element', '$rootScope'];

// @ts-ignore
angular.module('app.dashboard').component('notifications', {
  templateUrl: 'notifications.html',
  controller: NotificationsComponent as IControllerConstructor,
});
