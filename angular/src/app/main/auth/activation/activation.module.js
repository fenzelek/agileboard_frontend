(function ()
{
    'use strict';

    angular
        .module('app.activation', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider.state('app.activation', {
            url      : '/guest/activation/:token',
            views    : {
                'main@'                                : {
                    templateUrl: 'app/core/layouts/content-only.html',
                    controller : 'MainController as vm'
                },
                'content@app.activation': {
                    templateUrl: 'app/main/auth/activation/activation.html',
                    controller : 'ActivationController as vm'
                }
            },
            bodyClass: 'activation'
        });
    }

})();