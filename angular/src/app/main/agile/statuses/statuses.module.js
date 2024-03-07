(function ()
{
    'use strict';

    angular
        .module('app.agile-statuses', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.agile-statuses', {
                url    : '/projects/:project_id/statuses',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/agile/statuses/statuses.html',
                        controller : 'AgileStatusesController as vm'
                    }
                },
                resolve: {
                    TicketTypesData: function ($stateParams, apiResolver) {
                        return apiResolver.resolve('ticket.types@get');
                    },
                }
            });
    }
})();