(function ()
{
    'use strict';

    angular
        .module('app.login-quick', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider.state('app.login-quick', {
            url      : '/guest/login/:token',
            views    : {
                'main@'                                : {
                    templateUrl: 'app/core/layouts/content-only.html',
                    controller : 'MainController as vm'
                },
                'content@app.login-quick': {
                    templateUrl: 'app/main/auth/login-quick/login-quick.html',
                    controller : 'LoginQuickController as vm'
                }
            },
            bodyClass: 'login-quick'
        });
    }

})();