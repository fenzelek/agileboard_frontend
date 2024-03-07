(function ()
{
    'use strict';

    angular
        .module('app.cash-operations-form')
        .controller('CashOperationsFormController', CashOperationsFormController);

    /** @ngInject */
    function CashOperationsFormController(transService, api, $location, $window, apiErrorsService, __env, $auth, $stateParams, formService)
    {
        var vm = this;
        transService.loadFile('main/cash-operations/form');

        // Data
        vm.msg_error = '';
        vm.msg_success = '';
        vm.request_sending = false;
        vm.edit = false;
        vm.search_text_receipt = '';
        vm.search_text_invoice = '';
        vm.last_added = null;
        vm.form = {
            document_id: null,
            document_type: 'receipt',
            cashless: $stateParams.cashless,
            amount: '',
            direction: '',
            flow_date: moment().format('YYYY-MM-DD'),
            description: ''
        };
        vm.receipt = {
            selected_item: null
        };

        vm.invoice = {
            selected_item: null
        };

        vm.send = send;
        vm.pdf = pdf;
        vm.searchReceipt = searchReceipt;
        vm.searchInvoice = searchInvoice;

        function searchReceipt(number) {

            return api.receipts.get({
                    limit: 15,
                    page: 1,
                    number: number
                }
            ).$promise.then(function (response) {
                return response.data;
            });
        }

        function searchInvoice(number) {

            return api.invoices.get({
                    limit: 15,
                    page: 1,
                    number: number,
                    status: 'not_deleted'
                }
            ).$promise.then(function (response) {
                return response.data;
            });
        }

        function pdf() {
            $window.open(
                __env.apiUrl + 'cash-flows/'+vm.last_added+'/pdf?' +
                'token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany(),
                '_blank');
        }

        function send() {
            
            $location.hash('');
            vm.request_sending = true;
            apiErrorsService.clear('#cashOperations', vm);


            if ((vm.form.document_type == 'receipt' && !vm.receipt.selected_item && vm.search_text_receipt != '')
                || (vm.form.document_type == 'invoice' && !vm.invoice.selected_item && vm.search_text_invoice != '')) {
                vm.msg_error = transService.translate('CASH_OPERATIONS_FORM.WRONG_SELECTED');
                vm.msg_success = '';
            } else {
                if (vm.form.document_type == 'receipt' && vm.receipt.selected_item) {
                    vm.form.document_id = vm.receipt.selected_item.id;
                }
                if (vm.form.document_type == 'invoice' && vm.invoice.selected_item) {
                    vm.form.document_id = vm.invoice.selected_item.id;
                }
                api.cashOperations.save(vm.form,
                    // success
                    function (response) {
                        vm.last_added = response.data.id;
                        vm.msg_error = '';
                        vm.msg_success = transService.translate('CASH_OPERATIONS_FORM.ADD_SUCCESS');
                        vm.request_sending = false;
                        formService.formUp();
                    },
                    // error
                    function (response) {
                        apiErrorsService.show('#cashOperations', response, vm, []);
                        vm.msg_error = transService.getErrorMassage(response);
                        vm.msg_success = '';
                        vm.request_sending = false;
                        formService.formUp();
                    }
                );
            }
        }
        //////////
    }
})();
