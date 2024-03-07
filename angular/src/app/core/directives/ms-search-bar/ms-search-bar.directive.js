(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('msSearchBar', msSearchBarDirective);

    /** @ngInject */
    function msSearchBarDirective($document)
    {
        return {
            restrict   : 'E',
            scope      : { ngModel: '=' },
            templateUrl: 'app/core/directives/ms-search-bar/ms-search-bar.html',
            compile    : function (tElement)
            {
                // Add class
                tElement.addClass('ms-search-bar');

                return function postLink(scope, iElement)
                {
                    var expanderEl,
                        collapserEl;

                    // Initialize
                    init();

                    function init()
                    {
                        expanderEl = iElement.find('#ms-search-bar-expander');
                        collapserEl = iElement.find('#ms-search-bar-collapser');

                        expanderEl.on('click', expand);
                        collapserEl.on('click', clearAndCollapse);
                    }

                    /**
                     * Expand
                     */
                    function expand()
                    {
                        iElement.addClass('expanded');

                        // Esc key event
                        $document.on('keyup', keysEvent);
                    }

                    /**
                     * Collapse
                     */
                    function collapse()
                    {
                        $document.off('keyup', keysEvent);
                        iElement.removeClass('expanded');
                    }

                    /**
                     * Clear data and collapse
                     */
                    function clearAndCollapse()
                    {
                        scope.$apply(function() {
                            scope.ngModel = '';
                        });
                        collapse();
                    }

                    /**
                     * Escape key event
                     *
                     * @param e
                     */
                    function keysEvent(e)
                    {
                        // ESC
                        if (e.keyCode === 27) 
                        {
                            clearAndCollapse();
                        }

                        // ENTER
                        if ( e.keyCode === 13 )
                        {
                            collapse();
                        }
                    }
                };
            }
        };
    }
})();