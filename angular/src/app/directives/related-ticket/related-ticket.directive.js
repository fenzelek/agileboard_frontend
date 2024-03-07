(function ()
{
    'use strict';

    angular
        .module('app.core')
        .directive('relatedTicket', relatedTicketDirective);

    /** @ngInject */
    function relatedTicketDirective($auth, $parse)
    {
        return {
            restrict: 'E',
            scope: {
                ticket: '=',
                statuses: '=',
                click: '&'
            },
            template: function() {
                return '<div layout="row" layout-align="space-between center" class="related-ticket pr-10">' +
                    '    <div class="mt-5 mb-5">' +
                    '        <a ng-click="click()" class="font-size-14 text-bold grey-800-fg">' +
                    '            {{ ticket.title }}' +
                    '            <md-tooltip>{{ ticket.name }}</md-tooltip>' +
                    '        </a>' +
                    '        <span ng-repeat="status in statuses" ng-if="status.id === ticket.status_id"' +
                    '            class="font-size-12 grey-600-fg">' +
                    '            &nbsp; {{ status.name }}' +
                    '        </span>' +
                    '    </div>' +
                    '    <div ng-if="ticket.assigned_user.data">' +
                    '        <img class="related-ticket-avatar" ng-src="{{ getAvatar(ticket.assigned_user.data.avatar) }}">' +
                    '        <md-tooltip>{{ ticket.assigned_user.data.first_name }} {{ ticket.assigned_user.data.last_name }}</md-tooltip>' +
                    '    </div>' +
                    '</div>';
            },
            link: function (scope, el, attrs) {
                scope.getAvatar = $auth.getAvatar;
            }
          };
    }
})();
