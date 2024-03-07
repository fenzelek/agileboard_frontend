(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('loadingImageIndicator', loadingImageIndicatorDirective);

    /** @ngInject */
    function loadingImageIndicatorDirective($sce)
    {
        return {
            restrict: 'A',
            link: function(scope, element) {
                // on init
                // hide content and show loader
                element[0].classList += 'hidden';
                element[0].parentElement.classList += 'loading-content';

                // on image loaded event
                // hide laoder and show loaded image
                element.bind('load', function() {
                    element[0].parentElement.classList -= 'loading-content';
                    element[0].classList -= 'hidden';    
                });

            }
        };
    }
})();
