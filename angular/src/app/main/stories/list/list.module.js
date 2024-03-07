(function ()
{
    'use strict';

    angular
        .module('app.stories-list', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.stories-list', {
                url    : '/projects/:project_id/stories',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/stories/list/list.html',
                        controller : 'StoriesListController as vm'
                    }
                },
                resolve : {
                    StoriesList: function ($stateParams, apiResolver)
                    {
                        return apiResolver.resolve('stories@get', {project_id: $stateParams.project_id, limit:__env.table_limit_rows});
                    }
                }
            });
    }
})();