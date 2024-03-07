(function ()
{
    'use strict';

    angular
        .module('app.core')
        .controller('InvoicesZipPendingDialogController', InvoicesZipPendingDialogController);

    /** @ngInject */
    function InvoicesZipPendingDialogController($rootScope, $mdDialog, transService)
    {
        var vm = this;
        transService.loadFile('main/invoices/list/zip_pending_dialog');

        vm.accept = accept;
        vm.hide = hide;

        function accept() {
            $mdDialog.hide(true);
        }
        function hide() {
            $mdDialog.hide();
        }
    }

})();
