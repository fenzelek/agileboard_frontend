(function ()
{
    'use strict';

    angular
        .module('app.registry-sales')
        .controller('RegistrySalesTab2ItemsDialogController', RegistrySalesTab2ItemsDialogController);

    /** @ngInject */
    function RegistrySalesTab2ItemsDialogController($mdDialog, api, id)
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
