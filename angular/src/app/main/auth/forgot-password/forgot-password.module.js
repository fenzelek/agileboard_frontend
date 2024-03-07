(function ()
{
    'use strict';

    angular
        .module('app.forgot-password', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider.state('app.forgot-password', {
            url      : '/guest/forgot-password',
            views    : {
                'main@'                                 : {
                    templateUrl: 'app/core/layouts/content-only.html',
                    controller : 'MainController as vm'
                },
                'content@app.forgot-password': {
                    templateUrl: 'app/main/auth/forgot-password/forgot-password.html',
                    controller : 'ForgotPasswordController as vm'
                }
            },
            bodyClass: 'forgot-password'
        });
    }

})();