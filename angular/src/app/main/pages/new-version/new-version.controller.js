(function ()
{
    'use strict';

    angular
        .module('app.core')
        .controller('NewVersionDialogController', NewVersionDialogController);

    /** @ngInject */
    function NewVersionDialogController($mdDialog, $window, transService, $auth)
    {
        var vm = this;
        vm.name = '';
        transService.loadFile('main/pages/new-version');

        vm.hide = hide;
        vm.refresh = refresh;

        $auth.getUser(function (user) {
            vm.name = user.first_name + ' ' + user.last_name;
        });

        function hide() {
            $mdDialog.hide();
        }

        function refresh() {
            $window.location.reload();
        }
    }

})();
