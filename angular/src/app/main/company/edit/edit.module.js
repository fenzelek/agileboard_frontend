(function ()
{
    'use strict';

    angular
        .module('app.company-edit', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.company-edit', {
                url    : '/company/edit?first&user&package',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/company/edit/edit.html',
                        controller : 'CompanyEditController as vm'
                    }
                },
                resolve  : {
                    CurrentCompany: function (apiResolver)
                    {
                        return apiResolver.resolve('currentCompany@get');
                    },
                    Roles: function (apiResolver)
                    {
                        return apiResolver.resolve('roles@get');
                    },
                    Countries: function (apiResolver)
                    {
                        return apiResolver.resolve('company.countries@get');
                    },
                    InvoiceFormats: function (apiResolver, $rootScope)
                    {
                        return $rootScope.invoices_active ?
                            apiResolver.resolve('invoiceFormats@get') : { data: [] };
                    },
                    PaymentsMethod: function (apiResolver, $rootScope)
                    {
                        return $rootScope.invoices_active ?
                            apiResolver.resolve('paymentsMethod.list@get') : { data: [] };
                    },
                    VatReleaseReasons: function (apiResolver, $rootScope)
                    {
                        return $rootScope.invoices_active ?
                            apiResolver.resolve('vatReleaseReasons@get') : { data: [] };
                    },
                    TaxOffices: function (apiResolver, $rootScope)
                    {
                        return $rootScope.invoices_active ?
                            apiResolver.resolve('taxOffices@get') : { data: [] };
                    }
                }
            });
    }
})();
