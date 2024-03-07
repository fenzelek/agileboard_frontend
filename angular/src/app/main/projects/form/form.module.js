(function ()
{
    'use strict';

    angular
        .module('app.projects-form', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.projects-form-new', {
                url    : '/projects/form/:type',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/projects/form/form.html',
                        controller : 'ProjectsFormController as vm'
                    }
                },
                resolve: {
                    Roles: function ($stateParams, apiResolver) {
                        return apiResolver.resolve('rolesCompany@get');
                    },
                    Project: function ()
                    {
                        return []
                    },
                    ProjectUsers: function ()
                    {
                        return [];
                    }
                }
            })
            .state('app.projects-form-edit', {
                url    : '/projects/form/:type/:id',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/projects/form/form.html',
                        controller : 'ProjectsFormController as vm'
                    }
                },
                resolve: {
                    Roles: function (apiResolver) {
                        return apiResolver.resolve('rolesCompany@get');
                    },
                    Project: function ($stateParams, apiResolver)
                    {
                        return apiResolver.resolve('project@get', {
                            id:$stateParams.id
                        });
                    },
                    ProjectUsers: function ($stateParams, apiResolver)
                    {
                        return apiResolver.resolve('projectUsers@get', {
                            id:$stateParams.id
                        });
                    }
                }
        });
    }
})();