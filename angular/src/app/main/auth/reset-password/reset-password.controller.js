(function ()
{
    'use strict';

    angular
        .module('app.reset-password')
        .controller('ResetPasswordController', ResetPasswordController);

    /** @ngInject */
    function ResetPasswordController($stateParams, $window, api, $auth, transService, $location)
    {
        var vm = this;
        transService.loadFile('main/auth/reset-password');

        // Data
        vm.form = {
            email: '',
            password: '',
            password_confirmation: '',
            token: $stateParams.token
        }
        vm.msg_success = '';
        vm.msg_error = '';
        vm.not_reset_link = '';
        vm.request_sending = false;

        // Methods
        vm.reset = reset;
        vm.changeLanguage = transService.changeLanguage;

        //////////
        function reset()
        {
            vm.request_sending = true;

            api.auth.passwordReset.put(vm.form,
                //success
                function(response) {
                    if ($auth.check()) {
                        vm.msg_success = transService.translate('RESETPASSWORD.SUCCESS_2');
                    } else {
                        vm.msg_success = transService.translate('RESETPASSWORD.SUCCESS');
                        $window.sessionStorage.passwordChangedEmail = vm.form.email;
                        $location.path('/guest/login');

                    }
                    vm.request_sending = false;
                },
                //error
                function(response) {
                    if (response.data.code == 'password.invalid_token') {
                        vm.not_reset_link = '/guest/forgot-password';
                    } else {
                        vm.msg_error = transService.getErrorMassage(response);
                    }
                    vm.request_sending = false;
                }
            );
        }
    }
})();