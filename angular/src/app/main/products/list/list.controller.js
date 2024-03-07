(function ()
{
    'use strict';

    angular
        .module('app.products-list')
        .controller('ProductsListController', ProductsListController);

    /** @ngInject */
    function ProductsListController(transService, api, tableService, dialogService, ProductsList, $auth, TaxesList)
    {
        var vm = this;
        transService.loadFile('main/products/list');

        // Data
        vm.msg_error = '';
        vm.msg_success = '';
        vm.request_sending = false;
        vm.products = ProductsList.data;
        vm.pagination = ProductsList.meta.pagination;
        vm.taxs = [];
        vm.is_tax_office = false;

        vm.getProducts = getProducts;
        // vm.deleteProducts = deleteProducts;

        init();

        function init() {

            for(var i in TaxesList.data) {
                vm.taxs[TaxesList.data[i].id] = TaxesList.data[i];
            }

            tableService.setVariables(vm);
            vm.query.name = '';
            vm.query.sort = 'id';

            $auth.getMyRole(function (role) {
                vm.is_tax_office = role == 'tax_office';
            })
        }

        /**
         * get contractors
         */
        function getProducts() {
            vm.promise = api.products.get(vm.query, function (response) {
                vm.products = response.data;
                vm.pagination = response.meta.pagination;
            }).$promise;
        }

        /**
         * delete contractor
         * @param id
         */
        // function deleteProducts(id) {
        //     dialogService.confirm(null, 'PRODUCTS_LIST.DELETE_QUESTION', function() {
        //         api.products.delete({id:id}, function () {
        //             vm.msg_success = transService.translate('PRODUCTS_LIST.DELETE_SUCCESS');
        //             vm.msg_error = '';
        //             getProducts();
        //
        //         },function (response) {
        //             vm.msg_error = transService.getErrorMassage(response);
        //         })
        //     });
        // }
        //////////
    }
})();
