(function ()
{
    'use strict';

    angular
        .module('app.user-edit', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider, msNavigationServiceProvider)
    {
        // State
        $stateProvider
            .state('app.user-edit', {
                url    : '/user-edit',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/auth/user-edit/user-edit.html',
                        controller : 'UserEditController as vm'
                    }
                }
            });
    }
})();