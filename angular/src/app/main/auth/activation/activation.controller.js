(function ()
{
    'use strict';

    angular
        .module('app.activation')
        .controller('ActivationController', ActivationController);

    /** @ngInject */
    function ActivationController($stateParams, $window, $timeout, api, $auth, transService)
    {

        var vm = this;
        transService.loadFile('main/auth/activation');

        vm.msg_success = '';
        vm.msg_error = '';
        vm.error_code = '';
        // vm.form = {email : $stateParams.email};
        vm.form = {
            email : '',
            url: 'http://' + api.url + 'guest/activation/:token',
            language: transService.getLanguage()
        };
        vm.recreate_form = false;
        vm.request_sending = false;

        // Methods
        vm.recreate = recreate;
        vm.changeLanguage = transService.changeLanguage;

        //open only reactivate
        if ($stateParams.token == 'false') {

            vm.recreate_form = true;

        } else {

            //send activation
            api.activation.activation.put({
                    // email: $stateParams.email,
                    activation_token: $stateParams.token
                },
                //success
                function (response) {

                    if ($auth.check()) {
                        vm.msg_success = transService.translate('ACTIVATION.ACCOUNT.ACTIVE_2');
                    } else {
                        vm.msg_success = transService.translate('ACTIVATION.ACCOUNT.ACTIVE');
                        $timeout(function () {
                            if (response.data.token) {
                                $auth.login(response.data.token);
                            }
                        }, 5000);
                    }
                },
                //error
                function (response) {

                    switch (response.data.code) {
                        case 'general.validation_failed':
                            vm.error_code = 'broken-link';
                            break;
                        case 'general.user_not_found':
                            vm.error_code = 'user-not-found';
                            break;
                        case 'activation.user_already_activated':
                            $window.sessionStorage.login_info = transService.translate('ACTIVATION.ACCOUNT.ACTIVE_BEFORE');
                            $auth.redirectTo('/guest/login');
                            break;
                        default:
                            vm.msg_error = transService.getErrorMassage(response);
                    }
                }
            );
        }
        /**
         * resend the activation e-mail
         */
        function recreate()
        {
            vm.request_sending = true;
            vm.msg_success = '';
            vm.msg_error = '';
            vm.error_code = '';

            api.activation.recreate.put(vm.form,
                //success
                function() {
                    vm.msg_success = transService.translate('ACTIVATION.RECREATE.OK');
                    vm.request_sending = false;
                },
                //error
                function() {
                    vm.msg_error = transService.translate('ACTIVATION.RECREATE.ERROR');
                    vm.request_sending = false;
                }
            );
        }
    }
})();
