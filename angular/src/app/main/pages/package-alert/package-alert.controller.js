(function ()
{
    'use strict';

    angular
        .module('app.core')
        .controller('PackageAlertDialogController', PackageAlertDialogController);

    /** @ngInject */
    function PackageAlertDialogController($mdDialog, $location, message)
    {
        var vm = this;

        vm.message = message;
        vm.hide = hide;
        vm.goPremium = goPremium;

        function hide() {
            $mdDialog.hide();
        }

        function goPremium() {
            $mdDialog.hide();
            $location.url('/company/edit?package=open');
        }
    }

})();
