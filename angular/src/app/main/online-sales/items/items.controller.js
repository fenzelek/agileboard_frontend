(function ()
{
    'use strict';

    angular
        .module('app.online-sales-list')
        .controller('OnlineSalesItemsDialogController', OnlineSalesItemsDialogController);

    /** @ngInject */
    function OnlineSalesItemsDialogController($mdDialog, api, id)
    {
        var vm = this;
        vm.items = [];

        vm.hide = hide;

        init();

        function init() {

            api.onlineSale.get({id: id}, function (response) {
                vm.items = response.data.items.data;
            });
        }

        function hide() {
            $mdDialog.hide();
        }
    }

})();
