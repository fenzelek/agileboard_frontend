(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('inputClear', inputClearDirective);

    /** @ngInject */
    function inputClearDirective()
    {
        return {
            restrict: 'A',
            compile: function (element, attrs) {
                var action = attrs.ngModel + " = ''";
                element.after(
                    '<md-button class="animate-show md-icon-button"' +
                    'ng-show="' + attrs.ngModel + '" ng-click="' + action + '"' +
                    'style="position: absolute; top: 0px; right: -6px; font-weight: 100">' +
                    '<div >x</div>' +
                    '</md-button>');
            }
        };
    }
})();