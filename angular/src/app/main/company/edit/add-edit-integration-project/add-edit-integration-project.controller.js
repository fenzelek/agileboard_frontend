(function ()
{
    'use strict';

    angular
        .module('app.company-edit')
        .controller('addEditIntegrationProjectDialogController', addEditIntegrationProjectDialogController);

    /** @ngInject */
    function addEditIntegrationProjectDialogController(transService, $mdDialog, api, apiErrorsService, integration)
    {
        var vm = this;

        vm.msg_success = '';
        vm.msg_error = '';
        vm.request_sending = false;
        vm.project = integration.project.data;

        vm.form = {
            time_tracking_project: integration.id,
            project_id: integration.project.data ? integration.project.data.id : ''
        };

        vm.hide = hide;
        vm.searchProjects = searchProjects;
        vm.create = create;

        function searchProjects(name) {

            return api.projects.get({
                    limit: 15,
                    page: 1,
                    search: name
                }
            ).$promise.then(function (response) {
                return response.data;
            });
        }

        function hide() {
            $mdDialog.hide();
        }

        /**
         * Create user
         */
        function create() {

            vm.request_sending = true;
            apiErrorsService.clear('#addEditIntegrationProject', vm);

            vm.form.project_id = vm.project ? vm.project.id : null;

            api.integrations.setProject.put(vm.form,
                // success
                function() {
                    $mdDialog.hide(true);
                    // vm.msg_error = '';
                    // vm.msg_success = transService.translate('COMPANY_EDIT.USER.ADD_SUCCESS');
                    // vm.request_sending = false;
                },
                // error
                function(response) {
                    apiErrorsService.show('#addEditIntegrationProject', response, vm, []);
                    vm.request_sending = false;
                    vm.msg_error = transService.getErrorMassage(response);
                }
            );
        }
    }

})();
