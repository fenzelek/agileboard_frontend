(function ()
{
    'use strict';

    angular
        .module('app.page.unauthorized', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.page_unauthorized', {
                url    : '/page/unauthorized',
                views  : {
                    'main@': {
                        templateUrl: 'app/core/layouts/content-only.html',
                        controller : 'MainController as vm'
                    },
                    'content@app.page_unauthorized': {
                        templateUrl: 'app/main/pages/unauthorized/unauthorized.html',
                        controller : 'UnauthorizedController as vm'
                    }
                },
                bodyClass: 'unauthorized'
            });
    }
})();
