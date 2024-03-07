(function ()
{
    'use strict';
    angular
        .module('app.core')
        .directive('fileModel', fileModelDirective);

    /** @ngInject */
    function fileModelDirective($parse)
    {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var model = $parse(attrs.fileModel);
                var modelSetter = model.assign;

                element.bind('change', function(){
                    scope.$apply(function(){
                        if (element[0].files.length > 1) {
                            modelSetter(scope, element[0].files);
                        } else {
                            modelSetter(scope, element[0].files[0]);
                        }
                    });
                });
            }
        };
    }
})();