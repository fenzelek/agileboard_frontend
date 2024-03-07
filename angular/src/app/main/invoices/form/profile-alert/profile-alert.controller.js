(function ()
{
    'use strict';

    angular
        .module('app.core')
        .controller('ProfileAlertDialogController', ProfileAlertDialogController);

    /** @ngInject */
    function ProfileAlertDialogController($mdDialog, $location)
    {
        var vm = this;

        vm.hide = hide;
        vm.goEdit = goEdit;

        function hide() {
            $mdDialog.hide();
        }

        function goEdit() {
            $mdDialog.hide();
            $location.url('/company/edit?first=true');
        }
    }

})();
