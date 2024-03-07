(function ()
{
    'use strict';

    angular
        .module('app.cash-operations-list', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.cash-operations-list', {
                url    : '/cash-operations/list',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/cash-operations/list/list.html',
                        controller : 'CashOperationsListController as vm'
                    }
                },
                resolve  : {
                    UsersList: function (apiResolver) {
                        return apiResolver.resolve('company.users@get');
                    }
                }
            });
    }
})();