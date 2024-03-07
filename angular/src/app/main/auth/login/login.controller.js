(function ()
{
    'use strict';

    angular
        .module('app.login')
        .controller('LoginController', LoginController);

    /** @ngInject */
    function LoginController($auth, api, $window, transService, $location)
    {
        var vm = this;
        transService.loadFile('main/auth/login');

        // Data
        vm.form = {
            email: '',
            password: ''
        };
        vm.msg_error = '';
        vm.msg_success = '';
        vm.not_active_link = '';

        // Methods
        vm.submitLoginForm = submitLoginForm;
        vm.changeLanguage = transService.changeLanguage;
        //////////

        init();

        function init()
        {
            if ($auth.check()) {
                $auth.redirectToDashboard();
            }
            
            if(typeof $window.sessionStorage.passwordChangedEmail != 'undefined') {
                vm.successMessage = $window.sessionStorage.passwordChangedEmail;
                delete $window.sessionStorage.passwordChangedEmail;
            }

            if(typeof $window.sessionStorage.login_info != 'undefined') {
                vm.msg_success = $window.sessionStorage.login_info;
                delete $window.sessionStorage.login_info;
            }
        }

        function submitLoginForm()
        {
            if (vm.form.email != undefined) {

                api.auth.authenticate.save(vm.form,
                    // Success
                    function (response) {
                        if (response.data.token) {
                            $auth.login(response.data.token);
                        }
                    },
                    // Error
                    function (response) {
                        if (response.data.code == 'auth.user_not_activated') {
                            vm.not_active_link = '/guest/activation/false';
                        } else if (response.data.code == 'auth.user_already_logged') {
                            $auth.redirectToDashboard();
                        } else {
                            vm.msg_error = transService.getErrorMassage(response.data);
                        }
                    }
                );
            }
        }
    }
})();