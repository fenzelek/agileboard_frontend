(function ()
{
    'use strict';

    angular
        .module('app.register', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider.
            state('app.register', {
                url      : '/guest/register', //and register
                views    : {
                    'main@'                          : {
                        templateUrl: 'app/core/layouts/content-only.html',
                        controller : 'MainController as vm'
                    },
                    'content@app.register': {
                        templateUrl: 'app/main/auth/register/register.html',
                        controller : 'RegisterController as vm'
                    }
                },
                bodyClass: 'register'
            }).
            state('app.register-plan', {
                url      : '/guest/register/plan/:plan',
                views    : {
                    'main@'                          : {
                        templateUrl: 'app/core/layouts/content-only.html',
                        controller : 'MainController as vm'
                    },
                    'content@app.register-plan': {
                        templateUrl: 'app/main/auth/register/register.html',
                        controller : 'RegisterController as vm'
                    }
                },
                bodyClass: 'register'
            }).
            state('app.register-plan-key', {
                url      : '/guest/register/plan/:plan/:key',
                views    : {
                    'main@'                          : {
                        templateUrl: 'app/core/layouts/content-only.html',
                        controller : 'MainController as vm'
                    },
                    'content@app.register-plan-key': {
                        templateUrl: 'app/main/auth/register/register.html',
                        controller : 'RegisterController as vm'
                    }
                },
                bodyClass: 'register'
            });
    }

})();