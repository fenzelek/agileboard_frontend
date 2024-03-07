(function ()
{
    'use strict';

    angular
        .module('app.core')
        .factory('tableService', tableService);

    /** @ngInject */
    function tableService(transService, $timeout)
    {
        var service = {
            setVariables: setVariables,
            scrollToTableTop: scrollToTableTop
        };

        return service;

        function setVariables(vm) {
            vm.promise = null;
            vm.query = {
                sort: '',
                limit: __env.table_limit_rows,
                page: 1
            };
            vm.table_translate = {
                page :transService.translate("PAGINATION.PAGE"),
                rowsPerPage :transService.translate("PAGINATION.ROWS"),
                of :transService.translate("PAGINATION.OF")
            };
        }

        function scrollToTableTop() {
            var contentElement = angular.element('#content');
            var tableElement = angular.element('.md-table');
            if (!tableElement || !tableElement[0] || !contentElement || !contentElement[0]) {
                return;
            }
            // if user arleady see the top of the table
            if (contentElement[0].scrollTop < tableElement[0].offsetTop) {
            return;
            }
            // if table header is not visible - scroll to the top
            $timeout(function () {
                console.log(contentElement);
                contentElement.animate({
                    scrollTop: tableElement[0].offsetTop - 50
                }, 300);
            }, 100);
        }
    }
})();
