(function ()
{
    'use strict';

    angular
        .module('app.agile-statuses')
        .controller('AgileStatusesController', AgileStatusesController);

    /** @ngInject */
    function AgileStatusesController(transService, projectsService, $stateParams, api, $location, formService, $sce, $window, $scope, $timeout)
    {
        var vm = this;
        transService.loadFile('main/agile/statuses');

        projectsService.setCurrent($stateParams.project_id);

        vm.msg_error = '';
        vm.msg_success = '';
        vm.request_sending = false;
        vm.edit = false;
        vm.loading_statuses = false;
        vm.scheme_index = -1;
        vm.scheme_list = [];
        vm.projects = [];
        vm.selected_project_id = null;

        vm.form = {
            project_id: $stateParams.project_id,
            statuses: []
        };

        var status = {
            id:0,
            delete:0,
            name:'',
            new_status:0,
            added_status:1
        };

        vm.sortableOptions = {
            handle     : '.handle'
        };

        vm.selectScheme = selectScheme;
        vm.selectProject = selectProject;
        vm.deleteStatus = deleteStatus;
        vm.addStatus = addStatus;
        vm.save = save;

        $scope.$watch( function() { return $window.localStorage.language }, function() {
            $timeout(function() {
                getSchemeList();
            }, 300);
        });

        init();

        function init() {
            
            getSchemeList();

            vm.form.statuses = [];
            vm.loading_statuses = true;
            api.agileStatuses.get({project_id: $stateParams.project_id}, function (response) {
                vm.loading_statuses = false;
                if (response.data.length) {
                    angular.forEach(response.data, function (item) {
                        item.delete = 0;
                        item.new_status = 0;
                        item.added_status = 0;
                        vm.form.statuses.push(item);
                    });
                    vm.edit = true;
                }
            });
        }

        function getSchemeList() {
            vm.scheme_list = [];
            api.agileStatusesList.get({ 
                lang: transService.getLanguage()
            }, function (response) {
                vm.scheme_list = response.data;
                // add "from project" option 
                vm.scheme_list.push( { name: transService.translate('AGILE_STATUSES.FROM_PROJECT') } );
            });
        }

        function selectScheme() {
            // "From project" statuses selected
            // get project list
            if(vm.scheme_index == vm.scheme_list.length - 1) {
                vm.form.statuses = [];
                
                api.projects.get({
                    has_access: 1
                }, function (response) {
                    vm.projects = response.data;
                    // remove current project from list
                    angular.forEach(response.data, function(project, key) {
                        if (project.id == $stateParams.project_id) {
                            vm.projects.splice(key, 1);
                        }
                    });
                });
            } else { // select statuses from list
                vm.form.statuses = [];
                vm.form.statuses = angular.copy(vm.scheme_list[vm.scheme_index].statuses);
                vm.projects = []; 
                vm.selected_project_id = null;
            }
        }

        function selectProject() {
            // get project statuses
            api.agileStatuses.get({ project_id: vm.selected_project_id, tickets: 0 }, function (response) {
                vm.form.statuses = [];
                vm.form.statuses = response.data;
            });
        }

        function deleteStatus(index) {
            if (vm.edit && vm.form.statuses[index].added_status == 0) {
                vm.form.statuses[index].delete = 1;
            } else {
                vm.form.statuses.splice(index, 1);
            }
        }

        function addStatus() {
            vm.form.statuses.push(angular.copy(status, {}));
        }

        function save() {
            $location.hash('');
            vm.request_sending = true;
            // apiErrorsService.clear('#formContractor', vm);

            if (vm.edit) {

                var count = 0;
                var new_status = 0;
                angular.forEach(vm.form.statuses, function (status) {
                    if (!status.delete && status.id && !new_status) {
                        new_status = status.id;
                    }
                });

                angular.forEach(vm.form.statuses, function (status, key) {
                    if (status.name.trim() == '' && vm.form.statuses.added_status) {
                        vm.form.statuses.splice(key, 1);
                    }

                    if (!status.delete) {
                        ++count;
                    } else {
                        status.new_status = new_status;
                    }
                });

                if (count < 2) {
                    vm.msg_success = '';
                    vm.msg_error = transService.translate('AGILE_STATUSES.ERROR_COUNT');
                    vm.request_sending = false;                    
                    return;
                }

                api.agileStatuses.put(vm.form,
                    // success
                    function() {
                        vm.msg_error = '';
                        vm.msg_success = transService.translate('AGILE_STATUSES.SAVED_SUCCESS');
                        vm.request_sending = false;
                        formService.formUp();
                        init();
                    },
                    // error
                    function(response) {
                        vm.msg_error = transService.getErrorMassage(response);
                        vm.msg_success = '';
                        vm.request_sending = false;
                        formService.formUp();
                    }
                );
            } else {

                // remove empty statuses
                angular.forEach(vm.form.statuses, function (status, key) {
                    if (status.name.trim() == '') {
                        vm.form.statuses.splice(key, 1);
                    }
                });

                // check limit
                if (vm.form.statuses.length < 2) {
                    vm.msg_success = '';
                    vm.msg_error = transService.translate('AGILE_STATUSES.ERROR_COUNT');
                    vm.request_sending = false;

                    return;
                }

                api.agileStatuses.save(vm.form,
                    // success
                    function() {
                        //reload
                        vm.msg_error = '';
                        vm.msg_success = transService.translate('AGILE_STATUSES.SAVED_SUCCESS');
                        vm.request_sending = false;
                        formService.formUp();
                        // redirect to board configuration
                        $location.path('/projects/' + $stateParams.project_id + '/agile');
                    },
                    // error
                    function(response) {
                        vm.msg_error = transService.getErrorMassage(response);
                        vm.msg_success = '';
                        vm.request_sending = false;
                        formService.formUp();
                    }
                );
            }
        }
    }
})();
