(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('autocompleteRequired', autocompleteRequiredDirective);

    /** @ngInject */
    function autocompleteRequiredDirective($timeout)
    {
        return {
            restrict: 'A',
            require: '^form',
            link: function (scope, element, attr, ctrl) {
                $timeout(function () {
                    var realModel,
                        elemCtrl = ctrl[attr.mdInputName],
                        realValidation = function (model) {
                            elemCtrl.$setValidity('selectedItem', !!realModel);
                            return model;
                        };
                    if (!!attr.mdSelectedItem && !!attr.mdInputName) {
                        scope.$watchCollection(attr.mdSelectedItem, function (obj) {
                            realModel = obj;
                            realValidation()
                        });
                        elemCtrl.$parsers.push(realValidation);
                    }
                })
            }
        }
    }
})();