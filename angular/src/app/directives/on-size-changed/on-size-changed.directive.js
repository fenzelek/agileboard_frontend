(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('onSizeChanged', onSizeChangedDirective);

    /** @ngInject */
    function onSizeChangedDirective($window)
    {
        return {
            restrict: 'A',
            scope: {
                onSizeChanged: '&'
            },
            link: function (scope, $element, attr) {
                var element = $element[0];

                cacheElementSize(scope, element);
                $window.addEventListener('resize', onWindowResize);

                function cacheElementSize(scope, element) {
                    scope.cachedElementWidth = element.offsetWidth;
                    scope.cachedElementHeight = element.offsetHeight;
                }

                function onWindowResize() {
                    var isSizeChanged = scope.cachedElementWidth != element.offsetWidth || scope.cachedElementHeight != element.offsetHeight;
                    if (isSizeChanged) {
                        var expression = scope.onSizeChanged();
                        expression(element, scope);
                    }
                }
            }
        }
    }
})();