(function ()
{
    'use strict';

    angular
        .module('app.calendar')
        .directive('dragDropCalendar', dragDropCalendarDirective);

    /** @ngInject */
    function dragDropCalendarDirective($parse, $filter)
    {
        return {
            scope: { drop: '&' },
            link:function(scope,element){
                element.attr("draggable", "true");
                element.on('dragover', function(event) {
                    event.preventDefault();
                });
                element.on('drop', function(event) {
                    event.preventDefault();
                    var data = event.originalEvent.dataTransfer.getData("id");
                    var arr = data.split('-"');
                    var from = {
                        id: arr[0],
                        date: $filter('date')(arr[1].split('"')[0], 'yyyy-MM-dd')
                    };

                    arr = event.target.id ? event.target.id.split('-"') : event.currentTarget.id.split('-"');
                    var to = {
                        id: arr[0],
                        date: $filter('date')(arr[1].split('"')[0], 'yyyy-MM-dd')
                    };

                    scope.drop({from: from, to: to});
                });
                element.on('dragstart', function(event) {
                    event.originalEvent.dataTransfer.setData("id",event.target.id);
                    scope.$apply();
                });
            }

        };
    }
})();
