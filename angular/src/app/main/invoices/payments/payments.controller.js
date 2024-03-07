(function ()
{
    'use strict';

    angular
        .module('app.invoices-list')
        .controller('InvoicesPaymentsDialogController', InvoicesPaymentsDialogController);

    /** @ngInject */
    function InvoicesPaymentsDialogController($mdDialog, api, id, is_tax_office)
    {
        var vm = this;
        vm.items = [];
        vm.payment_methods = [];
        vm.is_tax_office = is_tax_office;

        vm.hide = hide;
        vm.removePayment = removePayment;

        init();

        function init() {

            api.paymentsMethod.list.get({}, function (response) {
                angular.forEach(response.data, function (item) {
                    vm.payment_methods[item.id] = item;
                });
            });

            api.invoicePayments.get({invoice_id: id}, function (response) {
                vm.items = response.data;
            });
        }

        function hide() {
            $mdDialog.hide();
        }

        function removePayment(id) {
            $mdDialog.hide(id);
        }
    }

})();
