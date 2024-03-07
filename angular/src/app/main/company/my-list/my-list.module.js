(function ()
{
    'use strict';

    angular
        .module('app.my-list', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.my-list', {
                url    : '/company/my-list?open',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/company/my-list/my-list.html',
                        controller : 'MyListController as vm'
                    }
                },
                bodyClass: 'company-list'                
            })
            .state('app.my-list-open', {
                url    : '/company/my-list/:open',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/company/my-list/my-list.html',
                        controller : 'MyListController as vm'
                    }
                },
                bodyClass: 'company-list'                
            });
    }
})();
