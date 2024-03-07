(function ()
{
    'use strict';

    angular
        .module('app.history', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider.state('app.history', {
            url      : '/projects/:project_id/history',
            views    : {
                'content@app': {
                    templateUrl: 'app/main/agile/history/history.html',
                    controller : 'HistoryController as vm'
                }
            },
            bodyClass: 'history',
            resolve: {
                StoriesData: function ($stateParams, apiResolver)
                {
                    return apiResolver.resolve('stories@get', {
                        project_id: $stateParams.project_id,
                        limit: 200
                    });
                },
                SprintsData: function ($stateParams, apiResolver)
                {
                    return apiResolver.resolve('sprint.sprints@get', {
                        project_id: $stateParams.project_id,
                        status: 'closed',
                        stats: 'min',
                        with_tickets: 0
                    });
                },
                UsersData: function ($stateParams, apiResolver)
                {
                    return apiResolver.resolve('projectUsers@get', {
                        id: $stateParams.project_id
                    });
                },
                TicketTypesData: function ($stateParams, apiResolver)
                {
                    return apiResolver.resolve('ticket.types@get');
                }
            }
        });
    }

})();
