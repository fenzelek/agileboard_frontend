(function ()
{
    'use strict';

    angular
        .module('app.projects-show', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.projects-show', {
                url    : '/projects/:id/show',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/projects/show/show.html',
                        controller : 'ProjectsShowController as vm'
                    }
                }
            });
    }
})();