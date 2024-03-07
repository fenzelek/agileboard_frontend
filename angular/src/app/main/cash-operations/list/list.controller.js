(function ()
{
    'use strict';

    angular
        .module('app.cash-operations-list')
        .controller('CashOperationsListController', CashOperationsListController);

    /** @ngInject */
    function CashOperationsListController(transService, api, tableService, $scope, $window, __env, $httpParamSerializer, $auth, dialogService, UsersList)
    {
        var vm = this;
        transService.loadFile('main/cash-operations/list');

        // Data
        vm.msg_error = '';
        vm.msg_success = '';
        vm.request_sending = false;
        vm.cash_operations = [];
        vm.users = UsersList.data;
        vm.reports = {};
        vm.is_tax_office = false;

        vm.tab1 = {
            cash_operations: [],
            reports: {},
            edit_access:false,
        };

        vm.tab2 = {
            cash_operations: [],
            reports: {},
            edit_access:false,
        };

        vm.getCashOperations = getCashOperations;
        vm.getNonCashOperations = getNonCashOperations;
        // vm.deleteCashOperations = deleteCashOperations;
        vm.pdf = pdf;
        vm.nonCashPdf = nonCashPdf;
        vm.changeTo = changeTo;

        init();

        function init() {

            tableService.setVariables(vm.tab1);
            vm.tab1.query.cashless = '0';
            vm.tab1.query.user_id = '';
            vm.tab1.query.balanced_tmp = 0;
            vm.tab1.query.date = moment().format('YYYY-MM-DD');

            if (typeof $window.localStorage.cash_operations_tab1_user_id != 'undefined') {
                vm.tab1.query.user_id = $window.localStorage.cash_operations_tab1_user_id;
            } else if (vm.users.length) {
                vm.tab1.query.user_id = vm.users[0].id;
            }

            tableService.setVariables(vm.tab2);
            vm.tab2.query.cashless = '1';
            vm.tab2.query.user_id = '';
            vm.tab1.query.balanced_tmp = 0;
            vm.tab2.query.date = moment().format('YYYY-MM-DD');

            if (typeof $window.localStorage.cash_operations_tab2_user_id != 'undefined') {
                vm.tab2.query.user_id = $window.localStorage.cash_operations_tab2_user_id;
            } else if (vm.users.length) {
                vm.tab2.query.user_id = vm.users[0].id;
            }

            getCashOperations();
            getNonCashOperations();

            $scope.$watch(function () {return vm.tab1.query.user_id;},function(value){
                $window.localStorage.cash_operations_tab1_user_id = value;
            });

            $scope.$watch(function () {return vm.tab2.query.user_id;},function(value){
                $window.localStorage.cash_operations_tab2_user_id = value;
            });

            $auth.getMyRole(function (role) {
                vm.is_tax_office = role == 'tax_office';
            })
        }

        /**
         * get contractors
         */
        function getCashOperations() {
            $auth.getUser(function (user) {
                vm.tab1.edit_access = user.id == vm.tab1.query.user_id;

                vm.tab1.query.balanced = Number(vm.tab1.query.balanced_tmp);
                vm.tab1.promise = api.cashOperations.get(vm.tab1.query, function (response) {
                    vm.tab1.cash_operations = response.data;
                    vm.tab1.pagination = response.meta.pagination;

                    api.reports.cashOperations.get(vm.tab1.query, function (response) {
                        vm.tab1.reports = response.data;
                    });

                }).$promise;
            });
        }

        /**
         * get contractors
         */
        function getNonCashOperations() {
            $auth.getUser(function (user) {
                vm.tab2.edit_access = user.id == vm.tab2.query.user_id;

                vm.tab2.query.balanced = Number(vm.tab2.query.balanced_tmp);
                vm.tab2.promise = api.cashOperations.get(vm.tab2.query, function (response) {
                    vm.tab2.cash_operations = response.data;
                    vm.tab2.pagination = response.meta.pagination;

                    api.reports.cashOperations.get(vm.tab2.query, function (response) {
                        vm.tab2.reports = response.data;
                    });

                }).$promise;
            });
        }

        /**
         * delete contractor
         * @param id
         */
        // function deleteCashOperations(id) {
        //     dialogService.confirm(null, 'CASH_OPERATIONS_LIST.DELETE_QUESTION', function() {
        //         api.cashOperations.delete({id:id}, function () {
        //             vm.msg_success = transService.translate('CASH_OPERATIONS_LIST.DELETE_SUCCESS');
        //             vm.msg_error = '';
        //             init();
        //
        //         },function (response) {
        //             vm.msg_error = transService.getErrorMassage(response);
        //         })
        //     });
        // }


        /**
         *
         * @param id
         * @param cashless
         */
        function changeTo(id, cashless) {
                dialogService.confirm(null, 'CASH_OPERATIONS_LIST.CHANGE_QUESTION_' + cashless, function() {
                    api.cashOperation.put({id:id, cashless:cashless}, function () {
                        vm.msg_success = transService.translate('CASH_OPERATIONS_LIST.CHANGE_SUCCESS');
                        
                        vm.msg_error = '';
                        init();

                    },function (response) {
                        vm.msg_error = transService.getErrorMassage(response);
                    })
                });
        }

        function pdf(id) {

            if (typeof id == 'undefined') {
                var params = $httpParamSerializer(vm.tab1.query);
                $window.open(
                    __env.apiUrl + 'cash-flows/pdf?' + params +
                    '&token=' + $window.localStorage.token +
                    '&balanced=' + Number(vm.tab1.query.balanced_tmp) +
                    '&selected_company_id=' + $auth.getCurrentCompany(),
                    '_blank');
            } else {
                $window.open(
                    __env.apiUrl + 'cash-flows/'+id+'/pdf?' +
                    'token=' + $window.localStorage.token +
                    '&selected_company_id=' + $auth.getCurrentCompany(),
                    '_blank');
            }
        }


        function nonCashPdf(id) {

            if (typeof id == 'undefined') {
                var params = $httpParamSerializer(vm.tab2.query);
                $window.open(
                    __env.apiUrl + 'cash-flows/pdf?' + params +
                    '&token=' + $window.localStorage.token +
                    '&balanced=' + Number(vm.tab2.query.balanced_tmp) +
                    '&selected_company_id=' + $auth.getCurrentCompany(),
                    '_blank');
            } else {
                $window.open(
                    __env.apiUrl + 'cash-flows/'+id+'/pdf?' +
                    'token=' + $window.localStorage.token +
                    '&selected_company_id=' + $auth.getCurrentCompany(),
                    '_blank');
            }
        }
        //////////
    }
})();
