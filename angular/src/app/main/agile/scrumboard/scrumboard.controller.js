(function ()
{
    'use strict';

    angular
        .module('app.scrumboard')
        .controller('ScrumboardController', ScrumboardController);

    /** @ngInject */
    function ScrumboardController($rootScope, $scope, $element, api, $auth, $location, msUtils, $stateParams, $mdSelect,
        projectsService, projectFiltersService, clipboardService, toastService, transService,
        TicketTypesData, SprintsData, StoriesData, StatusesData, UsersData, dialogService, $timeout, scrumboardSidenav, socket)
    {
        var vm = this;
        transService.loadFile('main/agile/scrumboard');

        projectsService.setCurrent($stateParams.project_id);
        vm.sprints = [];
        vm.stories = StoriesData.data;
        vm.statuses = StatusesData.data;
        vm.users = UsersData.data;
        vm.source_statuses = {};
        vm.bug_id = 0;
        vm.backlog = 0;
        vm.selected_sprints = [];
        vm.selected_stories = [];
        vm.selected_users = [];
        vm.selected_ticket_id = 0;
        vm.search = '';
        vm.sprintSearch = '';
        vm.userSearch = '';
        vm.storySearch = '';
        vm.compact_view = false;
        vm.userId = null;

        vm.sortableCardOptions = {
            appendTo            : '#scrumboard',
            connectWith         : '.list-cards',
            delay               : 75,
            distance            : 7,
            forceHelperSize     : true,
            forcePlaceholderSize: true,
            handle              : msUtils.isMobile() ? '.list-card-sort-handle' : false,
            helper              : function (event, el)
            {
                return el.clone().addClass('list-card-sort-helper');
            },
            placeholder         : 'list-card card-sortable-placeholder',
            tolerance           : 'pointer',
            scroll              : true,
            out                : function (event, ui)
            {
                $($(event.target).parent()[0]).removeClass('selected-list');
            },
            over                : function (event, ui)
            {
                $($(event.target).parent()[0]).addClass('selected-list');
            },
            sort                : function (event, ui)
            {
                var boardContentEl = ui.placeholder.closest('#board');

                if ( boardContentEl )
                {
                    var boardContentElHeight = boardContentEl[0].clientHeight,
                        boardContentElScrollHeight = boardContentEl[0].scrollHeight;

                    if ( boardContentElHeight !== boardContentElScrollHeight )
                    {
                        var itemTop = ui.position.top,
                            itemBottom = itemTop + ui.item.height(),
                            boardTop = boardContentEl.offset().top,
                            boardBottom = boardTop + boardContentElHeight;

                        if ( itemTop < boardTop + 25 )
                        {
                            boardContentEl.scrollTop(boardContentEl.scrollTop() - 25);
                        }

                        if ( itemBottom > boardBottom - 25 )
                        {
                            boardContentEl.scrollTop(boardContentEl.scrollTop() + 25);
                        }
                    }

                    resize();

                    var boardContentElWidth = boardContentEl[0].clientWidth;
                    var boardContentElScrollWidth = boardContentEl[0].scrollWidth;

                    if ( boardContentElWidth !== boardContentElScrollWidth )
                    {
                        var itemLeft = ui.position.left,
                            itemRight = itemLeft + ui.item.width(),
                            boardLeft = boardContentEl.offset().left,
                            boardRight = boardLeft + boardContentElWidth;

                        if ( itemLeft < boardLeft + 25 )
                        {
                            boardContentEl.scrollLeft(boardContentEl.scrollLeft() - 25);
                        }

                        if ( itemRight > boardRight)
                        {
                            boardContentEl.scrollLeft(boardContentEl.scrollLeft() + 25);
                        }
                    }
                }
            },
            start : function (event, ui)
            {
                vm.source_statuses = angular.copy(vm.statuses);
            },
            stop : function (event, ui)
            {
                var before_ticket_id = null;
                var status_id = 0;
                var ticket_id = ui.item[0].attributes['ticket-id'].value;
                var status_old_id = event.target.attributes['status-key'].value;

                var status_tickets = vm.statuses[status_old_id].tickets.data;
                if (vm.source_statuses[status_old_id].tickets.data.length == status_tickets.length) {
                    status_id = vm.statuses[status_old_id].id;
                    //in sprint
                    for(var i in status_tickets) {
                        if (status_tickets[i].id == ticket_id) {
                            break;
                        } else {
                            before_ticket_id = status_tickets[i].id;
                        }
                    }
                } else {
                    for(var j in vm.statuses) {
                        if (vm.statuses[j].tickets.data.length > vm.source_statuses[j].tickets.data.length) {
                            status_id = vm.statuses[j].id;

                            for(var i in vm.statuses[j].tickets.data) {
                                if (vm.statuses[j].tickets.data[i].id == ticket_id) {
                                    break;
                                } else {
                                    before_ticket_id = vm.statuses[j].tickets.data[i].id;
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
                    status_id: status_id
                };

                api.ticket.changePriority.put(form, function () {}, function () {
                    vm.statuses = vm.source_statuses;
                });
            }
        };

        // Methods
        vm.formatEstimate = projectsService.formatEstimate;
        vm.getTicketTimeClass = projectsService.getTicketTimeClass;
        vm.hasPermission = projectsService.hasPermission;
        vm.addEditTicket = addEditTicket;
        vm.getAvatar = $auth.getAvatar;
        vm.userFilter = userFilter;
        vm.searchFilter = searchFilter;
        vm.resize = resize;
        vm.toggleCompactView = toggleCompactView;
        vm.moveAllTicketsToStatus = moveAllTicketsToStatus;
        vm.copyToClipboard = clipboardService.copyText;
        vm.selectSprint = selectSprint;
        vm.selectSprintAll = selectSprintAll;
        vm.selectSprintLabel = selectSprintLabel;
        vm.selectStory = selectStory;
        vm.selectStoryAll = selectStoryAll;
        vm.selectStoryLabel = selectStoryLabel;
        vm.selectUser = selectUser;
        vm.selectUserAll = selectUserAll;
        vm.selectUserNotAssigned = selectUserNotAssigned;
        vm.selectUserLabel = selectUserLabel;
        vm.resetfilters = resetfilters;
        vm.getStatusTicketsNumber = getStatusTicketsNumber;
        vm.openCalendar = openCalendar;
        vm.getSubtasksProgress = getSubtasksProgress;

        init();
        // The md-select directive eats keydown events for some quick select
        // logic. Since we have a search input here, we don't need that logic.
        $element.find('input.select-search').on('keydown', function(ev) {
            ev.stopPropagation();
        });

        //////////
        function init() {
            // Add only active sprints
            if (SprintsData.data.length) {
                angular.forEach(SprintsData.data, function(sprint) {
                    if (sprint.status == 'active') {
                        vm.sprints.push(sprint);
                    }
                });
                // redirect into backlog if sprints definied but no active
                if (vm.sprints.length == 0) {
                    $timeout(function () {
                        toastService.showError(transService.translate('BOARD.NO_ACTIVE_SPRINT'), 500);
                        $location.path('/projects/' + $stateParams.project_id + '/backlog');
                    }, 1600);
                }
            } else {
                vm.backlog = 1;
            }


            // init sidebar, refresh agileboard after sidebar changing actions
            scrumboardSidenav.setStructure(vm, function (action, data) {
                if (action == 'delete') {
                    removeTicket(vm.selected_ticket.sprint_id, vm.selected_ticket.id);
                }
                if (action == 'update') {
                    var oldSprint = vm.selected_ticket.sprint.data ? vm.selected_ticket.sprint.data.id : vm.selected_ticket.sprint_id;
                    changeTicket(oldSprint, data.sprint_id, data.id);
                } else {
                    refresh();
                }
            });

            angular.forEach(TicketTypesData.data, function (type) {
                if (type.name == "Bug") {
                    vm.bug_id = type.id;
                }
            });

            // get filters info from localStorage
            var ticket_filters = projectFiltersService.getTicketFilters('agile', $stateParams.project_id);

            // set compact / standard view
            if(typeof ticket_filters != 'undefined') {
                if(ticket_filters.compact_view) {
                    vm.compact_view = true;
                }
            }
            // sprint ls
            if(typeof ticket_filters != 'undefined') {
                if(ticket_filters.sprint) {
                    var sprint_present = false;
                    angular.forEach(vm.sprints, function(sprint) {
                        if (angular.isArray(ticket_filters.sprint) &&
                            ticket_filters.sprint.indexOf(sprint.id) !== -1) {
                            vm.selected_sprints.push(sprint.id);
                            sprint_present = true;
                        }
                    });
                    if (!sprint_present) {
                        projectFiltersService.removeTicketFilter('agile_sprint', $stateParams.project_id);
                    }
                }
            }
            // stories ls
            if(typeof ticket_filters != 'undefined') {
                if(ticket_filters.story) {
                    var story_present = false;
                    angular.forEach(vm.stories, function(story) {
                        if (angular.isArray(ticket_filters.story) &&
                            ticket_filters.story.indexOf(story.id) !== -1) {
                            vm.selected_stories.push(story.id);
                            story_present = true;
                        }
                    });
                    if (!story_present) {
                        projectFiltersService.removeTicketFilter('agile_story', $stateParams.project_id);
                    }
                }
            }
            // users ls
            if(typeof ticket_filters != 'undefined') {
                if(ticket_filters.user) {
                    var user_present = false;
                    angular.forEach(vm.users, function(user) {
                        if (angular.isArray(ticket_filters.user) &&
                            ticket_filters.user.indexOf(user.user_id) !== -1) {
                            vm.selected_users.push(user.user_id);
                            user_present = true;
                        }
                    });
                    if (!user_present) {
                        projectFiltersService.removeTicketFilter('agile_user', $stateParams.project_id);
                    }
                }
            }

            $timeout(resize, 1000);
            websocketEvents();

            $auth.getUser(function(user) {
                vm.userId = user.id;
            });
        }

        function refresh() {
            var params = {
                project_id: $stateParams.project_id,
                tickets: 1,
                backlog: vm.backlog
            };

            if (vm.selected_sprints.length) {
                params['sprint_ids[]'] = vm.selected_sprints;
            }
            if (vm.selected_stories.length) {
                params['story_ids[]'] = vm.selected_stories;
            }

            api.agileStatuses.get(params, function (response) {
                vm.statuses = response.data;
                $timeout(resize, 200);
            });
        }

        // Temporary disabled for testing porposes - css flex styles do this job
        function resize() {
            // $(".list-cards").css('height', '');
            // var maxHeight = Math.max.apply(null, $(".list-cards").map(function ()
            // {
            //     return $(this).outerHeight();
            // }).get());

            // $(".list-cards").height(maxHeight + 16);
        }

        function toggleCompactView() {
            vm.compact_view = !vm.compact_view;
            $timeout(resize, 200);
            // save option in localStorage
            projectFiltersService.addTicketFilter(vm.compact_view, 'agile_compact_view', $stateParams.project_id);
        }


        function loadTickets() {
            var form = {
                project_id: $stateParams.project_id,
                tickets: 1,
                backlog: vm.backlog
            };

            if (vm.selected_sprints.length) {
                form['sprint_ids[]'] = vm.selected_sprints;
            }
            if (vm.selected_stories.length) {
                form['story_ids[]'] = vm.selected_stories;
            }

            api.agileStatuses.get(form, function (response) {
                vm.statuses = response.data;
                $timeout(resize, 200);
            }, function () {
                vm.selectSprintAll();
                vm.selectStoryAll();
            });
        }

        /**
         * Array prototype
         *
         * Get by id
         *
         * @param value
         * @returns {T}
         */
        Array.prototype.getById = function (value)
        {
            return this.filter(function (x)
            {
                return x.id === value;
            })[0];
        }

        function addEditTicket(id) {
            var sprint_id = getActiveSprintId();
            dialogService.customDialog(null, 'AddEditTicketDialogController', 'app/main/agile/add-edit-ticket/add-edit-ticket.html', {id:id, project_id:$stateParams.project_id, sprint_id:sprint_id, scheduled_time_start: null}, function (success) {
                if (typeof success == 'object') {
                    loadTickets();
                    vm.msg_success = transService.translate('BOARD.ADDED_TICKET') + '&nbsp; <a ng-click="vm.addEditTicket('+success.id+')">' + success.title + ' <md-icon md-font-icon="icon-pencil" class="s16 green-100-fg" style="line-height: 19px !important;"></md-icon></a>';
                    vm.msg_error = '';
                }
            }, undefined, undefined, false);
        }

        // Select first of not blocked sprints
        // or fist from not blocked filtered sprints if selected
        function getActiveSprintId() {
            var id = 0; // backlog as default
            angular.forEach(vm.sprints, function (sprint) {
                if (!id && !sprint.locked && (!vm.selected_sprints.length ||
                    (vm.selected_sprints.length && vm.selected_sprints.indexOf(sprint.id) !== -1)
                )) {
                    id = sprint.id
                }
            });
            return id;
        }

        function getStatusTicketsNumber(status) {
            var result = 0;
            angular.forEach(status.tickets.data, function (ticket) {
                if (vm.searchFilter(ticket) && vm.userFilter(ticket)) {
                    result++;
                }
            });
            return result;
        }

        function resetfilters() {
            vm.selected_sprints = [];
            projectFiltersService.addTicketFilter(vm.selected_sprints, 'agile_sprint', $stateParams.project_id);
            vm.selected_stories = [];
            projectFiltersService.addTicketFilter(vm.selected_stories, 'agile_story', $stateParams.project_id);
            vm.selected_users = [];
            projectFiltersService.addTicketFilter(vm.selected_users, 'agile_user', $stateParams.project_id);
            loadTickets();
        }

        function selectSprint(id) {
            if (id) {
                vm.selected_sprints = [id];
            }
            loadTickets();
            vm.sprintSearch = ''
            projectFiltersService.addTicketFilter(vm.selected_sprints, 'agile_sprint', $stateParams.project_id);
        }
        function selectSprintAll() {
            $mdSelect.hide();
            vm.selected_sprints = [];
        }
        function selectSprintLabel() {
            var label = transService.translate('OTHER.SPRINTS');
            if (vm.selected_sprints.length) {
                label += ' (' + vm.selected_sprints.length + ')';
            }
            return label;
        }

        function selectStory(id) {
            if (id) {
                vm.selected_stories = [id];
            }
            loadTickets();
            vm.storySearch = '';
            projectFiltersService.addTicketFilter(vm.selected_stories, 'agile_story', $stateParams.project_id);
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

        function selectUser(id) {
            if (id) {
                vm.selected_users = [id];
            }
            vm.userSearch = '';
            projectFiltersService.addTicketFilter(vm.selected_users, 'agile_user', $stateParams.project_id);
            $timeout(resize, 200);
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

        function sprintInBoard(sprint_id){
            var found = false;
            for(var i in vm.sprints) {
                if (vm.sprints[i].id == sprint_id) {
                    found = true;
                    break;
                }
            }
            return found;
        }

        function removeTicket(sprint_id, ticket_id) {
            if (sprintInBoard(sprint_id)) {
                for (var i in vm.statuses) {
                    if (angular.isDefined(vm.statuses[i].tickets)) {
                        for (var j in vm.statuses[i].tickets.data) {
                            if (vm.statuses[i].tickets.data[j].id == ticket_id) {
                                vm.statuses[i].tickets.data.splice(j, 1);
                            }
                        }
                    }
                }

                if (vm.selected_ticket && ticket_id == vm.selected_ticket.id) {
                    scrumboardSidenav.closeSidenav();
                }
                $timeout(resize, 200);
            }
        }

        function changeTicket(sprint_old, sprint_new, ticket_id) {
            if (sprintInBoard(sprint_new)) {
                refresh();
                if (vm.selected_ticket && ticket_id == vm.selected_ticket.id) {
                    scrumboardSidenav.refreshTicket();
                }
            }

            if (sprint_new != sprint_old) {
                removeTicket(sprint_old, ticket_id);
            }
        }

        function moveAllTicketsToStatus(tickets, status_id) {
            var promises = [];
            angular.forEach(tickets, function (ticket) {
                var promise = api.ticket.changePriority.put({
                    project_id: $stateParams.project_id,
                    id: ticket.id,
                    before_ticket_id: null,
                    status_id: status_id
                }).$promise;
                promises.push(promise);
            });
            Promise.all(promises).then(function () {
                $timeout(function () {
                    loadTickets();
                });
            });
        }

        function getSubtasksProgress(tickets) {
            if (!tickets || !tickets.length) {
                return 1;
            }
            var doneStatusId = vm.statuses[vm.statuses.length - 1].id;
            var doneTickets = 0;
            angular.forEach(tickets, function (ticket) {
                if (ticket.status_id === doneStatusId) {
                    doneTickets++;
                }
            });
            return Math.round(doneTickets/tickets.length * 100);
        }

        function websocketEvents() {
            socket.on('change-statuses', refresh);
            socket.on('store-ticket', refreshIfIsSprint);
            socket.on('change-min-ticket', refreshIfIsSprint);
            socket.on('delete-ticket',function (data) {
                removeTicket(data.sprint_id, data.ticket_id);
            });
            socket.on('comment-ticket',refreshIfIsSprint);

            socket.on('change-ticket', function (data) {
                changeTicket(data.sprint_old, data.sprint_new, data.ticket_id);
            });

            socket.on('change-priority-ticket', function (data) {
                changeTicket(data.sprint_old, data.sprint_new, data.ticket_id);
            });

            function refreshIfIsSprint(data) {
                if (sprintInBoard(data.sprint_id)) {
                    refresh();
                    if (vm.selected_ticket && data.ticket_id == vm.selected_ticket.id) {
                        scrumboardSidenav.refreshTicket();
                    }
                }
            }
        }

        function openCalendar() {
            if (!$stateParams.project_id) {
                console.log('Unable to get project id');
            } else {
                $location.path('projects/' + $stateParams.project_id + '/calendar');
            }
        }
    }
})();
