(function ()
{
    'use strict';

    angular
        .module('app.pages.error-403')
        .controller('Error403Controller', Error403Controller);

    /** @ngInject */
    function Error403Controller(transService, $window)
    {
        var vm = this;
        vm.back = back;

        transService.loadFile('main/errors/403');

        function back() {
            $window.history.back();
        }
    }
})();