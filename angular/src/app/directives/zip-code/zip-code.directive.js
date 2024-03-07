(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('zipCode', zipCodeDirective);

    /** @ngInject */
    function zipCodeDirective()
    {
        return {
            require: 'ngModel',
            link: function (scope, element) {
                element.on('keyup', function(event) {
                    if (event.which != 8) {

                        if (element.val().length == 3 && event.keyCode != 173 && event.keyCode != 109) {
                            scope.$apply(function () {
                                element.val(element.val()[0] + element.val()[1] + '-' + element.val()[2]);
                            });
                        }
                    }
                });
            }
        };
    }
})();