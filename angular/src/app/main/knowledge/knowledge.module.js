(function ()
{
    'use strict';

    angular
        .module('app.knowledge', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
        
        .state('app.knowledge', {
            url      : '/projects/:project_id/knowledge',
            views    : {
                'content@app': {
                    templateUrl: 'app/main/knowledge/knowledge.html',
                    controller : 'KnowledgeController as vm'
                }
            },
            bodyClass: 'knowledge',
            resolve : {
                Directories: function ($stateParams, apiResolver)
                {
                    return apiResolver.resolve('directories@get', {project_id:$stateParams.project_id} );
                },
                SinglePages: function ($stateParams, apiResolver)
                {
                    return apiResolver.resolve('pages@get', {project_id:$stateParams.project_id, knowledge_directory_id:0} );
                },
                StoriesData: function ($stateParams, apiResolver)
                {
                    return apiResolver.resolve('stories@get', {project_id: $stateParams.project_id, limit: 200 });
                }
            }
        });

    }
})();
