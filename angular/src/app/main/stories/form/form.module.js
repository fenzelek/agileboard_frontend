(function ()
{
    'use strict';

    angular
        .module('app.stories-form', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.stories-form-new', {
                url    : '/projects/:project_id/stories/form/:type?success',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/stories/form/form.html',
                        controller : 'StoriesFormController as vm'
                    }
                },
                resolve : {
                    Story: function() {
                        return {data: {}};
                    }
                }
            })
            .state('app.stories-form-edit', {
                url    : '/projects/:project_id/stories/form/:type/:id',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/stories/form/form.html',
                        controller : 'StoriesFormController as vm'
                    }
                },
                resolve : {
                    Story: function ($stateParams, apiResolver)
                    {
                        return apiResolver.resolve('story@get', {id: $stateParams.id, project_id: $stateParams.project_id,});
                    }
                }
        });
    }
})();