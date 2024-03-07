(function ()
{
    'use strict';

    angular
        .module('app.receipts-list', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.receipts-list', {
                url    : '/receipts/list',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/receipts/list/list.html',
                        controller : 'ReceiptsListController as vm'
                    }
                },
                resolve  : {
                    UsersList: function (apiResolver)
                    {
                        return apiResolver.resolve('company.users@get');
                    },
                    PaymentMethodsList: function (apiResolver)
                    {
                        return apiResolver.resolve('paymentsMethod.list@get');
                    },
                    ReceiptsList: function (apiResolver)
                    {
                        return apiResolver.resolve('receipts@get', {limit:__env.table_limit_rows});
                    },
                    ReceiptsReportList: function (apiResolver)
                    {
                        return apiResolver.resolve('reports.receipts@get');
                    }
                }
            });
    }
})();