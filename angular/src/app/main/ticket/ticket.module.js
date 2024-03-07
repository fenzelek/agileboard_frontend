(function ()
{
    'use strict';

    angular
        .module('app.ticket-show', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.ticket-show', {
                url    : '/projects/:project_id/ticket/:id',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/ticket/ticket.html',
                        controller : 'TicketShowController as vm'
                    }
                },
                resolve: {
                    TicketData: function ($stateParams, apiResolver)
                    {
                        return apiResolver.resolve('ticket.ticket@get', {
                            project_id:$stateParams.project_id,
                            id:$stateParams.id
                        });
                    }
                }
            });
    }
})();