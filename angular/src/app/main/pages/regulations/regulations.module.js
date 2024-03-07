(function ()
{
    'use strict';

    angular
        .module('app.page.regulations', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.page_regulations', {
                url    : '/page/regulations',
                views    : {
                    'main@': {
                        templateUrl: 'app/core/layouts/content-only.html',
                        controller : 'MainController as vm'
                    },
                    'content@app.page_regulations': {
                        templateUrl: 'app/main/pages/regulations/regulations.html',
                        controller : 'RegulationsController as vm'
                    }
                },
                bodyClass: 'regulations'
            });
    }
})();