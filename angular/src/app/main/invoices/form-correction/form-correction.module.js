(function ()
{
    'use strict';

    angular
        .module('app.invoices-form-correction', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.invoice-form-correction', {
                url    : '/invoices/form-correction/:id',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/invoices/form-correction/form-correction.html',
                        controller : 'InvoicesFormCorrectionController as vm'
                    }
                },
                resolve  : {
                    CurrentCompany: function (apiResolver)
                    {
                        return apiResolver.resolve('currentCompany@get');
                    },
                    InvoiceCorrectionTypesList: function (apiResolver, $stateParams)
                    {
                        return apiResolver.resolve('invoiceCorrectionTypes@get', {invoice_id:$stateParams.id});
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
                }
            })
    }
})();
