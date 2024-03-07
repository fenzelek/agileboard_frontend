import { IController, IControllerConstructor, ITimeoutService } from 'angular';
import { DashboardMainService } from '../../dashboard-main.service';
import { TextareaSanitizerService } from '../../../../../directives/textarea-editor/textarea-sanitizer.service';
import { KnowlegePage } from './model';
import { User } from '../../../../../directives/textarea-editor/mention/model';
import { EventEmitter } from 'events';


export class KnowledgePageComponent implements IController {
  private projects: any[];
  page: KnowlegePage;
  ref: string;

  user: Partial<User>;
  ee = new EventEmitter();

  getSize = this.filesService.getSize;

  constructor(
    private dashboardMainService: DashboardMainService,
    private textareaSanitizerService: TextareaSanitizerService,
    private transService: any,
    private api: any,
    private dialogService: any,
    private filesService: any,
    private $element: JQuery,
    private $auth: any,
    private $timeout: ITimeoutService,
  ) { }

  $onInit(): void {
    this.$auth.getUser(user => this.user = user);
  }

  $postLink(): void {
    this.filesService.refreshFileTypes().$promise.finally(() => {
      this.parsePage();
      this.$timeout(() => this.dashboardMainService.highlightRef(this.$element[0], this.ref), 100);
    });
  }

  private parsePage(): void {
    this.page.trustedContent = this.textareaSanitizerService.sanitizeHTML(this.page.content);
    this.page.comments.data.forEach(comment => comment.trustedText = this.textareaSanitizerService.sanitizeHTML(comment.text));

    this.page.files.data.forEach(file => {
      file.icon = this.filesService.getIcon(file.extension);

      if (file.icon === 'icon-file-image') {
        file.thumb = this.filesService.getImageThumbnail(file.id, 120, this.page.project_id);
      }
    });
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

  addComment = function(data, successCallback, apiErrorCallback) {
    const comment = {
      project_id: this.page.project_id,
      page_id: this.page.id,
      text: data.value,
      type: 'global',
      interactions: { data: data.mentions },
    };

    this.api.page.comments.post(comment,
      (resp) => {
        this.addPageComment(resp, this.page.comments);
        if (successCallback) successCallback();
      },
      (response) => {
        if (apiErrorCallback) apiErrorCallback(response.data);
      }
    );
  }.bind(this);

  addPageComment(resp, comments) {
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
      project_id: this.page.project_id,
      text: data.value,
      comment_id: comment_id,
      interactions: { data: data.mentions },
    };

    this.api.page.comment.put(comment,
      () => {
        this.updatePageComment(comment_id, data.value);
        if (successCallback) successCallback();
      },
      (response) => {
        if (apiErrorCallback) apiErrorCallback(response.data);
      }
    );
  }.bind(this);

  updatePageComment(comment_id: number, text: string) {
    const comment = this.page.comments.data.find(c => c.id === comment_id);
    if (!comment) return;

    comment.text = text;
    comment.trustedText = this.textareaSanitizerService.sanitizeHTML(comment.text);
    comment.updated_at = new Date();
  }

  removeComment(comment, $event) {
    const data = {
      comment_id: comment.id,
      project_id: this.page.project_id,
    };

    const comments = this.page.comments;
    // @ts-ignore
    const el = angular.element($event.target).parents('.comment');

    this.api.page.comment.delete(data,
      () => {
        el.addClass('animate:dissolve');
        this.$timeout(() => {
          comments.data = comments.data.filter(c => comment.id !== c.id);
        }, 200);
      },
      () => {
        // @ts-ignore
        toastr.error(this.transService.translate('ERRORS.general.api_error'));
      }
    );
  }

  openPage(): void {
    this.dashboardMainService.openKnowledgePageInNewTab(this.page);
  }

  imagePreview(id: number): void {
    const companyId = this.getCompanyId(this.page.project_id);
    if (!companyId) return;
    
    const params = { url: this.dashboardMainService.getFileUrl(companyId, this.page.project_id, id) };

    this.dialogService.customDialog(null, 'ImagePreviewController', 'app/main/pages/image-preview/image-preview.html', params);
  }

  downloadFile(id: number): void {
    const companyId = this.getCompanyId(this.page.project_id);
    if (!companyId) return;

    this.dashboardMainService.downloadFile(companyId, this.page.project_id, id);
  }

  private getCompanyId(projectId: number): number | null {
    const project = this.projects.find(p => p.id === projectId);
    return project ? project.company_id : null;
  }

}


KnowledgePageComponent.$inject =
  ['dashboardMainService', 'textareaSanitizerService', 'transService', 'api', 'dialogService', 'filesService', '$element', '$auth', '$timeout'];

// @ts-ignore
angular.module('app.dashboard').component('knowledgePage', {
  templateUrl: 'knowledge-page.html',
  controller: KnowledgePageComponent as IControllerConstructor,
  bindings: {
    page: '<',
    ref: '<',
    projects: '<',
  },
});
