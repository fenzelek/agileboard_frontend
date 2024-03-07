import { IController, IControllerConstructor, IHttpPromise, IPromise, ITimeoutService } from 'angular';
import EventEmitter from 'events';
import { Story, Task } from './model';
import { DashboardMainService } from '../../dashboard-main.service';
import { TextareaSanitizerService } from '../../../../../directives/textarea-editor/textarea-sanitizer.service';
import { User } from '../../../../../directives/textarea-editor/mention/model';
import { TaskLegacy } from './legacy';


export class TaskPreviewComponent implements IController {
  private projects: any[];
  task: Task;
  ref: string;

  sprints: any[];
  user: Partial<User>;

  formatEstimate = this.projectsService.formatEstimate;
  getSize = this.filesService.getSize;

  my_logged_time = 0;
  all_logged_time = 0;

  ee = new EventEmitter();
  legacy: TaskLegacy;

  constructor(
    private dashboardMainService: DashboardMainService,
    private textareaSanitizerService: TextareaSanitizerService,
    private $element: JQuery,
    private $auth: any,
    private $timeout: ITimeoutService,
    private transService: any,
    private api: any,
    private projectsService: any,
    private dialogService: any,
    private filesService: any,
  ) { }

  $onInit(): void {
    this.$auth.getUser(user => {
      this.user = user;
      this.getTimeLogged();
    });
  }

  $postLink(): void {
    this.legacy = new TaskLegacy(this.task, this.projectsService, this.api, this.textareaSanitizerService);
    this.sprints = [this.task.sprint.data];

    this.filesService.refreshFileTypes().$promise.finally(() => {
      this.parseTask();
      this.$timeout(() => this.dashboardMainService.highlightRef(this.$element[0], this.ref), 100);
    });

    this.$timeout(() => {
      this.setTagsInputPlaceholder();
    });
  }

  private getTimeLogged() {
    if (!this.task.time_tracking_summary) return;

    this.task.time_tracking_summary.data.forEach(value => {
      if (this.user.id === value.user_id) {
        this.my_logged_time += value.tracked_sum;
      }
      this.all_logged_time += value.tracked_sum;
    });
  }

  private setTagsInputPlaceholder(): void {
    const placeholder = this.transService.translate('DASHBOARD.ADD_TAG_TICKET');
    const inputs = this.$element[0].querySelectorAll('tags-input .tags .input');
    inputs.forEach((input: HTMLInputElement) => input.placeholder = placeholder);
  }

  clearTagsInput_parent_tickets() {
    const input: HTMLInputElement = this.$element[0].querySelector('.parent_tickets tags-input .tags .input');
    input.value = '';
  }

  clearTagsInput_sub_tickets() {
    const input: HTMLInputElement = this.$element[0].querySelector('.sub_tickets tags-input .tags .input');
    input.value = '';
  }

  clearTagsInput_stories() {
    const input: HTMLInputElement = this.$element[0].querySelector('.stories tags-input .tags .input');
    input.value = '';
  }

  private parseTask(): void {
    this.task.trustedDescription = this.textareaSanitizerService.sanitizeHTML(this.task.description);

    this.task.comments.data.forEach(comment => comment.trustedText = this.textareaSanitizerService.sanitizeHTML(comment.text));

    this.task.files.data.forEach(file => {
      file.icon = this.filesService.getIcon(file.extension);

      if (file.icon === 'icon-file-image') {
        file.thumb = this.filesService.getImageThumbnail(file.id, 120, this.task.project_id);
      }
    });
  }

  toChip(task: Task): string {
    return task.title;
  }

  getAvatar(link: string): string {
    return this.$auth.getAvatar(link);
  }

  toggleEdit(commentId: number): void {
    this.ee.emit('toggle-edit:' + commentId);
  }

  isMe(user: User): boolean {
    return this.user && this.user.id === user.id;
  }

  addComment = function(data, successCallback?, apiErrorCallback?) {
    const comment = {
      project_id: this.task.project_id,
      ticket_id: this.task.id,
      text: data.value,
      type: 'global',
      interactions: { data: data.mentions },
    };

    this.api.ticket.comments.save(comment,
      resp => {
        this.addTaskComment(resp, this.task.comments);
        if (successCallback) successCallback();
      },
      resp => {
        if (apiErrorCallback) apiErrorCallback(resp.data);
      }
    );
  }.bind(this);

  private addTaskComment(resp, comments): void {
    if (!this.user) {
      this.user = {
        first_name: 'Unknown',
        last_name: 'User',
      }
    };

    const comment = resp.data;

    comment.user = { data: this.user };
    comment.trustedText = this.textareaSanitizerService.sanitizeHTML(comment.text);

    comments.data.push(comment);
  }

  updateComment = function(data, successCallback, apiErrorCallback) {
    const comment_id = parseInt(data.id);

    const comment = {
      project_id: this.task.project_id,
      text: data.value,
      id: comment_id,
      interactions: { data: data.mentions },
    };

    this.api.ticket.comments.put(comment,
      () => {
        this.updateTaskComment(comment_id, data.value);
        if (successCallback) successCallback();
      },
      (response) => {
        if (apiErrorCallback) apiErrorCallback(response.data);
      });
  }.bind(this);

  private updateTaskComment(comment_id: number, text: string): void {
    const comment = this.task.comments.data.find(c => c.id === comment_id);
    if (!comment) return;

    comment.text = text;
    comment.trustedText = this.textareaSanitizerService.sanitizeHTML(comment.text);
    comment.updated_at = new Date();
  }

  removeComment(comment, $event): void {
    const data = {
      id: comment.id,
      project_id: this.task.project_id,
    };

    const comments = this.task.comments;
    // @ts-ignore
    const el = angular.element($event.target).parents('.comment');

    this.api.ticket.comments.delete(data, () => {
      el.addClass('animate:dissolve');
      this.$timeout(() => {
        comments.data = comments.data.filter(c => comment.id !== c.id);
      }, 200);
    }, () => {
      // @ts-ignore
      toastr.error(this.transService.translate('ERRORS.general.api_error'));
    });
  }

  saveParentTasks(): void {
    const newValue = this.task.parent_tickets.data;
    this.legacy.update('parent_tickets', newValue);
    this.clearTagsInput_parent_tickets();
  }

  saveSubTasks(): void {
    const newValue = this.task.sub_tickets.data;
    this.legacy.update('sub_tickets', newValue);
    this.clearTagsInput_sub_tickets();
  }

  saveStories(tag: Story): void {
    this.handleStoriesChange(tag).then(() => {
      this.api.ticket.ticket.put(this.task);
      this.clearTagsInput_stories();
    });
  }

  private handleStoriesChange(tag: Story): IPromise<void> {
    if (tag.id) { // removed / added existing
      this.task.story_id = this.task.stories.data.map(story => story.id);
      return Promise.resolve() as any as IPromise<void>;
    }

    return this.dashboardMainService.createStory(tag.name, this.task.project_id).then(resp => {
      Object.assign(tag, resp.data.data);
      this.task.story_id = this.task.stories.data.map(story => story.id);
    });
  }

  searchTasks(query: string) {
    return this.dashboardMainService.searchTasks(this.task.project_id, query, 10).then((resp: any) => resp.data.data);
  }

  openTask(task: Task): void {
    this.dashboardMainService.openTaskInNewTab(task);
  }

  getAllSprints = function() {
    if (this.sprints.length > 1) return;

    const params = {
      project_id: this.task.project_id,
      status: 'not-closed',
    };

    return this.api.sprint.sprints.get(params, resp => {
      this.sprints = resp.data.filter(sprint => !sprint.locked);
      // add backlog and select it if sprint is not set
      const backlog = { id: 0, project_id: this.task.project_id, name: 'Backlog', status: 'none' };
      this.sprints.unshift(backlog);

      if (!this.task.sprint.data) {
        // @ts-ignore
        this.task.sprint.data = backlog;
      }
    });
  }.bind(this);

  getSprintName(): string {
    return this.task.sprint.data ? this.task.sprint.data.name : '';
  }

  searchUser = function(query: string) {
    return this.projectsService.searchUser(query, this.task.project_id);
  }.bind(this);

  imagePreview(id: number): void {
    const companyId = this.getCompanyId(this.task.project_id);
    if (!companyId) return;
    
    const params = { url: this.dashboardMainService.getFileUrl(companyId, this.task.project_id, id) };

    this.dialogService.customDialog(null, 'ImagePreviewController', 'app/main/pages/image-preview/image-preview.html', params);
  }

  downloadFile(id: number): void {
    const companyId = this.getCompanyId(this.task.project_id);
    if (!companyId) return;

    this.dashboardMainService.downloadFile(companyId, this.task.project_id, id);
  }

  private getCompanyId(projectId: number): number | null {
    const project = this.projects.find(p => p.id === projectId);
    return project ? project.company_id : null;
  }

}


TaskPreviewComponent.$inject =
['dashboardMainService', 'textareaSanitizerService', '$element', '$auth', '$timeout', 'transService', 'api', 'projectsService', 'dialogService', 'filesService'];

// @ts-ignore
angular.module('app.dashboard').component('taskPreview', {
  templateUrl: 'task-preview.html',
  controller: TaskPreviewComponent as IControllerConstructor,
  bindings: {
    task: '<',
    ref: '<',
    projects: '<',
  },
});
