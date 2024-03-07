(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('focusMe', focusMeDirective);

    /** @ngInject */
    function focusMeDirective($timeout)
    {
        return {
            restrict: 'A',
            link: function (scope, element) {
                $timeout(function () {
                    element[0].focus();
                });
            }
        };
    }
})();
