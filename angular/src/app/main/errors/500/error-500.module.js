(function ()
{
    'use strict';

    angular
        .module('app.pages.error-500', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider, $translatePartialLoaderProvider, msNavigationServiceProvider)
    {
        // State
        $stateProvider.state('app.pages_errors_error-500', {
            url      : '/error-500',
            views    : {
                'main@'                             : {
                    templateUrl: 'app/core/layouts/content-only.html',
                    controller : 'MainController as vm'
                },
                'content@app.pages_errors_error-500': {
                    templateUrl: 'app/main/errors/500/error-500.html',
                    controller : 'Error500Controller as vm'
                }
            },
            bodyClass: 'error-500'
        });

    }

})();