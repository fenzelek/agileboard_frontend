(function ()
{
    'use strict';

    angular
        .module('app.online-sales-list', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.online-sales-list', {
                url    : '/online-sales/list',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/online-sales/list/list.html',
                        controller : 'OnlineSalesListController as vm'
                    }
                },
                resolve  : {
                    OnlineSalesList: function (apiResolver)
                    {
                        return apiResolver.resolve('onlineSales@get', {limit:__env.table_limit_rows});
                    },
                    OnlineSalesReportList: function (apiResolver)
                    {
                        return apiResolver.resolve('reports.onlineSales@get');
                    }
                }
            });
    }
})();