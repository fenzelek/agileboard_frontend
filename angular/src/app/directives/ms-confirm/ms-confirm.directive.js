(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('msConfirm', msConfirmDirective);

    /** @ngInject */
    function msConfirmDirective()
    {
        return {
            require: 'ngModel',
            link: function (scope, elem, attrs, ctrl) {
                var firstInput = '#' + attrs.msConfirm;
                elem.add(firstInput).on('keyup', function () {
                    scope.$apply(function () {
                        var v = elem.val() === $(firstInput).val();
                        ctrl.$setValidity('confirm', v);
                    });
                });
            }
        }
    }
})();