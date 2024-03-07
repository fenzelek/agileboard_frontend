(function ()
{
    'use strict';

    angular
        .module('app.pages.error-500')
        .controller('Error500Controller', Error500Controller);

    /** @ngInject */
    function Error500Controller(transService, $window)
    {
        var vm = this;
        vm.back = back;

        transService.loadFile('main/errors/500');

        function back() {
            $window.history.back();
        }
    }
})();