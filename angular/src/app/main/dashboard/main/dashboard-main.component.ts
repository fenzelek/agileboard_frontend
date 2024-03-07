import { IController, IControllerConstructor, IOnChangesObject } from 'angular';
import { DashboardMainService } from './dashboard-main.service';
import { Subscription } from './utils/events';

export class DashboardMainComponent implements IController {
  private subscription: Subscription;
  projects: any[];
  selected_tab: number = 0;
  showPreview = false
  companyId: string = null;

  constructor(
    private dashboardMainService: DashboardMainService
  ) { }

  $onInit(): void {
    this.subscription = this.dashboardMainService.onPreview.subscribe(cfg => {
      if (this.showPreview === false) {
        this.showPreview = true
        setTimeout(() => {
          this.dashboardMainService.onPreview.emit(cfg)
        }, 0);
      }
    });
  }

  $onDestroy(): void {
    this.subscription.unsubscribe();
  }

  $onChanges(onChangesObj: IOnChangesObject): void {
    const prevCompanyId = onChangesObj.companyId ? onChangesObj.companyId.previousValue : null
    console.log('prevCompanyId', prevCompanyId)
    console.log('typeof prevCompanyId', typeof prevCompanyId);
    console.log('currentCompanyId', this.companyId)
    if (prevCompanyId && typeof prevCompanyId !== 'object' && prevCompanyId !== this.companyId) {
      this.dashboardMainService.onProjectChange();
      this.showPreview = false;
    }
  }
}


DashboardMainComponent.$inject = ['dashboardMainService'];

// @ts-ignore
angular.module('app.dashboard').component('dashboardMain', {
  templateUrl: 'dashboard-main.html',
  controller: DashboardMainComponent as IControllerConstructor,
  bindings: {
    projects: '<',
    companyId: '<'
  }
});
