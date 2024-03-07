(function ()
{
    'use strict';

    angular
        .module('app.invoices-list')
        .controller('InvoicesPaymentsAddDialogController', InvoicesPaymentsAddDialogController);

    /** @ngInject */
    function InvoicesPaymentsAddDialogController($auth, transService, $mdDialog, api, apiErrorsService, id, amount)
    {
        var vm = this;

        vm.msg_success = '';
        vm.msg_error = '';
        vm.request_sending = false;
        vm.payment_methods = [];
        vm.max_payment = amount;

        vm.form = {
            invoice_id: id,
            amount: amount,
            payment_method_id: null
        };

        vm.hide = hide;
        vm.create = create;

        init();

        function init() {
            api.paymentsMethod.list.get({}, function (response) {
                vm.payment_methods = response.data;
            });
        }

        function hide() {
            $mdDialog.hide();
        }

        /**
         * Create user
         */
        function create() {

            vm.request_sending = true;
            apiErrorsService.clear('#addPyment', vm);

            api.invoicePayments.save(vm.form,
                // success
                function() {
                    $mdDialog.hide(true);
                },
                // error
                function(response) {
                    apiErrorsService.show('#addPyment', response, vm, []);
                    vm.request_sending = false;
                    vm.msg_error = transService.getErrorMassage(response);
                }
            );
        }
    }

})();
