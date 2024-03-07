import { IController, IControllerConstructor, IPromise } from 'angular';
import { DashboardMainService } from '../dashboard-main.service';
import { PreviewConfig } from '../model';
import { Subscription } from '../utils/events';


export class PreviewComponent implements IController {
  private subscription: Subscription;
  loading: boolean;
  config: PreviewConfig;
  data: any;

  constructor(
    private dashboardMainService: DashboardMainService,
    private transService: any,
  ) { }

  $onInit(): void {
    this.subscription = this.dashboardMainService.onPreview.subscribe(cfg => this.showPreview(cfg));
    this.transService.loadFile('main/ticket');
  }

  $onDestroy(): void {
    this.subscription.unsubscribe();
  }

  private showPreview(cfg: PreviewConfig): void {
    this.loading = true;
    this.config = cfg;

    this.fetchData(cfg).then(resp => {
      const data = resp.data as any;
      this.data = data.data;
    })
    .finally(() => this.loading = false);
  }

  private fetchData(cfg: PreviewConfig) {
    if (cfg.type === 'task') {
      return this.dashboardMainService.fetchTask(cfg.projectId, cfg.id);

    } else if (cfg.type === 'knowledge-page') {
      return this.dashboardMainService.fetchKnowledgePage(cfg.projectId, cfg.id);

    } else {
      console.error(`[Dashoard PreviewComponent] Unsupported preview item type "${cfg.type}"`);
      return Promise.reject() as any as IPromise<never>;
    }
  }

}


PreviewComponent.$inject =
['dashboardMainService', 'transService'];

// @ts-ignore
angular.module('app.dashboard').component('notificationPreview', {
  templateUrl: 'preview.html',
  controller: PreviewComponent as IControllerConstructor,
  bindings: {
    projects: '<',
  },
});
