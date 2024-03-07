(function ()
{
    'use strict';

    angular
    .module('app.core')
    .controller('cloneProjectDialogController', cloneProjectDialogController);

    /** @ngInject */
    function cloneProjectDialogController($rootScope, $location, $timeout, $auth, transService, $mdDialog, api, apiErrorsService, project_id, project_name) {
        transService.loadFile('main/projects/clone-dialog');
        var vm = this;

        vm.msg_success = '';
        vm.msg_error = '';
        vm.request_sending = false;
        vm.shortNameError = false;
        vm.projectName = project_name;

        vm.form = {
            id: project_id,
            name: '',
            short_name: ''
        };

        vm.hide = hide;
        vm.checkShortName = checkShortName;
        vm.clone = clone;

        init();
        function init() {
            api.projects.get({ has_access: 1 }, function (response) {
                var projects = response.data ? response.data.length : 0;
                $auth.getSettings(function (settings) {
                    if (settings['projects.multiple.projects'] != 'unlimited' &&
                      settings['projects.multiple.projects'] <= projects) {
                        $rootScope.packageAlert('CLONE_PROJECT.TOO_MANY_PROJECTS');
                    }
                });
            });
        }

        function hide() {
            $mdDialog.hide();
        }

        /**
        * Check project shortname that arleady exists
        *
        */
        function checkShortName() {
            vm.shortNameError = false;
            if (vm.form.short_name) {
                api.projectExist.get({ short_name: vm.form.short_name }, function () {
                    vm.shortNameError = true;
                }, function () {
                    vm.shortNameError = false;
                });
            }
        }

        /**
        * Clone
        */
        function clone() {
            vm.request_sending = true;
            apiErrorsService.clear('#cloneProject', vm);
            api.projectClone.save(vm.form,
                function (response) {
                    vm.msg_error = '';
                    vm.msg_success = transService.translate('CLONE_PROJECT.CLONED_SUCCESSFULLY');
                    $timeout(function () {
                        $mdDialog.hide(true);
                        $location.path('/projects/' + response.data.id + '/backlog');
                    }, 1000);
                },
                function (response) {
                    apiErrorsService.show('#cloneProject', response, vm, []);
                    vm.request_sending = false;
                    vm.msg_error = transService.getErrorMassage(response);
                    vm.msg_success = '';
                }
            );
        }
    }

})();
