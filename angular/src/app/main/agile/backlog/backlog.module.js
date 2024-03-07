(function ()
{
    'use strict';

    angular
        .module('app.backlog', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider.state('app.backlog', {
            url      : '/projects/:project_id/backlog',
            views    : {
                'content@app': {
                    templateUrl: 'app/main/agile/backlog/backlog.html',
                    controller : 'backlogController as vm'
                }
            },
            bodyClass: 'backlog',
            resolve: {
                TicketTypesData: function (apiResolver)
                {
                    return apiResolver.resolve('ticket.types@get');
                },
                StatusesData: function ($stateParams, apiResolver)
                {
                    return apiResolver.resolve('agileStatuses@get', {
                        project_id: $stateParams.project_id,
                        tickets: 0
                    });
                },
                StoriesData: function ($stateParams, apiResolver)
                {
                    return apiResolver.resolve('stories@get', {
                        project_id: $stateParams.project_id,
                        limit: 200
                    });
                },
                SprintsData: function (StoriesData, $stateParams, apiResolver, projectFiltersService)
                {
                    var params = {
                        project_id: $stateParams.project_id,
                        status: 'not-closed',
                        with_backlog: 1,
                        with_tickets: 0
                    };

                    // apply filters
                    var ticket_filters = projectFiltersService.getTicketFilters('backlog', $stateParams.project_id);
                    if(typeof ticket_filters != 'undefined') {
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

                    return apiResolver.resolve('sprint.sprints@get', params);
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
        });
    }

})();
