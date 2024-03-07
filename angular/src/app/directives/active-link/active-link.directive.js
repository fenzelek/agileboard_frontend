(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('activeLink', ['$location', activeLinkDirective]); 
        
    /** @ngInject */
    function activeLinkDirective(location) 
    {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                // get the 'active' class name
                var activeClass = attrs.activeLink;
                // button link to:
                var href = attrs.ngHref;
                 // divide location string by '/' and get 3rd parameter - current page
                href = href.split('/')[3]; // ["", "projects", "", "CURRENT_PAGE"]
                // current page location - must be an function to execute $watch on change
                var locationPath = function() {
                    return location.path();
                };
                

                scope.$watch(locationPath, function (newLocationPath) {
                    // divide location string by '/' and get 3rd parameter - current page
                    var current_page = newLocationPath.split('/')[3]; // ["", "projects", "PROJECT_ID", "CURRENT_PAGE"]
                    // add / remove 'active' class
                    if(href == current_page) {
                        element.addClass(activeClass);
                    } else {
                        element.removeClass(activeClass);
                    }
                });
            }
        };
    }

})();