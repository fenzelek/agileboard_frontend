(function ()
{
    'use strict';

    angular
        .module('app.reset-password', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider.state('app.reset-password', {
            url      : '/guest/reset-password/:token',
            views    : {
                'main@'                                : {
                    templateUrl: 'app/core/layouts/content-only.html',
                    controller : 'MainController as vm'
                },
                'content@app.reset-password': {
                    templateUrl: 'app/main/auth/reset-password/reset-password.html',
                    controller : 'ResetPasswordController as vm'
                }
            },
            bodyClass: 'reset-password'
        });
    }

})();