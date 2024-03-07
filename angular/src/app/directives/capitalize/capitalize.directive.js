(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('capitalize', capitalizeDirective);

    /** @ngInject */
    function capitalizeDirective($parse)
    {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, modelCtrl) {
                var capitalize = function (inputValue) {
                    if (inputValue != null) {
                        var capitalized = inputValue.toUpperCase();
                        if (capitalized !== inputValue) {
                            modelCtrl.$setViewValue(capitalized);
                            modelCtrl.$render();
                        }
                        return capitalized;
                    }
                };
                var model = $parse(attrs.ngModel);
                modelCtrl.$parsers.push(capitalize);
                capitalize(model(scope));
            }
        };
    }
})();