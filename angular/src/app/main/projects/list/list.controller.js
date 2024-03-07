(function ()
{
    'use strict';

    angular
        .module('app.projects-list')
        .controller('ProjectsListController', ProjectsListController);

    /** @ngInject */
    function ProjectsListController(transService, api, tableService, dialogService, $location, $auth, $rootScope, projectsService, Projects)
    {
        var vm = this;
        transService.loadFile('main/projects/list');

        // Data
        vm.msg_error = '';
        vm.msg_success = '';
        vm.request_sending = false;
        vm.projects = Projects.data;
        vm.pagination = Projects.meta.pagination;
        vm.role = '';
        vm.sum = null;
        vm.search = '';

        vm.createProject = createProject;
        vm.getProjects = getProjects;
        vm.onPaginationChanged = onPaginationChanged;
        vm.deleteProjects = deleteProjects;
        vm.closeProjects = closeProjects;
        vm.openProjects = openProjects;
        vm.edit = edit;
        vm.clone = clone;
        vm.show = show;
        vm.searchProjects = searchProjects;

        init();

        function init() {

            $auth.getMyRole(function (role) {
               vm.role = role;
            });

            tableService.setVariables(vm);
            vm.query.status = 'opened';
            vm.query.sort = 'id';

            // refresh sidebar menu projects list
            projectsService.updateList();
        }

        function createProject() {
            $auth.getSettings(function (settings) {
                if (settings['projects.multiple.projects'] != 'unlimited' &&
                  settings['projects.multiple.projects'] <= vm.projects.length) {
                    $rootScope.packageAlert('PROJECTS_LIST.TOO_MANY');
                } else {
                    $location.path('/projects/form/new');
                }
            });
        }

        /**
         * get contractors
         */
        function getProjects() {
            vm.promise = api.projects.get(vm.query, function (response) {
                vm.projects = response.data;
                vm.pagination = response.meta.pagination;

                // create new project if none
                if (!response.data.length && projectsService.hasAccess(['owner', 'admin'])) {
                    $location.path('/projects/form/new');
                }
            }).$promise;
        }

        /**
         * delete contractor
         * @param id
         */
        function deleteProjects(id) {
            dialogService.confirm(null, 'PROJECTS_LIST.DELETE', function() {
                api.project.delete({id:id}, function () {
                    vm.msg_success = transService.translate('PROJECTS_LIST.DELETE_SUCCESS');
                    vm.msg_error = '';
                    getProjects();
                    init();

                },function (response) {
                    vm.msg_error = transService.getErrorMassage(response);
                })
            });
        }

        /**
         * delete contractor
         * @param id
         */
        function closeProjects(id) {
            dialogService.confirm(null, 'PROJECTS_LIST.CLOSE_QUESTION', function() {
                api.projectClose.put({id:id, status: 'close'}, function () {
                    vm.msg_success = transService.translate('PROJECTS_LIST.CLOSE_SUCCESS');
                    vm.msg_error = '';
                    getProjects();
                    init();

                },function (response) {
                    vm.msg_error = transService.getErrorMassage(response);
                })
            });
        }

        /**
         * delete contractor
         * @param id
         */
        function openProjects(id) {
            dialogService.confirm(null, 'PROJECTS_LIST.OPEN_QUESTION', function() {
                api.projectClose.put({id:id, status: 'open'}, function () {
                    vm.msg_success = transService.translate('PROJECTS_LIST.OPEN_SUCCESS');
                    vm.msg_error = '';
                    getProjects();
                    init();

                },function (response) {
                    vm.msg_error = transService.getErrorMassage(response);
                })
            });
        }

        function edit(id) {
            $location.path('/projects/form/edit/' + id);
        }

        function clone(project) {
            dialogService.customDialog(
                null,
                'cloneProjectDialogController',
                'app/main/projects/clone-dialog/clone-dialog.html',
                { project_id: project.id, project_name: project.name }
            );
        }

        function show(id) {
            $location.path('/projects/' + id + '/agile');
        }


        /**
         * Search projects through name (request to API)
         */
        function searchProjects() {
            vm.query.search = vm.search.toLowerCase();
            vm.promise = api.projects.get(vm.query, function (response) {
                vm.projects = response.data;
                vm.pagination = response.meta.pagination;
            }).$promise;
        }

        function onPaginationChanged() {
            vm.getProjects();
            tableService.scrollToTableTop();
        }

        //////////
    }
})();
