(function ()
{
    'use strict';

    angular
        .module('app.login-quick')
        .controller('LoginQuickController', LoginQuickController);

    /** @ngInject */
    function LoginQuickController($stateParams, api, $auth, transService)
    {

        var vm = this;
        transService.loadFile('main/auth/login-quick');

        vm.changeLanguage = transService.changeLanguage;

        vm.msg_success = '';
        vm.msg_error = '';

        //send activation
        api.auth.quick.save({
                token: $stateParams.token
            },
            //success
            function (response) {
                $auth.login(response.data.token);
            },
            //error
            function (response) {

                switch (response.data.code) {
                    case 'auth.user_already_logged':
                        $auth.redirectTo('/');
                        break;
                    default:
                        vm.msg_error = transService.getErrorMassage(response);
                }
            }
        );
    }
})();