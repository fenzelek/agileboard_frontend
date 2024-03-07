(function ()
{
    'use strict';

    angular
        .module('app.invoices-list', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.invoices-list', {
                url    : '/invoices/list',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/invoices/list/list.html',
                        controller : 'InvoicesListController as vm'
                    }
                },
                resolve  : {
                    InvoicesList: function (apiResolver)
                    {
                        return apiResolver.resolve('invoices@get', {status: 'all', sort: '-id', limit:__env.table_limit_rows});
                    },
                    InvoiceTypesList: function (apiResolver)
                    {
                        return apiResolver.resolve('invoiceTypes@get');
                    },
                    InvoiceSettings: function (apiResolver)
                    {
                        return apiResolver.resolve('invoiceSettings@get');
                    },
                    InvoiceFormats: function (apiResolver)
                    {
                        return apiResolver.resolve('invoiceFormats@get');
                    },
                    InvoicesReportList: function (apiResolver)
                    {
                      return apiResolver.resolve('reports.invoices@get');
                    },
                    InvoiceFilters: function (apiResolver)
                    {
                      return apiResolver.resolve('invoiceFilters@get');
                    }
                }
            });
    }
})();
