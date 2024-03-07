(function ()
{
    'use strict';

    angular
        .module('app.page.privacy-policy', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.page_privacy-policy', {
                url    : '/page/privacy-policy',
                views    : {
                    'main@': {
                        templateUrl: 'app/core/layouts/content-only.html',
                        controller : 'MainController as vm'
                    },
                    'content@app.page_privacy-policy': {
                        templateUrl: 'app/main/pages/privacy-policy/privacy-policy.html',
                        controller : 'PrivacyPolicyController as vm'
                    }
                },
                bodyClass: 'privacy-policy'
            });
    }
})();