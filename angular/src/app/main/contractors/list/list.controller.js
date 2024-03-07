(function ()
{
    'use strict';

    angular
        .module('app.contractors-list')
        .controller('ContractorsListController', ContractorsListController);

    /** @ngInject */
    function ContractorsListController(transService, api, tableService, dialogService, $location, $auth, ContractorsList)
    {
        var vm = this;
        transService.loadFile('main/contractors/list');

        // Data
        vm.msg_error = '';
        vm.msg_success = '';
        vm.request_sending = false;
        vm.contractors = ContractorsList.data;
        vm.pagination = ContractorsList.meta.pagination;
        vm.is_tax_office = false;

        vm.getContractors = getContractors;
        vm.deleteContractor = deleteContractor;
        vm.edit = edit;
        vm.invoice_add = invoice_add;

        init();

        function init() {
            tableService.setVariables(vm);
            vm.query.search = '';
            vm.query.sort = 'id';

            $auth.getMyRole(function (role) {
                vm.is_tax_office = role == 'tax_office';
            })
        }

        /**
         * get contractors
         */
        function getContractors() {
            vm.promise = api.contractors.get(vm.query, function (response) {
                vm.contractors = response.data;
                vm.pagination = response.meta.pagination;
            }).$promise;
        }

        /**
         * delete contractor
         * @param id
         */
        function deleteContractor(id) {
            dialogService.confirm(null, 'CONTRACTORS_LIST.DELETE_QUESTION', function() {
                api.contractor.delete({id:id}, function () {
                    vm.msg_success = transService.translate('CONTRACTORS_LIST.DELETE_SUCCESS');
                    vm.msg_error = '';
                    getContractors();

                },function (response) {
                    vm.msg_error = transService.getErrorMassage(response);
                })
            });
        }

        function edit(id) {
            $location.path('/contractors/form/edit/' + id);
        }

        function invoice_add(id) {
            $location.path('/invoices/form/new/' + id);
        }
        //////////
    }
})();
