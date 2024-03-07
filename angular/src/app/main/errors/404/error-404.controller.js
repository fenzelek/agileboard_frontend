(function ()
{
    'use strict';

    angular
        .module('app.pages.error-404')
        .controller('Error404Controller', Error404Controller);

    /** @ngInject */
    function Error404Controller(transService, $window)
    {
        var vm = this;
        vm.back = back;

        transService.loadFile('main/errors/404');

        function back() {
            $window.history.back();
        }
    }
})();