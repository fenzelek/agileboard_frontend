(function ()
{
    'use strict';

    angular
        .module('app.receipts-list')
        .controller('ReceiptsListController', ReceiptsListController);

    /** @ngInject */
    function ReceiptsListController(transService, api, tableService, dialogService, $window, __env, $httpParamSerializer, $auth, $location, UsersList, PaymentMethodsList, ReceiptsList, ReceiptsReportList)
    {
        var vm = this;
        transService.loadFile('main/receipts/list');

        // Data
        vm.msg_error = '';
        vm.msg_success = '';
        vm.request_sending = false;
        vm.receipts = ReceiptsList.data;
        vm.pagination = ReceiptsList.meta.pagination;
        vm.payments_method = [];
        vm.payments_method2 = PaymentMethodsList.data;
        vm.users = UsersList.data;
        vm.reports = ReceiptsReportList.data;
        vm.is_tax_office = false;

        vm.getReceipts = getReceipts;
        vm.details = details;
        vm.receiptsModal = receiptsModal;
        vm.pdf = pdf;
        vm.report = report;
        vm.invoices = invoices;
        vm.invoice = invoice;

        init();

        function init() {

            for(var i in vm.payments_method2) {
                vm.payments_method[vm.payments_method2[i].id] = vm.payments_method2[i];
            }

            tableService.setVariables(vm);
            vm.query.payment_method_id = '';
            vm.query.date_start = '';
            vm.query.date_end = '';
            vm.query.transaction_number = '';
            vm.query.number = '';
            vm.query.user_id = '';

            $auth.getMyRole(function (role) {
                vm.is_tax_office = role == 'tax_office';
            })
        }

        /**
         * get contractors
         */
        function getReceipts() {
            vm.promise = api.receipts.get(vm.query, function (response) {
                vm.receipts = response.data;
                vm.pagination = response.meta.pagination;
                
                api.reports.receipts.get(vm.query, function (response) {
                    vm.reports = response.data;
                });
            }).$promise;
        }

        function receiptsModal() {
            dialogService.customDialog(null, 'CreateInvoiceDialogController', 'app/main/receipts/crete-invoice/crete-invoice.html');
        }

        function details(id) {
            dialogService.customDialog(null, 'ReceiptsItemsDialogController', 'app/main/receipts/items/items.html', {id:id});
        }

        function invoices(index) {
            dialogService.customDialog(null, 'ReceiptsInvoicesDialogController', 'app/main/receipts/invoices/invoices.html', {invoices:vm.receipts[index].invoices.data});
        }


        function pdf() {
            var params = $httpParamSerializer(vm.query);
            $window.open(
                __env.apiUrl + 'receipts/pdf?' + params +
                '&token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany(),
                '_blank');
        }

        function report() {
            var params = $httpParamSerializer(vm.query);
            $window.open(
                __env.apiUrl + 'receipts/report?' + params +
                '&token=' + $window.localStorage.token +
                '&report=1' +
                '&selected_company_id=' + $auth.getCurrentCompany(),
                '_blank');
        }

        function invoice(id) {
            $location.path('/invoices/form/new/receipt/' + id);
        }
        //////////
    }
})();
