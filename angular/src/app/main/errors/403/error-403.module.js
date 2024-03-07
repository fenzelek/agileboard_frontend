(function ()
{
    'use strict';

    angular
        .module('app.pages.error-403', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msNavigationServiceProvider)
    {
        // State
        $stateProvider.state('app.pages_errors_error-403', {
            url      : '/error-403',
            views    : {
                'main@'                             : {
                    templateUrl: 'app/core/layouts/content-only.html',
                    controller : 'MainController as vm'
                },
                'content@app.pages_errors_error-403': {
                    templateUrl: 'app/main/errors/403/error-403.html',
                    controller : 'Error403Controller as vm'
                }
            },
            bodyClass: 'error-403'
        });

    }

})();