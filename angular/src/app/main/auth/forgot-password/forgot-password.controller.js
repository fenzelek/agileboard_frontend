(function ()
{
    'use strict';

    angular
        .module('app.forgot-password')
        .controller('ForgotPasswordController', ForgotPasswordController);

    /** @ngInject */
    function ForgotPasswordController(api, $window, $auth, transService)
    {
        var vm = this;
        transService.loadFile('main/auth/forgot-password');

        // Data
        vm.form = {
            email: '',
            url: 'http://' + api.url + 'guest/reset-password/:token',
            language: transService.getLanguage()
        };
        vm.msg_success = '';
        vm.msg_error = '';

        // Methods
        vm.forgotPassword = forgotPassword;
        vm.changeLanguage = transService.changeLanguage;

        //////////

        function forgotPassword()
        {
            vm.request_sending = true;

            api.auth.passwordReset.save(vm.form,
                // success
                function() {
                    vm.msg_error = '';
                    vm.msg_success = transService.translate('FORGOTPASSWORD.SUCCESS');
                    vm.request_sending = false;
                },
                // error
                function(response) {
                    vm.msg_error = transService.getErrorMassage(response);
                    vm.msg_success = '';
                    vm.request_sending = false;
                }
            );
        }
    }
})();