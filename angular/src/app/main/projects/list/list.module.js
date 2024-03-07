(function ()
{
    'use strict';

    angular
        .module('app.projects-list', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.projects-list', {
                url    : '/projects/list',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/projects/list/list.html',
                        controller : 'ProjectsListController as vm'
                    }
                },
                resolve: {
                    Projects: function (apiResolver) {
                        return apiResolver.resolve('projects@get', { status: 'opened', limit:__env.table_limit_rows });
                    }
                }
            });
    }
})();
