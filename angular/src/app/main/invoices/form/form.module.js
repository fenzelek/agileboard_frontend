(function ()
{
    'use strict';

    angular
        .module('app.invoices-form', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.invoice-form-new', {
                url    : '/invoices/form/new',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/invoices/form/form.html',
                        controller : 'InvoicesFormController as vm'
                    }
                },
                resolve: {
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
                    InvoiceTypesList: function (apiResolver)
                    {
                        return apiResolver.resolve('invoiceTypes@get');
                    },
                    ProductsListShortList: function (apiResolver)
                    {
                        return apiResolver.resolve('products@get', {limit: 3, sort:'-is_used'});
                    }
                }
            })
            .state('app.invoices-form-new-receipts', {
                url    : '/invoices/form/new/receipts?ids',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/invoices/form/form.html',
                        controller : 'InvoicesFormController as vm'
                    }
                },
                resolve: {
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
                    InvoiceTypesList: function (apiResolver)
                    {
                        return apiResolver.resolve('invoiceTypes@get');
                    },
                    ProductsListShortList: function (apiResolver)
                    {
                        return apiResolver.resolve('products@get', {limit: 3, sort:'-is_used'});
                    }
                }
            })
            .state('app.invoices-form-new-receipt', {
                url    : '/invoices/form/new/receipt/:receipt_id',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/invoices/form/form.html',
                        controller : 'InvoicesFormController as vm'
                    }
                },
                resolve: {
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
                    InvoiceTypesList: function (apiResolver)
                    {
                        return apiResolver.resolve('invoiceTypes@get');
                    },
                    ProductsListShortList: function (apiResolver)
                    {
                        return apiResolver.resolve('products@get', {limit: 3, sort:'-is_used'});
                    }
                }
            })
            .state('app.invoices-form-new-online-sales', {
                url    : '/invoices/form/new/online-sales/:online_sales_id',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/invoices/form/form.html',
                        controller : 'InvoicesFormController as vm'
                    }
                },
                resolve: {
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
                    InvoiceTypesList: function (apiResolver)
                    {
                        return apiResolver.resolve('invoiceTypes@get');
                    },
                    ProductsListShortList: function (apiResolver)
                    {
                        return apiResolver.resolve('products@get', {limit: 3, sort:'-is_used'});
                    }
                }
            })
            .state('app.invoices-form-new-type', {
                url    : '/invoices/form/new/type/:type',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/invoices/form/form.html',
                        controller : 'InvoicesFormController as vm'
                    }
                },
                resolve: {
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
                    InvoiceTypesList: function (apiResolver)
                    {
                        return apiResolver.resolve('invoiceTypes@get');
                    },
                    ProductsListShortList: function (apiResolver)
                    {
                        return apiResolver.resolve('products@get', {limit: 3, sort:'-is_used'});
                    }
                }
            })
            .state('app.invoices-form-new-invoice', {
                url    : '/invoices/form/new/invoice/:invoice_id',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/invoices/form/form.html',
                        controller : 'InvoicesFormController as vm'
                    }
                },
                resolve: {
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
                    InvoiceTypesList: function (apiResolver)
                    {
                        return apiResolver.resolve('invoiceTypes@get');
                    },
                    ProductsListShortList: function (apiResolver)
                    {
                        return apiResolver.resolve('products@get', {limit: 3, sort:'-is_used'});
                    }
                }
            })
            .state('app.invoices-form-new-contractor', {
                url    : '/invoices/form/new/:contractor_id',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/invoices/form/form.html',
                        controller : 'InvoicesFormController as vm'
                    }
                },
                resolve: {
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