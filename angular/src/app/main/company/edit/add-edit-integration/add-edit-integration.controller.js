(function ()
{
    'use strict';

    angular
        .module('app.company-edit')
        .controller('addEditIntegrationDialogController', addEditIntegrationDialogController);

    /** @ngInject */
    function addEditIntegrationDialogController(transService, $mdDialog, api, apiErrorsService, $window)
    {
        var vm = this;

        vm.msg_success = '';
        vm.msg_error = '';
        vm.request_sending = false;
        vm.providers = [];
        vm.lang = transService.getLanguage();

        vm.form = {
            integration_provider_id: '',
            settings: {
                app_token: '',
                auth_token: '',
                start_time: ''
            }
        };

        vm.hide = hide;
        vm.create = create;

        init();

        function init() {
            api.integrations.providers.get({}, function (response) {
                vm.providers = response.data;
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
            apiErrorsService.clear('#addEditIntegration', vm);

            api.integrations.list.save(vm.form,
                // success
                function() {
                    $mdDialog.hide(true);
                    // vm.msg_error = '';
                    // vm.msg_success = transService.translate('COMPANY_EDIT.USER.ADD_SUCCESS');
                    // vm.request_sending = false;
                },
                // error
                function(response) {
                    apiErrorsService.show('#addEditIntegration', response, vm, []);
                    vm.request_sending = false;
                    vm.msg_error = transService.getErrorMassage(response);
                }
            );
        }
    }

})();
