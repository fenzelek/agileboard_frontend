(function ()
{
    'use strict';

    angular
        .module('app.page.cookie', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.page_cookie', {
                url    : '/page/cookie',
                views    : {
                    'main@': {
                        templateUrl: 'app/core/layouts/content-only.html',
                        controller : 'MainController as vm'
                    },
                    'content@app.page_cookie': {
                        templateUrl: 'app/main/pages/cookie/cookie.html',
                        controller : 'CookieController as vm'
                    }
                },
                bodyClass: 'cookie'
            });
    }
})();