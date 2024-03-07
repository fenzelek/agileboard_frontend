(function ()
{
    'use strict';

    angular
        .module('app.history')
        .controller('HistoryController', HistoryController);

    /** @ngInject */
    function HistoryController($element, api, $stateParams, projectsService, transService, $auth, StoriesData, TicketTypesData, SprintsData, UsersData, $http, $document, $timeout)
    {
        var vm = this;
        transService.loadFile('main/agile/history');

        // Data
        projectsService.setCurrent($stateParams.project_id);

        vm.permissions = ['owner', 'admin', 'developer'];
        projectsService.setCurrent($stateParams.project_id, function (project) {
            if (project.time_tracking_visible_for_clients) {
                vm.permissions.push('client');
            }
        });

        vm.loading = false;
        vm.allTicketsLoaded = false;
        vm.stories = StoriesData.data;
        vm.sprints = SprintsData.data;
        vm.users = UsersData.data;
        vm.sprints_copy = {};
        vm.selected_sprint = {};
        vm.selected_story = {};
        vm.selected_user = {};
        vm.search = '';
        vm.sprintSearch = '';
        vm.userSearch = '';
        vm.storySearch = '';
        vm.bug_id = 0;

        // Methods
        vm.init = init;
        vm.getAvatar = $auth.getAvatar;
        vm.formatEstimate = projectsService.formatEstimate;
        vm.hasPermission = projectsService.hasPermission;
        vm.hasAccess = projectsService.hasAccess;
        vm.selectSprint = selectSprint;
        vm.lockSprint = lockSprint;
        vm.exportSprint = exportSprint;
        vm.unlockSprint = unlockSprint;
        vm.selectStory = selectStory;
        vm.selectUser = selectUser;
        vm.userFilter = userFilter;
        vm.searchFilter = searchFilter;
        vm.searchSprintFilter = searchSprintFilter;
        vm.toggleSprint = toggleSprint;


        init();
        // The md-select directive eats keydown events for some quick select
        // logic. Since we have a search input here, we don't need that logic.
        $element.find('input.select-search').on('keydown', function(ev) {
            ev.stopPropagation();
        });

        /**
         * Initialize the controller
         */
        function init()
        {
            angular.forEach(TicketTypesData.data, function (type) {
                if (type.name == "Bug") {
                    vm.bug_id = type.id;
                }
            });


            vm.stories.unshift({
                id: 0,
                name: '',
                translate: 'HISTORY.ALL_STORIES'
            });

            vm.sprints.unshift({
                id: 0,
                name: '',
                translate: 'HISTORY.ALL_SPRINTS'
            });
            vm.sprints_copy = angular.copy(vm.sprints);

            // users - add not assigned and all users options
            vm.users.unshift({
                id: 'none',
                translate: 'OTHER.NOT_ASSIGNED'
            });
            vm.users.unshift({
                id: 0,
                translate: 'OTHER.ALL_USERS'
            });

            vm.selected_user = vm.users[0];
            vm.selected_sprint = vm.sprints_copy[0];
            vm.selected_story = vm.stories[0];


            // set all sprints to hidden
            vm.sprints = angular.forEach(vm.sprints, function (sprint) {
                sprint.hidden = true;
                sprint.tickets = [];
            });
        }

        function lockSprint(sprint) {
            api.sprint.lock.put({
                project_id: $stateParams.project_id,
                id: sprint.id
            }, function () {
                sprint.locked = true;
            },function (response) {
                console.log(transService.getErrorMassage(response));
            });
        }

        function unlockSprint(sprint) {
            api.sprint.unlock.put({
                project_id: $stateParams.project_id,
                id: sprint.id
            }, function () {
                sprint.locked = false;
            },function (response) {
                console.log(transService.getErrorMassage(response));
            });
        }

        function exportSprint(sprint) {
            $http.get(__env.apiUrl + 'projects/' + $stateParams.project_id +'/sprints/'+ sprint.id +'/export?', { responseType: 'blob' }).then(function (resp) {
                var blob = new Blob([resp.data]);
                var link = $document[0].createElement('a');
                // create a blobURI pointing to our Blob
                link.href = URL.createObjectURL(blob);
                link.download = 'Sprint History Export ' + Date.now() + '.xlsx';

                // some browser needs the anchor to be in the doc
                $document[0].body.append(link);
                link.click();
                link.remove();

                $timeout(function () {
                    URL.revokeObjectURL(link.href);
                }, 7000);

            }, function (response) {
                var msg = transService.getErrorMassage(response);
                toastr.error(msg);
            });
        }

        function selectSprint(sprint_id) {
            angular.forEach(vm.sprints_copy, function(sprint) {
                if(sprint.id == sprint_id) {
                    vm.selected_sprint = sprint;
                }
            });
            var new_sprints = [];
            angular.forEach(vm.sprints_copy, function (sprint) {
                if (sprint.id == vm.selected_sprint.id) {
                    new_sprints.push(sprint);
                }
            });
            if (new_sprints.length && new_sprints[0].id) {
                vm.sprints = new_sprints;
            } else {
                vm.sprints = angular.copy(vm.sprints_copy);
            }
            // apply story filter
            loadTickets();
        }

        function selectStory(story_id) {
            angular.forEach(vm.stories, function(story) {
                if(story.id == story_id) {
                    vm.selected_story = story;
                }
            });

            loadTickets();
        }

        function selectUser(user_id) {
            angular.forEach(vm.users, function(user) {
                if(user.id == user_id) {
                    vm.selected_user = user;
                }
            });
        }

        function loadTickets() {
            angular.forEach(vm.sprints, function (sprint, key) {
                (function (sprint, key) {
                    var params = {
                        project_id: $stateParams.project_id,
                        sprint_id: sprint.id
                    };

                    // story filter
                    if (typeof vm.selected_story.id != 'undefined' && vm.selected_story.id) {
                        params.story_id = vm.selected_story.id;
                    }

                    if (!vm.all_tickets) {
                        params.hidden = 0;
                    }

                    api.ticket.tickets.get(params, function (response_ticket) {
                        vm.sprints[key].tickets = response_ticket.data;
                    });
                })(sprint, key);
            });
            loadStats();
        }

        function loadStats() {
            var params = {
                project_id: $stateParams.project_id,
                status: 'closed',
                stats: 'min'
            };

            // apply story filter
            if (typeof vm.selected_story.id != 'undefined' && vm.selected_story.id) {
                params.story_id = vm.selected_story.id;
            }
            api.sprint.sprints.get(params, function (response) {
                angular.forEach(response.data, function (new_sprint) {
                    for (var i in vm.sprints) {
                        if (vm.sprints[i].id == new_sprint.id) {
                            vm.sprints[i].stats = new_sprint.stats;
                            break;
                        }
                    }
                })
            })
        }

        /**
         * Filters ticket through search query
         *
         * @param {object} ticket
         * @returns {boolean} ticket match ticket credentials or not
         */
        function searchFilter(ticket) {
            if (vm.search) {
                var query = vm.search.toLowerCase();
                var ticket_name = ticket.name.toLowerCase();
                var ticket_title = ticket.title.toLowerCase();

                if(ticket_name.indexOf(query) >=0 || ticket_title.indexOf(query) >= 0) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return true;
            }
        }

        /**
         * Returns false if not has tickets that pass search / filter credentials
         *
         * @param {object} sprint
         * @returns {boolean} sprint have any search-matching tickets or not
         */
        function searchSprintFilter(sprint) {
            if (vm.search) {
                loadAllSprintTickets();
                var tickets = sprint.tickets ? sprint.tickets : sprint; // sprints or backlog
                var tickets_present = false;
                angular.forEach(tickets, function(ticket) {
                    if(searchFilter(ticket)) {
                        tickets_present = true;
                    }
                });

                return tickets_present;
            } else {
                return true;
            }
        }

        /**
         * Filters ticket through selected user filter
         *
         * @param {object} ticket
         * @returns {boolean} - ticket passed filtration or not
         */
        function userFilter(ticket) {
            if (vm.selected_user.id) {
                if (vm.selected_user.id == 'none') {
                    return ticket.assigned_id === null ? true : false;
                } else {
                    return vm.selected_user.user_id === ticket.assigned_id ? true : false;
                }
            } else {
                return true;
            }
        }

        function toggleSprint(index) {
            vm.sprints[index].hidden = !vm.sprints[index].hidden;
            loadSprintTickets(vm.sprints[index]);
        }

        function loadSprintTickets(sprint) {
            if (vm.allTicketsLoaded) {
                return;
            }
            if (sprint.tickets && sprint.tickets.length == 0) {
                sprint.loading = true;
                api.ticket.tickets.get({
                    project_id: $stateParams.project_id,
                    sprint_id: sprint.id,
                    story_id: vm.selected_story.id ? vm.selected_story.id : null
                }, function (response) {
                    sprint.tickets = response.data;
                    sprint.loading = false;
                });
            }
        }

        function loadAllSprintTickets() {
            if (vm.allTicketsLoaded || vm.loading) {
                return;
            }
            // reset filters
            vm.selected_user = vm.users[0];
            vm.selected_sprint = vm.sprints[0];
            vm.selected_story = vm.stories[0];
            // load tickets
            vm.loading = true;
            api.sprint.sprints.get({
                project_id: $stateParams.project_id,
                status: 'closed',
                stats: 'min',
                with_tickets: 1
            }, function (response) {
                // Add tickets to existing sprints
                angular.forEach(vm.sprints, function (sprint) {
                    angular.forEach(response.data, function (newSprint) {
                        if (sprint.id == newSprint.id) {
                            sprint.tickets = newSprint.tickets.data;
                        }
                    });
                });
                vm.allTicketsLoaded = true;
                vm.loading = false;
            });
        }


    }
})();
