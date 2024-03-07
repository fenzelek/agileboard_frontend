(function ()
{
    'use strict';

    angular
        .module('app.backlog')
        .controller('backlogController', backlogController);

    /** @ngInject */
    function backlogController($element, $timeout, api, dialogService, $stateParams, $mdSelect, projectsService,
        projectFiltersService, transService, $auth, StatusesData, TicketTypesData, StoriesData, SprintsData, UsersData,
        scrumboardSidenav, socket, $sce, toastService, $http, $document)
    {
        var vm = this;
        transService.loadFile('main/agile/backlog');

        // Data
        vm.permissions = ['owner', 'admin', 'developer'];
        vm.edit_permissions = ['owner', 'admin', 'developer'];

        projectsService.setCurrent($stateParams.project_id, function (project) {
            if (project.time_tracking_visible_for_clients) {
                vm.permissions.push('client');
            }
        });

        vm.sprints = SprintsData.data;
        vm.stories = StoriesData.data;
        vm.users = UsersData.data;
        vm.loading_tickets = false
        vm.last_status_id = 0;
        vm.statuses_defined = false;
        vm.all_tickets = true;
        vm.msg_success = '';
        vm.msg_error = '';
        vm.bug_id = 0;
        vm.source_sprints = [];
        vm.selected_stories = [];
        vm.selected_users = [];
        vm.search = '';
        vm.userSearch = '';
        vm.storySearch = '';
        vm.userId = null;


        vm.sortableOptions = {
            appendTo      : 'body',
            connectWith   : '.backlog-items',
            items         : '> .backlog-item',
            forceFallback : true,
            // placeholder: 'backlog-item-placeholder',
            ghostClass    : 'backlog-item-placeholder',
            fallbackClass : 'backlog-item-ghost',
            fallbackOnBody: true,
            // handle              : msUtils.isMobile() ? '.handle' : false,
            handle              : '.handle',
            scroll              : true,
            sort: sort,
            start : function (event, ui)
            {
                vm.source_sprints = angular.copy(vm.sprints);
            },
            stop : function (event, ui)
            {
                var before_ticket_id = null;
                var sprint_id = 0;
                var ticket_id = ui.item[0].attributes['ticket-id'].value;
                var sprint_key = event.target.attributes['sprint-key'].value;

                var sprint_tickets = vm.sprints[sprint_key].tickets;
                if (vm.source_sprints[sprint_key].tickets.length == sprint_tickets.length) {
                    sprint_id = vm.sprints[sprint_key].id;
                    //in sprint
                    for(var i in sprint_tickets) {
                        if (sprint_tickets[i].id == ticket_id) {
                            break;
                        } else {
                            before_ticket_id = sprint_tickets[i].id;
                        }
                    }
                } else {
                    //to sprint
                    for(var j in vm.sprints) {
                        if (vm.sprints[j].tickets.length > vm.source_sprints[j].tickets.length) {
                            sprint_id = vm.sprints[j].id;

                            for(var i in vm.sprints[j].tickets) {
                                if (vm.sprints[j].tickets[i].id == ticket_id) {
                                    break;
                                } else {
                                    before_ticket_id = vm.sprints[j].tickets[i].id;
                                }
                            }

                            break;
                        }
                    }
                }

                var form = {
                    project_id: $stateParams.project_id,
                    id: ticket_id,
                    before_ticket_id: before_ticket_id,
                    sprint_id: sprint_id
                };

                // sprint blocked
                var sprint_locked = false;
                getSprint(sprint_id, function(sprint, key) {
                    if (sprint.locked) {
                        sprint_locked = true;
                        // recover source sprint tickets
                        vm.sprints[sprint_key] = vm.source_sprints[sprint_key];
                        // recover destination sprint tickets
                        vm.sprints[key] = vm.source_sprints[key];
                    }
                });
                if (sprint_locked) {
                    toastService.showError(transService.translate('BACKLOG.SPRINT_BLOCKED'));
                    return;
                }

                api.ticket.changePriority.put(form, function () {
                    refreshSidenav(ticket_id);
                }, function() {
                    vm.sprints = vm.source_sprints;
                });
            }
        };

        vm.sortableSprintOptions = {
            axis       : 'y',
            delay      : 75,
            distance   : 7,
            items      : '> .sprint-enable-move',
            handle     : '.sprint-handle .move',
            placeholder: 'sprint sprint-sortable-placeholder',
            tolerance  : 'pointer',
            sort: sort,
            start: function (event, ui)
            {
                vm.source_sprints = angular.copy(vm.sprints);
                var width = ui.item[0].children[0].clientWidth;
                var height = ui.item[0].children[0].clientHeight;
                ui.placeholder.css({
                    'min-width': width + 'px',
                    'width'    : width + 'px',
                    'height'   : height + 'px'
                });
            },
            stop: function(e, ui) {
                //sprints change priority
                var sprints = [];
                angular.forEach(vm.sprints, function (sprint) {
                    if (sprint.id) {
                        sprints.push(sprint.id);
                    }
                });

                var form = {
                    project_id: $stateParams.project_id,
                    sprints: sprints
                };
                api.sprint.changePriority.put(form, function () {}, function () {
                    vm.sprints = vm.source_sprints;
                });
            }
        };

        function sort(event, ui)
        {
            var boardContentEl = ui.placeholder.closest('#backlog-scroll');

            if ( boardContentEl )
            {
                var boardContentElHeight = boardContentEl[0].clientHeight,
                    boardContentElScrollHeight = boardContentEl[0].scrollHeight;

                if ( boardContentElHeight !== boardContentElScrollHeight )
                {
                    var itemTop = ui.offset.top,
                        itemBottom = itemTop + ui.item.height(),
                        boardTop = boardContentEl.offset().top,
                        boardBottom = boardTop + boardContentElHeight;

                    if ( itemTop < boardTop + 25 )
                    {
                        boardContentEl.scrollTop(boardContentEl.scrollTop() - 10);
                    }

                    if ( itemBottom > boardBottom - 25 )
                    {
                        boardContentEl.scrollTop(boardContentEl.scrollTop() + 10);
                    }
                }
            }
        }

        // The md-select directive eats keydown events for some quick select
        // logic. Since we have a search input here, we don't need that logic.
        $element.find('input.select-search').on('keydown', function(ev) {
            ev.stopPropagation();
        });

        // Methods
        vm.preventDefault = preventDefault;
        vm.exportSprint = exportSprint;
        vm.formatEstimate = projectsService.formatEstimate;
        vm.getTicketTimeClass = projectsService.getTicketTimeClass;
        vm.hasPermission = projectsService.hasPermission;
        vm.hasAccess = projectsService.hasAccess;
        vm.createSprint = createSprint;
        vm.updateSprint = updateSprint;
        vm.closeSprint = closeSprint;
        vm.toggleSprint = toggleSprint;
        vm.activeSprint = activeSprint;
        vm.pauseSprint = pauseSprint;
        vm.resumeSprint = resumeSprint;
        vm.lockSprint = lockSprint;
        vm.unlockSprint = unlockSprint;
        vm.deleteSprint = deleteSprint;
        vm.cloneSprint = cloneSprint;
        vm.addEditTicket = addEditTicket;
        vm.deleteTicket = deleteTicket;
        vm.getAvatar = $auth.getAvatar;
        vm.searchFilter = searchFilter;
        vm.searchSprintFilter = searchSprintFilter;
        vm.userFilter = userFilter;
        vm.setPlannedDate = setPlannedDate;
        vm.showAllSprints = showAllSprints;
        vm.hideAllSprints = hideAllSprints;
        vm.selectStory = selectStory;
        vm.selectStoryAll = selectStoryAll;
        vm.selectStoryLabel = selectStoryLabel;
        vm.selectUser = selectUser;
        vm.selectUserAll = selectUserAll;
        vm.selectUserNotAssigned = selectUserNotAssigned;
        vm.selectUserLabel = selectUserLabel;
        vm.resetfilters = resetfilters;

        init();

        //////////

        /**
         * Initialize the controller
         */
        function init()
        {
            scrumboardSidenav.setStructure(vm, function(action, data) {
                if (action == 'delete') {
                    removeFromSprint(vm.selected_ticket.sprint_id, vm.selected_ticket.id);
                } else if (action == 'update') {
                    var oldSprint = vm.selected_ticket.sprint.data ? vm.selected_ticket.sprint.data.id : vm.selected_ticket.sprint_id;
                    refreshTicket(oldSprint, data.sprint_id, data.id, data);
                }
            });

            angular.forEach(TicketTypesData.data, function (type) {
                if (type.name == "Bug") {
                    vm.bug_id = type.id;
                }
            });

            //statuses
            if (StatusesData.data.length) {
                vm.last_status_id = StatusesData.data[StatusesData.data.length - 1].id;
                vm.statuses_defined = true;
            }

            // stories ls
            vm.ticket_filters = projectFiltersService.getTicketFilters('backlog', $stateParams.project_id);
            if(typeof vm.ticket_filters != 'undefined') {
                if(vm.ticket_filters.story) {
                    var story_present = false;
                    angular.forEach(vm.stories, function(story) {
                        if (angular.isArray(vm.ticket_filters.story) &&
                            vm.ticket_filters.story.indexOf(story.id) !== -1) {
                            vm.selected_stories.push(story.id);
                            story_present = true;
                        }
                    });
                    if (!story_present) {
                        projectFiltersService.removeTicketFilter('backlog_story', $stateParams.project_id);
                    }
                }
            }
            // users ls
            if(typeof vm.ticket_filters != 'undefined') {
                if(vm.ticket_filters.user) {
                    var user_present = false;
                    angular.forEach(vm.users, function (user) {
                        if (angular.isArray(vm.ticket_filters.user) &&
                            vm.ticket_filters.user.indexOf(user.user_id) !== -1) {
                            vm.selected_users.push(user.user_id);
                            user_present = true;
                        }
                    });
                    if (!user_present) {
                        projectFiltersService.removeTicketFilter('backlog_user', $stateParams.project_id);
                    }
                }
            }

            $auth.getUser(function(user) {
                vm.userId = user.id;
            });

            loadSprintsTickets();
            sprintVisibleFilter();
            websocketEvents();
        }

        function loadSprintsTickets() {
            vm.loading_tickets = true;
            var params = {
                project_id: $stateParams.project_id,
                status: 'not-closed',
                stats: 'all',
                with_backlog: 1,
                with_tickets: 1
            }

            if (vm.selected_stories.length) {
                params['story_ids[]'] = vm.selected_stories;
            }

            api.sprint.sprints.get(params, function (response) {
                vm.loading_tickets = false;
                angular.forEach(vm.sprints, function (sprint, index) {
                    sprint.tickets = [];
                    sprint.loading = true;
                    angular.forEach(response.data, function (s) {
                        if (sprint.id == s.id) {
                            // timeout because of "block-rendering" - too many tickets (DOM elements)
                            $timeout(function () {
                                sprint.tickets = s.tickets.data;
                                sprint.loading = false;
                            }, index * 300);
                            // load stats
                            sprint.stats = s.stats;
                        }
                    });
                });
            });
        }

        function resetfilters() {
            vm.selected_stories = [];
            projectFiltersService.addTicketFilter(vm.selected_stories, 'backlog_story', $stateParams.project_id);
            vm.selected_users = [];
            projectFiltersService.addTicketFilter(vm.selected_users, 'backlog_user', $stateParams.project_id);
            fetchAllSprints();
        }

        function selectStory(id) {
            if (id) {
                vm.selected_stories = [id];
            }
            fetchAllSprints();
            vm.storySearch = '';
            projectFiltersService.addTicketFilter(vm.selected_stories, 'backlog_story', $stateParams.project_id);
        }
        function selectStoryAll() {
            $mdSelect.hide();
            vm.selected_stories = [];
        }
        function selectStoryLabel() {
            var label = transService.translate('OTHER.STORIES');
            if (vm.selected_stories.length) {
                label += ' (' + vm.selected_stories.length + ')';
            }
            return label;
        }

        function fetchAllSprints() {
            var params = {
                project_id: $stateParams.project_id,
                status: 'not-closed',
                stats: 'all',
                with_backlog: 1,
                with_tickets: 1
            };

            if (vm.selected_stories.length) {
                params['story_ids[]'] = vm.selected_stories;
            }

            api.sprint.sprints.get(params, function (response) {
                vm.sprints = response.data;
                angular.forEach(vm.sprints, function (sprint) {
                    sprint.tickets = sprint.tickets.data;
                });
                sprintVisibleFilter();
            });
        }

        function selectUser(id) {
            if (id) {
                vm.selected_users = [id];
            }
            vm.userSearch = '';
            projectFiltersService.addTicketFilter(vm.selected_users, 'backlog_user', $stateParams.project_id);
        }
        function selectUserAll() {
            $mdSelect.hide();
            vm.selected_users = [];
        }
        function selectUserNotAssigned() {
            $mdSelect.hide();
            vm.selected_users = null;
        }
        function selectUserLabel() {
            var label = transService.translate('OTHER.USERS');
            if (vm.selected_users && vm.selected_users.length) {
                label += ' (' + vm.selected_users.length + ')';
            }
            return label;
        }

        function sprintVisibleFilter() {
            // update sprint show/hide tickets view
            vm.ticket_filters = projectFiltersService.getTicketFilters('backlog', $stateParams.project_id);
            if(typeof vm.ticket_filters != 'undefined' && vm.ticket_filters.sprint_hide) {
                angular.forEach(vm.sprints, function(sprint) {
                    if(vm.ticket_filters.sprint_hide.indexOf(sprint.id) >= 0) {
                        sprint.hidden = true;
                    }
                });
            }
        }

        /**
         * Get ticket for sprint
         *
         * @param sprint
         * @param key
         */
        function getTickets(sprint, key) {
            (function (sprint, key) {
                var params = {
                    project_id: $stateParams.project_id,
                    sprint_id: sprint.id
                };

                if (vm.selected_stories.length) {
                    params['story_ids[]'] = vm.selected_stories;
                }

                if (!vm.all_tickets) {
                    params.hidden = 0;
                }

                api.ticket.tickets.get(params, function (response_ticket) {
                    vm.sprints[key].tickets = response_ticket.data;
                });
            })(sprint, key);
        }

        /**
         * Prevent default
         *
         * @param e
         */
        function preventDefault(e)
        {
            e.preventDefault();
            e.stopPropagation();
        }

        function exportSprint(sprint) {
            $http.get(__env.apiUrl + 'projects/' + $stateParams.project_id +'/sprints/'+ sprint.id +'/export?', { responseType: 'blob' }).then(function (resp) {
                var blob = new Blob([resp.data]);
                var link = $document[0].createElement('a');
                // create a blobURI pointing to our Blob
                link.href = URL.createObjectURL(blob);
                link.download = 'Sprint Export ' + Date.now() + '.xlsx';

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

        /**
         * Show/hide sprint tickets
         * @param {integer} index
         */
        function toggleSprint(index) {
            vm.sprints[index].hidden = vm.sprints[index].hidden ? false : true;
            // save view into localStorage (works as toggle)
            projectFiltersService.addTicketFilter(vm.sprints[index].id, 'backlog_sprint_hide', $stateParams.project_id);
        }

        /**
         * Toggle all sprints to 'show'
         */
        function showAllSprints() {
            angular.forEach(vm.sprints, function(sprint) {
                sprint.hidden = false;
                // remove 'hidden' sprints data from localstorage
                projectFiltersService.removeTicketFilter('backlog_sprint_hide', $stateParams.project_id);
            });
        }

        /**
         * Toggle all sprints to 'hide'
         */
        function hideAllSprints() {
            // there is no method to show/hide sprint, only toggle
            // remove localStorage data to 'open all' to later toggle all sprints to 'hide'
            projectFiltersService.removeTicketFilter('backlog_sprint_hide', $stateParams.project_id);
            angular.forEach(vm.sprints, function(sprint) {
                sprint.hidden = true;
                projectFiltersService.addTicketFilter(sprint.id, 'backlog_sprint_hide', $stateParams.project_id);
            });
        }


        function createSprint() {
            var form = {
                project_id: $stateParams.project_id,
                name: $sce.valueOf(transService.translate('BACKLOG.SPRINT_NAME'))
            };

            api.sprint.sprints.save(form, function (response) {
                addSprint(response.data);
                vm.msg_success = transService.translate('BACKLOG.SPRINT_CREATED');
                vm.msg_error = '';
            });
        }

        function addSprint(sprint) {
            sprint.tickets = [];
            sprint.stats = {
                data: {
                    tickets_count: 0,
                    tickets_estimate_time: 0,
                    tracked_summary: 0,
                    activity_summary: 0,
                    activity_level: 0,
                    time_usage: 0,
                    un_started_estimations: 0,
                    expected_final: 0,
                    estimation_left: 0,
                    attitude_to_initial: 0
                }
            };
            vm.sprints.splice(vm.sprints.length - 1, 0, sprint);
        }

        function updateSprint(index, newValue, successCallback, apiErrorCallback) {
            var form = {
                project_id: $stateParams.project_id,
                id: vm.sprints[index].id,
                name: newValue,
                planned_activation: vm.sprints[index].planned_activation,
                planned_closing: vm.sprints[index].planned_closing
            };
            api.sprint.sprint.put(form,
                function() {
                    vm.sprints[index].name = newValue;
                    if (typeof successCallback != 'undefined') successCallback();
                },
                function(response) {
                    if (typeof apiErrorCallback != 'undefined') apiErrorCallback(response.data);
            });
        }

        function closeSprint(id) {
            var sprints = [];
            angular.forEach(vm.sprints, function(sprint) {
                if (!sprint.locked) {
                    sprints.push(sprint);
                }
            });
            dialogService.customDialog(null, 'SprintCloseDialogController', 'app/main/agile/sprint-close/sprint-close.html', {
                id: id,
                sprints: sprints,
                project_id: $stateParams.project_id
            }, function (data) {
                if (typeof data == 'object') {
                    getSprint(data.sprint_closed_id, function(sprint, key) {
                        vm.sprints.splice(key, 1);
                    });

                    getSprint(data.sprint_move_id, getTickets);
                }
            });
        }

        function cloneSprint(id) {
            dialogService.customDialog(null, 'SprintCloneDialogController', 'app/main/agile/sprint-clone/sprint-clone.html', {
                id: id,
                project_id: $stateParams.project_id
            }, function (sprint) {
                if (typeof sprint == 'object') {
                    addSprint(sprint);
                    loadSprintsTickets();
                }
            });
        }

        function activeSprint(id) {
            dialogService.confirm(null, 'BACKLOG.SPRINT_ACTIVE_QUESTION', function() {
                var form = {
                    project_id: $stateParams.project_id,
                    id: id
                };
                api.sprint.activate.put(form, function () {
                    vm.msg_success = '';
                    vm.msg_error = '';

                    getSprint(id, function(sprint) {
                        sprint.status = 'active';
                    })

                },function (response) {
                    vm.msg_error = transService.getErrorMassage(response);
                    vm.msg_success = '';
                });
            });
        }

        function pauseSprint(id) {
            dialogService.confirm(null, 'BACKLOG.SPRINT_PAUSE_QUESTION', function() {
                var form = {
                    project_id: $stateParams.project_id,
                    id: id
                };
                api.sprint.pause.put(form, function () {
                    vm.msg_success = '';
                    vm.msg_error = '';

                    getSprint(id, function(sprint) {
                        sprint.status = 'paused';
                    })

                },function (response) {
                    vm.msg_error = transService.getErrorMassage(response);
                    vm.msg_success = '';
                });
            });
        }

        function resumeSprint(id) {
            dialogService.confirm(null, 'BACKLOG.SPRINT_RESUME_QUESTION', function() {
                var form = {
                    project_id: $stateParams.project_id,
                    id: id
                };
                api.sprint.resume.put(form, function () {
                    vm.msg_success = '';
                    vm.msg_error = '';

                    getSprint(id, function(sprint) {
                        sprint.status = 'active';
                    })

                },function (response) {
                    vm.msg_error = transService.getErrorMassage(response);
                    vm.msg_success = '';
                });
            });
        }

        function lockSprint(id) {
            dialogService.confirm(null, 'BACKLOG.SPRINT_LOCK_QUESTION', function() {
                var form = {
                    project_id: $stateParams.project_id,
                    id: id
                };
                api.sprint.lock.put(form, function () {
                    vm.msg_success = '';
                    vm.msg_error = '';

                    getSprint(id, function(sprint) {
                        sprint.locked = true;
                    })

                },function (response) {
                    vm.msg_error = transService.getErrorMassage(response);
                    vm.msg_success = '';
                });
            });
        }

        function unlockSprint(id) {
            dialogService.confirm(null, 'BACKLOG.SPRINT_UNLOCK_QUESTION', function() {
                var form = {
                    project_id: $stateParams.project_id,
                    id: id
                };
                api.sprint.unlock.put(form, function () {
                    vm.msg_success = '';
                    vm.msg_error = '';

                    getSprint(id, function(sprint) {
                        sprint.locked = false;
                    })

                },function (response) {
                    vm.msg_error = transService.getErrorMassage(response);
                    vm.msg_success = '';
                });
            });
        }

        function deleteSprint(id) {
            dialogService.confirm(null, 'BACKLOG.SPRINT_DELETE_QUESTION', function() {
                var form = {
                    project_id: $stateParams.project_id,
                    id: id
                };
                api.sprint.sprint.delete(form, function () {
                    vm.msg_success = '';
                    vm.msg_error = '';

                    getSprint(id, function(sprint, key) {
                        vm.sprints.splice(key, 1);
                    });

                },function (response) {
                    vm.msg_error = transService.getErrorMassage(response);
                    vm.msg_success = '';
                });
            });
        }

        function addEditTicket(id, sprint_id) {
            if (typeof sprint_id == 'undefined') {
                sprint_id = 0;
            }
            dialogService.customDialog(null, 'AddEditTicketDialogController', 'app/main/agile/add-edit-ticket/add-edit-ticket.html', {id:id, project_id:$stateParams.project_id, sprint_id:sprint_id, scheduled_time_start: null}, function (success) {
                if (typeof success == 'object') {

                    if (typeof id == 'undefined') {

                        //add ticket
                        getSprint(success.sprint_id, function (sprint) {
                            getTicketFromApi(success.id, function (ticket) {
                                sprint.tickets.push(ticket);
                            })
                        });

                        vm.msg_success = transService.translate('BACKLOG.ADDED_TICKET') + ' <a ng-click="vm.addEditTicket('+success.id+')" >' + success.title + ' <md-icon md-font-icon="icon-pencil" class="s16 green-100-fg" style="line-height: 19px !important;"></md-icon></a>';
                        vm.msg_error = '';
                    } else {
                        refreshTicket(sprint_id, success.sprint_id, id);
                        refreshSidenav(id);

                        vm.msg_success = transService.translate('BACKLOG.UPDATED_TICKET');
                        vm.msg_error = '';
                    }
                }
            }, undefined, undefined, false);
        }

        function deleteTicket(ticket_id, sprint_id) {
            dialogService.confirm(null, 'BACKLOG.DELETE_QUESTION', function() {
                api.ticket.ticket.delete({project_id:$stateParams.project_id, id:ticket_id}, function () {
                    removeFromSprint(sprint_id, ticket_id);
                    vm.msg_success = transService.translate('BACKLOG.DELETED_TICKET');
                    vm.msg_error = '';
                },function (response) {
                    vm.msg_success = '';
                    vm.msg_error = transService.getErrorMassage(response);
                })
            });
        }

        /**
         * Filters ticket through search query
         *
         * @param {object} ticket
         * @returns {boolean} ticket match ticket credentials or not
         */
        function searchFilter(ticket) {
            if (!vm.search) {
                return true;
            }
            var query = vm.search.toLowerCase();
            var ticket_name = ticket.name.toLowerCase();
            var ticket_title = ticket.title.toLowerCase();
            var ticket_desc = ticket.description ? ticket.description.toLowerCase() : '';

            return ticket_name.indexOf(query) >= 0 ||
                ticket_title.indexOf(query) >= 0 ||
                ticket_desc.indexOf(query) >= 0;
        }

        /**
         * Returns false if not has tickets that pass search / filter credentials
         *
         * @param {object} sprint
         * @returns {boolean} sprint have any search-matching tickets or not
         */
        function searchSprintFilter(sprint) {
            if(vm.search) {
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
            if (vm.selected_users === null) {
                return ticket.assigned_id === null;
            };
            if (vm.selected_users.length) {
                return vm.selected_users.indexOf(ticket.assigned_id) !== -1;
            }
            return true;
        }



        function setPlannedDate(name, value, successCallback, apiErrorCallback, sprint) {
            var params = {
                id: sprint.id,
                name: sprint.name,
                project_id: $stateParams.project_id,
                planned_activation: sprint.planned_activation,
                planned_closing: sprint.planned_closing
            };
            switch(name) {
                case 'planned_activation':
                    params.planned_activation = value + ' 00:00:00';
                    break;
                case 'planned_closing':
                    params.planned_closing = value + ' 00:00:00';
                    break;
            }

            api.sprint.sprint.put(params, function(response) {
                refreshSprint(response.data);
                if (typeof successCallback != 'undefined') {
                    successCallback();
                }
            }, function(response) {
                if (typeof apiErrorCallback != 'undefined') {
                    apiErrorCallback(response.data);
                }
            });
        }

        /**
         * Refresh specific sprint data
         * @param {object} inc_sprint
         */
        function refreshSprint(inc_sprint) {
            getSprint(inc_sprint.id, function(sprint, key) {
                inc_sprint.tickets = sprint.tickets
                inc_sprint.stats = sprint.stats
                vm.sprints[key] = inc_sprint
            })
        }

        function getSprint(id, callback) {
            if (id === null) {
                id = 0;
            }
            angular.forEach(vm.sprints, function (sprint, key) {
                if (sprint.id == id) {
                    callback(vm.sprints[key], key);
                }
            });
        }

        function getTicket(sprint, id, callback) {
            angular.forEach(sprint.tickets, function (ticket, key) {
                if (ticket.id == id) {
                    callback(ticket[key], key);
                }
            });
        }

        function getTicketFromApi(id, callback) {
            api.ticket.ticket.get({project_id: $stateParams.project_id, id: id}, function (response) {
                callback(response.data);
            });
        }

        function refreshSidenav(ticket_id) {
            if (vm.selected_ticket && ticket_id == vm.selected_ticket.id) {
                scrumboardSidenav.refreshTicket();
            }
        }

        function removeFromSprint(sprint_id, ticket_id) {
            getSprint(sprint_id, function(sprint) {
                getTicket(sprint, ticket_id, function (ticket, key) {
                    sprint.tickets.splice(key, 1);
                })
            })
        }

        function refreshTicket(old_sprint_id, new_sprint_id, ticket_id, data) {
            if (old_sprint_id != new_sprint_id) {
                //different sprints, remove old, refresh all new sprint
                removeFromSprint(old_sprint_id, ticket_id);
                getSprint(new_sprint_id, getTickets);
            } else {
                //refresh only ticket if no data
                getSprint(old_sprint_id, function(sprint) {
                    getTicket(sprint, ticket_id, function (ticket, key) {
                        if (angular.isUndefined(data)) {
                            getTicketFromApi(ticket_id, function (data) {
                                sprint.tickets[key] = data;
                            })
                        } else {
                            sprint.tickets[key] = data;
                        }
                    })
                })
            }
        }

        function websocketEvents() {
            socket.on('new-sprint', function (data) {
                addSprint(data.sprint);
            });
            socket.on('update-sprint', function (data) {
                refreshSprint(data.sprint);
            });
            socket.on('change-status-sprint', function (data) {
                getSprint(data.sprint_id, function(sprint, key) {
                    if (data.status == 'active') {
                        sprint.status = 'active';
                    } else {
                        vm.sprints.splice(key, 1);
                    }
                });
                if (data.status == 'closed') {
                    getSprint(data.destination_sprint_id, getTickets);
                }
            });
            socket.on('delete-sprint', function (data) {
                getSprint(data.sprint_id, function(sprint, key) {
                    vm.sprints.splice(key, 1);
                });
            });
            socket.on('change-priority-sprint', function() {
                api.sprint.sprints.get({project_id:$stateParams.project_id, status:'not-closed', stats: 'all', with_backlog: 1}, function (response) {
                    angular.forEach(response.data, function (new_sprint) {
                        getSprint(new_sprint.id, function (sprint) {
                            new_sprint.tickets = sprint.tickets;
                            new_sprint.stats = sprint.stats;
                        });
                    });
                    vm.sprints = response.data;
                });
            });
            socket.on('store-ticket', function (data) {
                getSprint(data.sprint_id, function (sprint) {
                    getTicketFromApi(data.ticket_id, function (ticket) {
                        sprint.tickets.push(ticket);
                    })
                });
            });
            socket.on('change-min-ticket', function (data) {
                getSprint(data.sprint_id, getTickets);
                refreshSidenav(data.ticket_id);
            });
            socket.on('delete-ticket', function (data) {
                removeFromSprint(data.sprint_id, data.ticket_id);
                if (vm.selected_ticket && data.ticket_id == vm.selected_ticket.id) {
                    scrumboardSidenav.closeSidenav();
                }
            });
            socket.on('change-ticket', function (data) {
                refreshTicket(data.sprint_old, data.sprint_new, data.ticket_id);
                refreshSidenav(data.ticket_id);
            });
            socket.on('change-priority-ticket', function (data) {
                if (data.sprint_old != data.sprint_new) {
                    removeFromSprint(data.sprint_old, data.ticket_id);
                }
                getSprint(data.sprint_new, getTickets);

                refreshSidenav(data.ticket_id);
            });
            socket.on('comment-ticket', function (data) {
                refreshSidenav(data.ticket_id);
            });
        }


    }
})();
