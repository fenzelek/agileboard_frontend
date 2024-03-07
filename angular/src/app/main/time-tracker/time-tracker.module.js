(function ()
{
    'use strict';

    angular
        .module('app.time-tracker', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider) {
        // State
        $stateProvider
            .state('app.time-tracker-screens', {
                url    : '/time-tracker/screens',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/time-tracker/screens/screens.html',
                        controller : 'ScreensController as vm'
                    }
                }
            });
    }
})();