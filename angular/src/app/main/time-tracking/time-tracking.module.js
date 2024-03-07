(function ()
{
    'use strict';

    angular
        .module('app.time-tracking', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.time-tracking-def', {
                url    : '/time-tracking',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/time-tracking/time-tracking.html',
                        controller : 'TimeTrackingController as vm'
                    }
                }
            })
            .state('app.time-tracking-project', {
                url    : '/time-tracking/:project_id',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/time-tracking/time-tracking.html',
                        controller : 'TimeTrackingController as vm'
                    }
                }
            })
            .state('app.time-tracking-ticket', {
                url    : '/time-tracking/:project_id/:ticket_id',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/time-tracking/time-tracking.html',
                        controller : 'TimeTrackingController as vm'
                    }
                }
            })
            .state('app.time-tracking-user', {
            url    : '/time-tracking/:project_id/:ticket_id/:user_id',
            views  : {
                'content@app': {
                    templateUrl: 'app/main/time-tracking/time-tracking.html',
                    controller : 'TimeTrackingController as vm'
                }
            }
        })
        ;
    }
})();