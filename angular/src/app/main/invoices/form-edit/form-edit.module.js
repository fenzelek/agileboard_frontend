(function ()
{
    'use strict';

    angular
        .module('app.invoices-form-edit', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.invoice-form-edit', {
                url    : '/invoices/form/edit/:id',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/invoices/form-edit/form-edit.html',
                        controller : 'InvoicesFormEditController as vm'
                    }
                },
                resolve  : {
                    CurrentCompany: function (apiResolver)
                    {
                        return apiResolver.resolve('currentCompany@get');
                    },
                    TaxesList: function (apiResolver)
                    {
                        return apiResolver.resolve('taxs@get');
                    },
                    UnitsList: function (apiResolver)
                    {
                        return apiResolver.resolve('units@get');
                    },
                    PaymentMethodsList: function (apiResolver)
                    {
                        return apiResolver.resolve('paymentsMethod.list@get', {invoice_restrict:1});
                    },
                    Invoice: function (apiResolver, $stateParams)
                    {
                        return apiResolver.resolve('invoice@get', {id:$stateParams.id});
                    },
                    InvoiceTypesList: function (apiResolver)
                    {
                        return apiResolver.resolve('invoiceTypes@get');
                    },
                    ProductsListShortList: function (apiResolver)
                    {
                        return apiResolver.resolve('products@get', {limit: 3, sort:'-is_used'});
                    }
                }
            });
    }
})();
