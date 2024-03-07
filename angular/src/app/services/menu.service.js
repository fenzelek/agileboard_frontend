(function ()
{
    'use strict';

    angular
        .module('app.core')
        .factory('menu', menu);

    /** @ngInject */
    function menu(msNavigationService, projectsService, $rootScope)
    {

        var service = {
            dashboard:dashboard,
            projects:projects,
            invoices:invoices,
            manageCompany:manageCompany
    	};

        return service;

        function dashboard(show) {
            if (show == "1") {
                msNavigationService.saveItem('dashboard', {
                    title    : 'Dashboard',
                    state    : $rootScope.is_fv ? 'app.fv-dashboard' : 'app.dashboard',
                    weight   : 1,
                    icon     : 'icon-view-dashboard',
                    translate: 'NAV.DASHBOARD'
                });
            } else {
                msNavigationService.deleteItem('dashboard');
            }
        }

        function projects(show, role) {
            if (show == "1") {
                msNavigationService.saveItem('projects', {
                    title    : 'Projects',
                    state    : '',
                    weight   : 1,
                    icon     : 'icon-puzzle',
                    translate: 'NAV.PROJECTS.TITLE'
                });
                if (role != 'client') {
                    // company settings
                    if ($rootScope.current_company_settings && $rootScope.current_company_settings.enable_calendar) {
                        msNavigationService.saveItem('calendar', {
                            title       : 'Calendar',
                            state       : '',
                            icon        : 'icon-calendar-today',
                            translate   : 'NAV.CALENDAR',
                            weight      : 2
                        });

                        msNavigationService.saveItem('calendar.working', {
                            title       : 'Working',
                            state       : 'app.calendar',
                            stateParams : {view: 'working'},
                            translate   : 'NAV.CALENDAR_WORKING',
                            weight      : 1
                        });

                        msNavigationService.saveItem('calendar.working.summary', {
                            title       : 'summary-calendar',
                            state       : 'app.summary-calendar',
                            translate   : 'NAV.SUMMARY',
                            weight      : 1
                        });

                        msNavigationService.saveItem('calendar.realization', {
                            title       : 'realization',
                            state       : 'app.calendar',
                            stateParams : {view: 'realization'},
                            translate   : 'NAV.CALENDAR_REALIZATION',
                            weight      : 2
                        });

                        // Gantt enabled only for creators for testing purposes
                        if (
                            $rootScope.current_company &&
                            ($rootScope.current_company == 2 || $rootScope.current_company == 9)
                        ) {
                            msNavigationService.saveItem('calendar.gantt', {
                                title       : 'gantt',
                                state       : 'app.calendar',
                                stateParams : {view: 'gantt'},
                                translate   : 'NAV.CALENDAR_GANTT',
                                weight      : 3
                            });
                            msNavigationService.saveItem('calendar.activity', {
                                title       : 'activity-calendar',
                                state       : 'app.activity-calendar',
                                translate   : 'NAV.ACTIVITY_CALENDAR',
                                weight      : 4
                            });
                        }

                    }
                    if ($rootScope.current_company_settings && $rootScope.current_company_settings.enable_activity) {
                        msNavigationService.saveItem('time-tracking', {
                            title       : 'Time tracking',
                            state       : 'app.time-tracking-def',
                            icon        : 'icon-clock',
                            translate   : 'NAV.TIME_TRACKING'
                        });

                        msNavigationService.saveItem('time-tracker-screens', {
                            title       : 'Time tracker - screens',
                            state       : 'app.time-tracker-screens',
                            icon        : 'icon-photo_library',
                            translate   : 'NAV.TIME_TRACKER.SCREENS'
                        });
                    }
                }

                projectsService.setList();
            } else {
                msNavigationService.deleteItem('projects');
                msNavigationService.deleteItem('calendar');
                msNavigationService.deleteItem('time-tracking');
                projectsService.deleteListFromMenu();
            }
        }

        function invoices(show, receipts) {
            if (show == "1") {
                msNavigationService.saveItem('contractors', {
                    title    : 'Lista kontrchentów',
                    icon     : 'icon-account-multiple',
                    state    : 'app.contractors-list',
                    translate: 'NAV.CONTRACTORS.LIST',
                    weight   : 1
                });
                msNavigationService.saveItem('products', {
                    title    : 'Lista produktów',
                    icon     : 'icon-cube-outline',
                    state    : 'app.products-list',
                    translate: 'NAV.PRODUCTS.LIST',
                    weight   : 2
                });
                msNavigationService.saveItem('invoices', {
                    title    : 'Lista Faktur',
                    icon     : 'icon-file-document',
                    state    : 'app.invoices-list',
                    translate: 'NAV.INVOICES.LIST',
                    weight   : 3
                });
                if (receipts == "1") {
                    msNavigationService.saveItem('receipts-list', {
                        title: 'Lista operacji kasowych',
                        icon: 'icon-receipt',
                        state: 'app.receipts-list',
                        translate: 'NAV.RECEIPTS.LIST',
                        weight: 4
                    });
                }
                msNavigationService.saveItem('online-sales-list', {
                    title    : 'Lista operacji kasowych',
                    icon     : 'icon-web',
                    state    : 'app.online-sales-list',
                    translate: 'NAV.ONLINE_SALES.LIST',
                    weight   : 5
                });
                msNavigationService.saveItem('cash-operations', {
                    title    : 'Lista operacji kasowych',
                    icon     : 'icon-cash-multiple',
                    state    : 'app.cash-operations-list',
                    translate: 'NAV.CACHE_OPERATIONS.LIST',
                    weight   : 6
                });
                msNavigationService.saveItem('registry-sales', {
                    title    : 'Rejestr',
                    icon     : 'icon-cash-usd',
                    state    : 'app.registry-sales',
                    translate: 'NAV.REGISTRY_SALES.LIST',
                    weight   : 7
                });
            } else {
                msNavigationService.deleteItem('contractors');
                msNavigationService.deleteItem('products');
                msNavigationService.deleteItem('invoices');
                msNavigationService.deleteItem('receipts-list');
                msNavigationService.deleteItem('online-sales-list');
                msNavigationService.deleteItem('cash-operations');
                msNavigationService.deleteItem('registry-sales');
            }
        }

        function manageCompany(is_admin) {
            if (is_admin) {
                msNavigationService.saveItem('company', {
                    title    : 'Zarzadzaj firmą',
                    icon     : 'icon-pencil',
                    state    : 'app.company-edit',
                    translate: 'NAV.COMPANY.TITLE',
                    weight   : 1
                });
            } else {
                msNavigationService.deleteItem('company');
            }
        }

    }

})();
