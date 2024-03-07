(function ()
{
    'use strict';

    angular
        .module('app.dashboard')
        .controller('DashboardController', DashboardController);

    /** @ngInject */
    function DashboardController($window, $location, $timeout, $rootScope, $auth, CompaniesData, transService, dashboardService, dialogService, api)
    {
        var vm = this;
        transService.loadFile('main/dashboard');
        transService.loadFile('toolbar');

        vm.sidenavOpen = false;
        vm.user = null,
        vm.companies = CompaniesData.data;
        vm.selectedCompany = vm.companies.length === 1 ? vm.companies[0] : null;
        vm.projects = [];

        init();
        function init() {
            $auth.getUser(function (user) {
                vm.user = user;
            });
            $timeout(function () {
                selectComapnyFromRootScope();
            }, 100);
        }


        /**
         * Public functions
         */

        vm.toggleLatestActivities = toggleLatestActivities;
        vm.selectCompany = selectCompany;
        vm.openTicket = openTicket;
        vm.addTicket = addTicket;
        vm.createProject = createProject;
        vm.runProjectWizard = runProjectWizard;

        function toggleLatestActivities() {
            vm.sidenavOpen = !vm.sidenavOpen;
        }

        /**
         * Set company as active (null if all companies) and load
         * company projects. Set this company as active
         * in rootScope also - this is needed to make request where
         * "selected_company_id" is automated
         * @param {Company} company
         */
        function selectCompany(company) {
            vm.selectedCompany = company;
            loadCompanyProjects();
            selectCompanyInRootScope(company ? company.id : null);
            autoRunProjectsWizard();
        }

        /**
         * Open Ticket in the new tab
         *
         * @param {Ticket} ticket
         */
        function openTicket(ticket) {
            var company = getTicketCompany(ticket);
            selectCompanyInRootScope(company.id, function () {
                $window.open('/projects/' + ticket.project_id + '/ticket/' + ticket.title, '_blank');
            });
        }

        /**
         * Add new ticket
         * We have to select proper company as active in $rootScope
         * to have access to project (sprint / statuses) data
         *
         * @param {Project} project
         */
        function addTicket(project) {
            // set current_project_id for 'projectsService.searchUser()' function purposes
            $rootScope.current_project_id = project.id;
            var company = getProjectCompany(project);
            selectCompanyInRootScope(company.id, openTicketDialog({
                id: undefined,
                project_id: project.id,
                sprint_id: undefined,
                scheduled_time_start: null
            }));
        }

        /**
         * Create new project for specified company.
         * Check that company has reached the package "projects number limit".
         * @param {Comapny} company
         */
        function createProject(company) {
            var companyProjectsNumber = dashboardService.getCompanyProjectsNumber(company, vm.projects);
            selectCompanyInRootScope(company.id, function () {
                $auth.getSettings(function (settings) {
                    if (settings['projects.multiple.projects'] != 'unlimited' &&
                      settings['projects.multiple.projects'] <= companyProjectsNumber) {
                        $rootScope.packageAlert('DASHBOARD.TOO_MANY_PROJECTS');
                    } else {
                        $location.path('/projects/form/new');
                    }
                });
            });
        }


        /**
         * Private functions
         */

        function selectComapnyFromRootScope() {
            angular.forEach(vm.companies, function (company) {
                if (company.id == $rootScope.current_company)
                    selectCompany(company)
            });
        }

        function loadCompanyProjects() {
            vm.projects = [];
            dashboardService.fetchCompanyProjects(vm.selectedCompany, vm.companies, function (data) {
                // console.log('loaded projects', data);
                vm.projects = data;
                getQuickTaskProjectFromLS();
            })
        }

        function openTicketDialog(params) {
            dialogService.customDialog(null,
                'AddEditTicketDialogController',
                'app/main/agile/add-edit-ticket/add-edit-ticket.html',
                params,
                function (success) {
                    if (typeof success == 'object') {
                        // loadYourTicketsData();
                        // loadLatestsData();
                    }
                }, undefined, undefined, false);
        }

        function selectCompanyInRootScope(company_id, callback) {
            if (company_id && company_id != $rootScope.current_company) {
                $auth.setCurrentCompany(company_id, function () {
                    $auth.refreshUser(function (user) {
                        vm.user = user;
                        if (callback && typeof callback == 'function') {
                            $timeout(function () {
                                callback();
                            }, 100);
                        }
                    });
                });
            } else {
                if (callback && typeof callback == 'function') {
                    $timeout(function () {
                        callback();
                    }, 100);
                }
            }
        }

        function getProjectCompany(project) {
            if (project == null) {
                return null;
            }
            var company = null;
            angular.forEach(vm.companies, function (comp) {
                if (comp.id == project.company_id) company = comp;
            });

            return company;
        }

        function getTicketCompany(ticket) {
            var project = null;
            angular.forEach(vm.projects, function (proj) {
                if (proj.id == ticket.project_id) project = proj;
            });
            if (project == null) {
                return null;
            }
            var company = null;
            angular.forEach(vm.companies, function (comp) {
                if (comp.id == project.company_id) company = comp;
            });

            return company;
        }


        function loadProjectSprints() {
            vm.quickTask.sprintId = 0;
            vm.quickTask.project.sprints = [];
            api.sprint.sprints.get({
                selected_company_id: vm.quickTask.project.company_id,
                project_id: vm.quickTask.project.id,
                status: 'not-closed',
                with_backlog: 1
            }, function (response) {
                    vm.quickTask.project.sprints = response.data.sort(function (sprint) {
                        return sprint.status === 'active' || !sprint.id ? -1 : 1;
                    });
                    getQuickTaskSprintFromLS();
            });
        }

        function getQuickTaskProjectFromLS() {
            if (typeof window.localStorage.quick_task_project != 'undefined') {
                angular.forEach(vm.projects, function (project) {
                    if (project.id == window.localStorage.quick_task_project) {
                        vm.quickTask.project = project;
                        loadProjectSprints();
                    }
                });
            }
        }

        function getQuickTaskSprintFromLS() {
            if (typeof window.localStorage.quick_task_sprint != 'undefined' && vm.quickTask.project && vm.quickTask.project.sprints) {
                angular.forEach(vm.quickTask.project.sprints, function (sprint) {
                    if (sprint.id == window.localStorage.quick_task_sprint) {
                        vm.quickTask.sprintId = sprint.id;
                    }
                });
            }
        }

        function autoRunProjectsWizard() {
            // specified company selected:
            if (!vm.selectedCompany) {
                return;
            }
            // user can create new project in company
            if (!vm.selectedCompany.role.data || (vm.selectedCompany.role.data.name != 'owner' && vm.selectedCompany.role.data.name != 'admin')) {
                return;
            }
            // any project exists in company
            api.projects.get({
                has_access: 0,
                status: 'all',
                selected_company_id: vm.selectedCompany.id
            }, function (res) {
                if (res.data && res.data.length === 0) {
                    runProjectWizard();
                }
            });
        }

        function runProjectWizard() {
            // Run project wizard only for `owner` and `admin` role user
            if (
                !vm.selectedCompany || !vm.selectedCompany.role.data ||
                (vm.selectedCompany.role.data.name != 'owner' && vm.selectedCompany.role.data.name != 'admin')
            ) {
                return;
            }

            dialogService.customDialog(undefined, 'ProjectWizardDialogController', 'app/main/projects/wizard/wizard.html');
        }


    }
})();
