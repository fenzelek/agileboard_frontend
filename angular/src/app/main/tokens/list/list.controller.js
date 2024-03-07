(function ()
{
    'use strict';

    angular
        .module('app.tokens-list')
        .controller('TokensListController', TokensListController);

    /** @ngInject */
    function TokensListController(transService, api, tableService, dialogService, $stateParams)
    {
        var vm = this;
        transService.loadFile('main/tokens/list');

        // Data
        vm.msg_error = '';
        vm.msg_success = '';
        vm.request_sending = false;
        vm.tokens = [];
        vm.id = $stateParams.id;

        vm.getTokens = getTokens;
        vm.deleteTokens = deleteTokens;

        init();

        function init() {
            tableService.setVariables(vm);
            vm.query.user_id = $stateParams.id;
            getTokens();
        }


        /**
         * get contractors
         */
        function getTokens() {
            vm.promise = api.company.tokens.get(vm.query, function (response) {
                vm.tokens = response.data;
                vm.pagination = response.pagination
            }).$promise;
        }

        /**
         * delete contractor
         * @param id
         */
        function deleteTokens(id) {
            dialogService.confirm(null, 'TOKENS_LIST.DELETE_QUESTION', function() {
                api.company.token.delete({id:id}, function () {
                    vm.msg_success = transService.translate('TOKENS_LIST.DELETE_SUCCESS');
                    vm.msg_error = '';
                    init();

                },function (response) {
                    vm.msg_error = transService.getErrorMassage(response);
                })
            });
        }
        //////////
    }
})();
