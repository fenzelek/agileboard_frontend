(function ()
{
    'use strict';

    angular
        .module('app.receipts-list')
        .controller('CreateInvoiceDialogController', CreateInvoiceDialogController);

    /** @ngInject */
    function CreateInvoiceDialogController($timeout, transService, $mdDialog, api, $location)
    {
        var vm = this;

        vm.msg_success = '';
        vm.msg_error = '';
        vm.request_sending = false;
        vm.search_text_receipt = [];
        vm.selected_item = [];

        vm.edit = false;

        vm.searchReceipt = searchReceipt;
        vm.hide = hide;
        vm.create = create;
        vm.add = add;

        add();

        function searchReceipt(number) {

            return api.receipts.get({
                    limit: 15,
                    page: 1,
                    no_inovice: 1,
                    number: number
                }
            ).$promise.then(function (response) {
                return response.data;
            });
        }

        function add() {

            vm.selected_item.push(null);

            var temp = angular.copy(vm.selected_item);
            vm.search_text_receipt.push('');
            $timeout(function (p) {
                vm.selected_item = p.temp;
            }, 500, true, {temp:temp});
        }

        function hide() {
            $mdDialog.hide();
        }

        /**
         * Create user
         */
        function create() {

            var ids = [];
            var ids_params = '';

            angular.forEach(vm.selected_item, function (item) {
                if (item) {
                    var found = false;
                    angular.forEach(ids, function (id) {
                        if (item.id == id) {
                            found = true;
                        }
                    });

                    if (!found) {
                        ids.push(item.id);

                        if (ids_params != '') {
                            ids_params += '&';
                        }
                        ids_params += 'ids=' + item.id;
                    }
                }
            });

            if (ids.length > 1) {
                $location.url('/invoices/form/new/receipts?'+ids_params);
                $mdDialog.hide();
            } else {
                vm.msg_error = transService.translate('RECEIPTS_LIST.CREATE_INVOICE_ERROR');
            }

        }
    }

})();
