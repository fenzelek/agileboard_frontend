(function ()
{
    'use strict';

    angular
        .module('app.page.switch-company', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.page_switch_company', {
                url    : '/page/switch-company',
                views  : {
                    'main@': {
                        templateUrl: 'app/core/layouts/content-only.html',
                        controller : 'MainController as vm'
                    },
                    'content@app.page_switch_company': {
                        templateUrl: 'app/main/pages/switch-company/switch-company.html',
                        controller : 'SwitchCompanyController as vm'
                    }
                }
            });
    }
})();
