(function ()
{
    'use strict';

    angular
        .module('app.registry-sales')
        .controller('RegistrySalesController', RegistrySalesController);

    /** @ngInject */
    function RegistrySalesController(transService, api, tableService, dialogService, $window, __env, $httpParamSerializer, $auth, $rootScope,
                                     InvoiceTypesList, TaxesList, UsersList, PaymentMethodsList, RegistryInvoicesList, RegistryInvoicesReportList, OnlineSalesList, OnlineSalesReportList, ReceiptsList, ReceiptsReportList)
    {
        var vm = this;
        transService.loadFile('main/registry-sales/list');

        vm.current_year = moment().format('YYYY');
        vm.receipts_active = false;
        vm.download_sales = false;

        vm.tab1 = {
            invoices: RegistryInvoicesList.data,
            pagination: RegistryInvoicesList.meta.pagination,
            invoice_types: InvoiceTypesList.data,
            reports: RegistryInvoicesReportList.data,
            taxes: {},
            msg_error: '',
            enable_jpk: false,
            getInvoices: getInvoices,
            pdfInvoices: pdfInvoices,
            csvInvoices: csvInvoices,
            jpkFa: jpkFa,
            downloadSales: downloadSales
        };

        vm.tab2 = {
            online_sales: OnlineSalesList.data,
            pagination: OnlineSalesList.meta.pagination,
            reports: OnlineSalesReportList.data,
            msg_error: '',
            getOnlineSales: getOnlineSales,
            detailsOnlineSales: detailsOnlineSales,
            pdfOnlineSales: pdfOnlineSales
        };

        vm.tab3 = {
            receipts: ReceiptsList.data,
            pagination: ReceiptsList.meta.pagination,
            reports: ReceiptsReportList.data,
            msg_error: '',
            payments_method: [],
            payments_method2: PaymentMethodsList.data,
            users: UsersList.data,
            getReceipts: getReceipts,
            detailsReceipts: detailsReceipts,
            pdfReceipts: pdfReceipts
        };

        init();

        function init() {

            $auth.getSettings(function (settings) {
                vm.receipts_active = settings['receipts.active'] == "1";
                vm.tab1.enable_jpk = settings['invoices.jpk_export'] == "1";

                $auth.getMyRole(function (role) {
                    if (role == 'tax_office') {
                        vm.download_sales = settings['invoices.registry.export.name'] != "";
                    }
                })
            });

            angular.forEach(TaxesList.data, function (item) {
                vm.tab1.taxes[item.id] = item;
            });

            tableService.setVariables(vm.tab1);
            vm.tab1.query.year = moment().format('YYYY');
            vm.tab1.query.month = moment().format('M');
            vm.tab1.query.invoice_type_id = null;
            vm.tab1.query.vat_rate_id = null;

            tableService.setVariables(vm.tab2);
            vm.tab2.query.year = moment().format('YYYY');
            vm.tab2.query.month = moment().format('M');
            vm.tab2.query.no_invoice = 1;
            vm.tab2.query.transaction_number = '';
            vm.tab2.query.number = '';
            vm.tab2.query.email = '';

            for(var i in vm.tab3.payments_method2) {
                vm.tab3.payments_method[vm.tab3.payments_method2[i].id] = vm.tab3.payments_method2[i];
            }

            tableService.setVariables(vm.tab3);
            vm.tab3.query.year = moment().format('YYYY');
            vm.tab3.query.month = moment().format('M');
            vm.tab3.query.payment_method_id = '';
            vm.tab3.query.transaction_number = '';
            vm.tab3.query.number = '';
            vm.tab3.query.user_id = '';
            vm.tab3.query.no_invoice = 1;
        }

        //tab1

        function getInvoices() {
            vm.tab1.promise = api.registryInvoices.get(vm.tab1.query, function (response) {
                vm.tab1.invoices = response.data;
                vm.tab1.pagination = response.meta.pagination;

                api.reports.registryInvoices.get(vm.tab1.query, function (response) {
                    vm.tab1.reports = response.data;
                });

            }).$promise;
        }

        function pdfInvoices() {
            var params = $httpParamSerializer(vm.tab1.query);
            $window.open(
                __env.apiUrl + 'reports/invoices-registry-pdf?' + params +
                '&token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany(),
                '_blank');
        }

        function csvInvoices() {
            var params = $httpParamSerializer(vm.tab1.query);
            $window.open(
                __env.apiUrl + 'reports/invoices-registry-xls?' + params +
                '&token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany(),
                '_blank');
        }

        function jpkFa() {
            if (vm.tab1.enable_jpk) {
                api.company.jpk.get({}, function () {
                    dialogService.customDialog(null, 'JpkFaDialogController', 'app/main/registry-sales/jpk-fa/jpk-fa.html');
                }, function () {
                    dialogService.alert(null, 'REGISTRY_SALES.INVOICES_LIST.ALERT_DETAIL_JPK');
                });
            } else {
                $rootScope.packageAlert('PACKAGE_ALERT.DEFAULT_MESSAGE');
            }
        }

        function downloadSales() {
            var params = $httpParamSerializer(vm.tab1.query);
            $window.open(
                __env.apiUrl + 'reports/invoices-report-export?' + params +
                '&token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany(),
                '_blank');
        }

        //tab2

        function getOnlineSales() {
            vm.tab2.promise = api.onlineSales.get(vm.tab2.query, function (response) {
                vm.tab2.online_sales = response.data;
                vm.tab2.pagination = response.meta.pagination;

                api.reports.onlineSales.get(vm.tab2.query, function (response) {
                    vm.tab2.reports = response.data;
                });
                
            }).$promise;
        }

        function detailsOnlineSales(id) {
            dialogService.customDialog(null, 'RegistrySalesTab2ItemsDialogController', 'app/main/registry-sales/items/items.html', {id:id});
        }

        function pdfOnlineSales() {
            var params = $httpParamSerializer(vm.tab2.query);
            $window.open(
                __env.apiUrl + 'online-sales/pdf?' + params +
                '&token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany(),
                '_blank');
        }

        //tab3

        function getReceipts() {
            vm.promise = api.receipts.get(vm.tab3.query, function (response) {
                vm.tab3.receipts = response.data;
                vm.tab3.pagination = response.meta.pagination;

                api.reports.receipts.get(vm.tab3.query, function (response) {
                    vm.tab3.reports = response.data;
                });
            }).$promise;
        }

        function detailsReceipts(id) {
            dialogService.customDialog(null, 'ReceiptsTab3ItemsDialogController', 'app/main/registry-sales/items-receipts/items.html', {id:id});
        }

        function pdfReceipts() {
            var params = $httpParamSerializer(vm.tab3.query);
            $window.open(
                __env.apiUrl + 'receipts/pdf?' + params +
                '&token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany(),
                '_blank');
        }
        //////////
    }
})();
