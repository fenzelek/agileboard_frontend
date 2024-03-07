(function ()
{
    'use strict';

    angular
        .module('app.core')
        .controller('InviteTaxOfficeDialogController', InviteTaxOfficeDialogController);

    /** @ngInject */
    function InviteTaxOfficeDialogController($mdDialog, $location, $state)
    {
        var vm = this;

        vm.hide = hide;
        vm.goToInvite = goToInvite;

        function hide() {
            $mdDialog.hide();
        }

        function goToInvite() {
            $mdDialog.hide();
            if ($location.url() != '/company/edit?user=tax_office') {
                $location.url('/company/edit?user=tax_office');
            } else {
                $state.reload();
            }
        }
    }

})();
