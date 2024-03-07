(function ()
{
    'use strict';

    angular
        .module('app.registry-sales')
        .controller('ReceiptsTab3ItemsDialogController', ReceiptsTab3ItemsDialogController);

    /** @ngInject */
    function ReceiptsTab3ItemsDialogController($mdDialog, api, id)
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
