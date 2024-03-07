(function ()
{
    'use strict';

    angular
        .module('app.core')
        .controller('BlockadeCompanyDialogController', BlockadeCompanyDialogController);

    /** @ngInject */
    function BlockadeCompanyDialogController($mdDialog, transService, blockade_company)
    {
        var vm = this;
        transService.loadFile('main/pages/blockade-company');

        vm.blockade_company = blockade_company.replace(/\./g, '_').split(',');

        vm.hide = hide;

        function hide() {
            $mdDialog.hide();
        }
    }

})();
