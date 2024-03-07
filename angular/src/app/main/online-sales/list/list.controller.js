(function ()
{
    'use strict';

    angular
        .module('app.online-sales-list')
        .controller('OnlineSalesListController', OnlineSalesListController);

    /** @ngInject */
    function OnlineSalesListController(transService, api, tableService, dialogService, $window, __env, $httpParamSerializer, $auth, $location, OnlineSalesList, OnlineSalesReportList)
    {
        var vm = this;
        transService.loadFile('main/online-sales/list');

        // Data
        vm.msg_error = '';
        vm.msg_success = '';
        vm.request_sending = false;
        vm.online_sales = OnlineSalesList.data;
        vm.pagination = OnlineSalesList.meta.pagination;
        vm.reports = OnlineSalesReportList.data;
        vm.is_tax_office = false;


        vm.getOnlineSales = getOnlineSales;
        vm.details = details;
        vm.pdf = pdf;
        vm.invoices = invoices;
        vm.invoice = invoice;

        init();

        function init() {
            tableService.setVariables(vm);
            vm.query.date_start = '';
            vm.query.date_end = '';
            vm.query.transaction_number = '';
            vm.query.number = '';
            vm.query.email = '';

            $auth.getMyRole(function (role) {
                vm.is_tax_office = role == 'tax_office';
            })
        }

        /**
         * get contractors
         */
        function getOnlineSales() {
            vm.promise = api.onlineSales.get(vm.query, function (response) {
                vm.online_sales = response.data;
                vm.pagination = response.meta.pagination;

                api.reports.onlineSales.get(vm.query, function (response) {
                    vm.reports = response.data;
                });
            }).$promise;
        }

        function details(id) {
            dialogService.customDialog(null, 'OnlineSalesItemsDialogController', 'app/main/online-sales/items/items.html', {id:id});
        }

        function invoices(index) {
            dialogService.customDialog(null, 'OnlineSalesDialogController', 'app/main/online-sales/invoices/invoices.html', {invoices:vm.online_sales[index].invoices.data});
        }

        function pdf() {
            var params = $httpParamSerializer(vm.query);
            $window.open(
                __env.apiUrl + 'online-sales/pdf?' + params +
                '&token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany(),
                '_blank');
        }
        
        function invoice(id) {
            $location.path('/invoices/form/new/online-sales/' + id);
        }
        //////////
    }
})();
