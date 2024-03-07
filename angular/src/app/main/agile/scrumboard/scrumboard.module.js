(function ()
{
    'use strict';

    angular
        .module('app.scrumboard', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        $stateProvider

            // Board
            .state('app.scrumboard', {
                    url    : '/projects/:project_id/agile',
                    views  : {
                        'content@app'                           : {
                            templateUrl: 'app/main/agile/scrumboard/scrumboard.html',
                            controller : 'ScrumboardController as vm'
                        }
                    },
                    resolve: {
                        TicketTypesData: function ($stateParams, apiResolver)
                        {
                            return apiResolver.resolve('ticket.types@get');
                        },
                        SprintsData: function ($stateParams, apiResolver)
                        {
                            return apiResolver.resolve('sprint.sprints@get', {
                                project_id: $stateParams.project_id,
                                status: 'not-closed'
                            });
                        },
                        StoriesData: function ($stateParams, apiResolver)
                        {
                            return apiResolver.resolve('stories@get', {
                                project_id: $stateParams.project_id,
                                limit: 200
                            });
                        },
                        StatusesData: function ($stateParams, $timeout, $location, apiResolver, projectFiltersService, SprintsData, StoriesData)
                        {
                            var params = {
                                project_id: $stateParams.project_id,
                                tickets: 1,
                                backlog: SprintsData.data.length ? 0 : 1
                            };

                            // apply filters
                            var ticket_filters = projectFiltersService.getTicketFilters('agile', $stateParams.project_id);
                            if(typeof ticket_filters != 'undefined') {
                                if (ticket_filters.sprint) {
                                    params['sprint_ids[]'] = [];
                                    angular.forEach(SprintsData.data, function(sprint) {
                                        if (angular.isArray(ticket_filters.sprint) &&
                                            ticket_filters.sprint.indexOf(sprint.id) !== -1) {
                                            params['sprint_ids[]'].push(sprint.id);
                                        }
                                    });
                                }
                                if(ticket_filters.story) {
                                    params['story_ids[]'] = [];
                                    angular.forEach(StoriesData.data, function(story) {
                                        if (angular.isArray(ticket_filters.story) &&
                                            ticket_filters.story.indexOf(story.id) !== -1) {
                                            params['story_ids[]'].push(story.id);
                                        }
                                    });
                                }
                            }

                            return apiResolver.resolve('agileStatuses@get', params);
                        },
                        UsersData: function ($stateParams, apiResolver)
                        {
                            return apiResolver.resolve('projectUsers@get', {
                                id: $stateParams.project_id
                            });
                        }
                    },
                    onEnter: function($stateParams, $location, $timeout, StatusesData, projectsService) {
                        if (!StatusesData.data.length && projectsService.hasAccess(['owner', 'admin'])) {
                            $timeout(function() {
                                $location.path('/projects/' + $stateParams.project_id + '/statuses');
                            }, 100);
                        }
                    }
                }
            )
    }

})();
