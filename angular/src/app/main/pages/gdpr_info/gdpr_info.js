(function ()
{
    'use strict';

    angular
        .module('app.core')
        .controller('GdprInfoDialogController', GdprInfoDialogController);

    /** @ngInject */
    function GdprInfoDialogController($rootScope, $mdDialog, transService, $location)
    {
        var vm = this;
        transService.loadFile('main/pages/gdpr_info');

        vm.accept = accept;
        vm.hide = hide;
        vm.goToPrivacyPolicy = goToPrivacyPolicy;

        function accept() {
            $rootScope.closeGdprInfo();
            $mdDialog.hide();
        }
        function hide() {
            $mdDialog.hide();
        }

        function goToPrivacyPolicy() {
            $mdDialog.hide();
            $location.path('/page/privacy-policy');
        }
    }

})();
