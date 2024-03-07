(function ()
{
    'use strict';

    angular
        .module('app.page.privacy-policy')
        .controller('PrivacyPolicyController', PrivacyPolicyController);

    /** @ngInject */
    function PrivacyPolicyController(transService, $rootScope)
    {
        var vm = this;
        vm.app_name = 'Fvonline.pl';

        transService.loadFile('main/pages/privacy-policy');

        if($rootScope.page_title == "Agile board") {
            vm.app_name = 'agileboard.me';
        }
    }
})();
