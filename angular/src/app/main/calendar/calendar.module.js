(function ()
{
    'use strict';

    angular
        .module('app.calendar',[])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        $stateProvider
            .state('app.calendar', {
                url: '/calendar/:view',
                views: {
                    'content@app': {
                        templateUrl: 'app/main/calendar/calendar.html',
                        controller: 'CalendarController as vm'
                    }
                },
                bodyClass: 'calendar'
            })
            .state('app.calendar-department', {
                url: '/:department',
                parent:'app.calendar',
                views: {
                    'content@app': {
                        templateUrl: 'app/main/calendar/calendar.html',
                        controller: 'CalendarController as vm'
                    }
                },
                bodyClass: 'calendar'
            })
            .state('app.activity-calendar', {
                url: '/activity-calendar',
                views: {
                    'content@app': {
                        controller: 'ActivityCalendarController as vm',
                        templateUrl: 'app/main/calendar/activity/activity-calendar.html'
                    }
                },
                bodyClass: 'calendar'
            })
            .state('app.summary-calendar', {
                url: '/summary-calendar',
                views: {
                    'content@app': {
                        controller: 'SummaryCalendarController as vm',
                        templateUrl: 'app/main/calendar/summary/summary-calendar.html'
                    }
                },
                bodyClass: 'calendar'
            });
    }
})();
