(function ()
{
    'use strict';
    angular
        .module('app.core')
        .directive('fileread', msFilereadDirective);

    /** @ngInject */
    function msFilereadDirective()
    {
        return {
            scope: {
                fileread: "="
            },
            link: function (scope, element, attributes) {
                element.bind("change", function (changeEvent) {
                    var reader = new FileReader();
                    reader.onload = function (loadEvent) {
                        scope.$apply(function () {
                            scope.fileread = loadEvent.target.result;
                        });
                    }
                    reader.readAsDataURL(changeEvent.target.files[0]);
                });
            }
        }
    }
})();