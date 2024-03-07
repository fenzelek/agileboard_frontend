(function ()
{
    'use strict';

    angular
        .module('app.contractors-list', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.contractors-list', {
                url    : '/contractors/list',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/contractors/list/list.html',
                        controller : 'ContractorsListController as vm'
                    }
                },
                resolve  : {
                    ContractorsList: function (apiResolver)
                    {
                        return apiResolver.resolve('contractors@get', {limit:__env.table_limit_rows});
                    }
                }
            });
    }
})();