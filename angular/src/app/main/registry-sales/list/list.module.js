(function ()
{
    'use strict';

    angular
        .module('app.registry-sales', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        var params = {limit:__env.table_limit_rows, year: moment().format('YYYY'), month: moment().format('M'), no_invoice: 1};
        // State
        $stateProvider
            .state('app.registry-sales', {
                url    : '/registry-sales/list',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/registry-sales/list/list.html',
                        controller : 'RegistrySalesController as vm'
                    }
                },
                bodyClass: 'registry-sales-page',
                resolve  : {
                    InvoiceTypesList: function (apiResolver)
                    {
                        return apiResolver.resolve('invoiceTypes@get', {register: 1});
                    },
                    TaxesList: function (apiResolver)
                    {
                        return apiResolver.resolve('taxs@get');
                    },
                    UsersList: function (apiResolver)
                    {
                        return apiResolver.resolve('company.users@get');
                    },
                    PaymentMethodsList: function (apiResolver)
                    {
                        return apiResolver.resolve('paymentsMethod.list@get');
                    },
                    RegistryInvoicesList: function (apiResolver)
                    {
                        return apiResolver.resolve('registryInvoices@get', params);
                    },
                    RegistryInvoicesReportList: function (apiResolver)
                    {
                        return apiResolver.resolve('reports.registryInvoices@get', params);
                    },
                    OnlineSalesList: function (apiResolver)
                    {
                        return apiResolver.resolve('onlineSales@get', params);
                    },
                    OnlineSalesReportList: function (apiResolver)
                    {
                        return apiResolver.resolve('reports.onlineSales@get', params);
                    },
                    ReceiptsList: function (apiResolver)
                    {
                        return apiResolver.resolve('receipts@get', params);
                    },
                    ReceiptsReportList: function (apiResolver)
                    {
                        return apiResolver.resolve('reports.receipts@get', params);
                    }
                }
            });
    }
})();