(function ()
{
    'use strict';

    angular
        .module('app.scrumboard-ticket', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        $stateProvider.state('app.scrumboard-ticket', {
            url     : '/projects/:project_id/agile/:ticket_title',
            views   : {
                'content@app': {
                    templateUrl: 'app/main/agile/scrumboard-ticket/scrumboard-ticket.html',
                    controller: 'ScrumboardTicketController as vm'
                }
            },

            resolve: {
                StatusesData: function ($stateParams, apiResolver)
                {
                    return apiResolver.resolve('agileStatuses@get', {
                        project_id: $stateParams.project_id,
                        tickets: 0
                    });
                },
                TicketData: function ($stateParams, apiResolver)
                {
                    return apiResolver.resolve('ticket.ticket@get', {
                        project_id: $stateParams.project_id,
                        id: $stateParams.ticket_title
                    });
                },
            }
        })

    }
})();
