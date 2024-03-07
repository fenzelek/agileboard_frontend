(function ()
{
    'use strict';

    angular
        .module('app.tokens-form')
        .controller('TokensFormController', TokensFormController);

    /** @ngInject */
    function TokensFormController(transService, api, $stateParams, apiErrorsService, $location)
    {

        var vm = this;
        transService.loadFile('main/tokens/form');

        // Data
        vm.msg_error = '';
        vm.msg_success = '';
        vm.request_sending = false;
        vm.roles = [];

        vm.form = {
            user_id: $stateParams.id,
            role_id: '',
            ip_from: '',
            ip_to: '',
            domain: '',
            ttl: ''
        };

        vm.send = send;

        init();

        function init() {

            api.roles.get({}, function (response) {

                for (var i in response.data) {
                    if (response.data[i].name.indexOf('api.') == 0) {
                        vm.roles.push(response.data[i]);
                    }
                }
            });
        }

        function send() {

            $location.hash('');
            vm.request_sending = true;
            apiErrorsService.clear('#formToken', vm);

            api.company.tokens.save(vm.form,
                // success
                function() {
                    vm.msg_error = '';
                    vm.msg_success = transService.translate('TOKENS_FORM.ADD_SUCCESS');
                    vm.request_sending = false;
                    formService.formUp();
                },
                // error
                function(response) {
                    apiErrorsService.show('#formToken', response, vm, []);
                    vm.msg_error = transService.getErrorMassage(response);
                    vm.msg_success = '';
                    vm.request_sending = false;
                    formService.formUp();
                }
            );

        }
        //////////
    }
})();
