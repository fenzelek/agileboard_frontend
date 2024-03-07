(function ()
{
    'use strict';

    angular
        .module('app.core')
        .controller('LanguageWebBrowserDialogController', LanguageWebBrowserDialogController);

    /** @ngInject */
    function LanguageWebBrowserDialogController($mdDialog, transService)
    {
        var vm = this;
        transService.loadFile('main/pages/language_webbrowser');

        vm.hide = hide;

        function hide() {
            $mdDialog.hide();
        }
    }

})();
