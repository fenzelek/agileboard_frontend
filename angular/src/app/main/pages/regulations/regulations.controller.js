(function ()
{
    'use strict';

    angular
        .module('app.page.regulations')
        .controller('RegulationsController', RegulationsController);

    /** @ngInject */
    function RegulationsController(transService, $rootScope)
    {
        var vm = this;
        vm.app_name = 'Fvonline.pl';

        transService.loadFile('main/pages/regulations');

        if($rootScope.page_title == "Agile board") {
            vm.app_name = 'agileboard.me';
        }
    }
})();
