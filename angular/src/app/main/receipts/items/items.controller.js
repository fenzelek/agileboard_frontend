(function ()
{
    'use strict';

    angular
        .module('app.receipts-list')
        .controller('ReceiptsItemsDialogController', ReceiptsItemsDialogController);

    /** @ngInject */
    function ReceiptsItemsDialogController($mdDialog, api, id)
    {
        var vm = this;
        vm.items = [];

        vm.hide = hide;

        init();

        function init() {

            api.receipt.get({id: id}, function (response) {
                vm.items = response.data.items.data;
            });
        }

        function hide() {
            $mdDialog.hide();
        }
    }

})();
