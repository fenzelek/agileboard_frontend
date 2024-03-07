(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('repaintOnScroll', repaintOnScrollDirective);

    /** @ngInject */
    function repaintOnScrollDirective() {
        return {
            restrict: 'EA',
            link: function (scope, $element) {
                var board = angular.element('#board');
                board.on('scroll', function () {
                    $element.hide().show(0);
                });
            }
        };
    };
})();
