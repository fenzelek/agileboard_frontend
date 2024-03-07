(function ()
{
    'use strict';

    angular
        .module('app.page.cookie')
        .controller('CookieController', CookieController);

    /** @ngInject */
    function CookieController(transService, $rootScope)
    {
        var vm = this;
        vm.app_name = 'Fvonline.pl';

        transService.loadFile('main/pages/cookie');

        if($rootScope.page_title == "Agile board") {
            vm.app_name = 'agileboard.me';
        }
    }
})();
