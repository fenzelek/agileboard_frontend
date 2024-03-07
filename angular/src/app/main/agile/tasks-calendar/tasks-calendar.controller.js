(function () {
    'use strict';

    angular
        .module('app.tasks-calendar')
        .controller('TasksCalendarController', TasksCalendarController);

    /** @ngInject */
    function TasksCalendarController($element, api, $auth, $location, $stateParams, $mdSelect,
        projectsService, projectFiltersService, clipboardService, toastService, transService,
        TicketTypesData, SprintsData, StoriesData, StatusesData, UsersData, $timeout, scrumboardSidenav, socket, $rootScope, dialogService, msUtils) {
        var vm = this;
        transService.loadFile('main/agile/tasks-calendar');


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
        vm.selected_statuses = [];
        vm.search = '';
        vm.sprintSearch = '';
        vm.userSearch = '';
        vm.storySearch = '';
        vm.statusSearch = '';
        vm.tasks_calendar = '';
        vm.calendar_opened = false;
        vm.sidenav_opened = false;
        vm.selected_date = '';
        vm.selected_view = '';



        // Methods
        vm.formatEstimate = projectsService.formatEstimate;
        vm.getTicketTimeClass = projectsService.getTicketTimeClass;
        vm.hasPermission = projectsService.hasPermission;
        vm.getAvatar = $auth.getAvatar;
        vm.userFilter = userFilter;
        vm.searchFilter = searchFilter;
        vm.toggleCalendar = toggleCalendar;
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
        vm.closeCalendar = closeCalendar;
        vm.nextCalendarPage = nextCalendarPage;
        vm.prevCalendarPage = prevCalendarPage;
        vm.changeCalendarView = changeCalendarView;
        vm.updateCaledarLabels = updateCalendarLabels;
        vm.switchToToday = switchToToday;
        vm.translateNames = translateNames;
        vm.renderCalendar = renderCalendar;
        vm.formatData = formatData;
        vm.addEditTicket = addEditTicket;
        vm.getActiveSprintId = getActiveSprintId;
        vm.getSelectedDate = getSelectedDate;
        vm.goToSelectedDate = goToSelectedDate;
        vm.getSelectedView = getSelectedView;
        vm.goToSelectedView = goToSelectedView;
        vm.selectStatus = selectStatus;
        vm.selectStatusLabel = selectStatusLabel;
        vm.selectStatusAll = selectStatusAll;

        init();
        // The md-select directive eats keydown events for some quick select
        // logic. Since we have a search input here, we don't need that logic.
        $element.find('input.select-search').on('keydown', function (ev) {
            ev.stopPropagation();
        });

        //////////
        function init() {
            // Add only active sprints
            if (SprintsData.data.length) {
                angular.forEach(SprintsData.data, function (sprint) {
                    vm.sprints.push(sprint);
                });
            } else {
                vm.backlog = 1;
            }

            angular.forEach(TicketTypesData.data, function (type) {
                if (type.name == "Bug") {
                    vm.bug_id = type.id;
                }
            });

            // get filters info from localStorage
            var ticket_filters = projectFiltersService.getTicketFilters('agile', $stateParams.project_id);

            // sprint ls
            if (typeof ticket_filters != 'undefined') {
                if (ticket_filters.sprint) {
                    var sprint_present = false;
                    angular.forEach(vm.sprints, function (sprint) {
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
            if (typeof ticket_filters != 'undefined') {
                if (ticket_filters.story) {
                    var story_present = false;
                    angular.forEach(vm.stories, function (story) {
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
            if (typeof ticket_filters != 'undefined') {
                if (ticket_filters.user) {
                    var user_present = false;
                    angular.forEach(vm.users, function (user) {
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

            // status ls
            if (typeof ticket_filters != 'undefined') {
                if (ticket_filters.status) {
                    var status_present = false;
                    angular.forEach(vm.statuses, function (status) {
                        if (angular.isArray(ticket_filters.status) &&
                            ticket_filters.status.indexOf(status.id) !== -1) {
                            vm.selected_statuses.push(status.id);
                            status_present = true;
                        }
                    });
                    if (!status_present) {
                        projectFiltersService.removeTicketFilter('agile_status', $stateParams.project_id);
                    }
                }
            }
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


            initCalendar();
            updateCalendarLabels();
            websocketEvents();
        }
        // var translateChangeSuccess = $rootScope.$on('$translateChangeSuccess', function (event, current, previous) {
        //     refreshCalendar();
        // });

        // $rootScope.$on('$destroy', function () {
        //     translateChangeSuccess();
        // });

        $rootScope.$on('language-changed', function () {
            refreshCalendar();
        });
        $rootScope.$on('data-updated', function() {
            refreshCalendar();
        });

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
            });
        }


        function toggleCalendar() {
            vm.calendar_opened = !vm.calendar_opened;
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
            }
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
            }, function () {
                vm.formatData();
                vm.selectSprintAll();
                vm.selectStoryAll();
            });
        }

        function formatData() {
            var allDay = false;
            var data = vm.statuses;
            var tickets = null;
            var ticket = null;
            var task_duration = null;
            var name_length = null;
            var formatted_tickets = [];
            var start_date = '';
            var end_date = '';
            var new_start_date = '';
            var new_end_date = '';
            var task_short_name = '';
            var start_day = '';
            var end_day = '';
            var status_name = '';
            var regexPattern = /( )/;
            for (var i = 0; i < data.length; i++) {
                tickets = data[i].tickets.data;
                status_name = data[i].name;

                for (var j = 0; j < tickets.length; j++) {
                    start_date = tickets[j].scheduled_time_start;
                    end_date = tickets[j].scheduled_time_end;
                    if (start_date && end_date) {
                        new_start_date = start_date.replace(regexPattern, 'T');
                        new_end_date = end_date.replace(regexPattern, 'T');
                    } else if (start_date && !end_date) {
                        new_start_date = start_date.replace(regexPattern, 'T');
                        new_end_date = null;
                    } else if (!start_date && end_date) {
                        new_start_date = end_date.replace(regexPattern, 'T');
                        new_end_date = null;
                    } else {
                        continue;
                    }

                    if (new_start_date && new_end_date) {
                        if (new_end_date.slice(11) == '00:00:00') {
                            var hour = '00:00:01';
                            var date = new_end_date.slice(0,11);
                            new_end_date = date + hour
                        }
                        start_day = parseInt(new_start_date.slice(8));
                        end_day = parseInt(new_end_date.slice(8));

                        task_duration = end_day - start_day;

                        if (task_duration < 0) {
                            task_duration *= -1;
                        }
                    } else if (!new_end_date) {
                        task_duration = 1;
                    }

                    name_length = tickets[j].name.length
                    if (name_length > 20) {
                        if (task_duration >= 2) {
                            if (name_length > 50) {
                                task_short_name = tickets[j].name.slice(0, 47) + '...';
                            } else {
                                task_short_name = null;
                            }
                        } else {
                            task_short_name = tickets[j].name.slice(0, 17) + '...';
                        }
                    } else {
                        task_short_name = null;
                    }


                    ticket = tickets[j];
                    Object.assign(ticket, {
                        start: new_start_date,
                        end: new_end_date,
                        original_start: start_date,
                        original_end: end_date,
                        allDay: allDay,
                        short_name: task_short_name,
                        status_name: status_name,
                    });

                    if (!new_end_date) {
                        ticket.allDay = true;
                    }
                    if (vm.tasks_calendar) {
                        if (vm.tasks_calendar.getView().name == "agendaWeek" && task_duration > 1) {
                            ticket.allDay = true;
                        }
                    }
                    formatted_tickets.push(ticket);
                }
            }
            return formatted_tickets;
        }

        /**
         * Array prototype
         *
         * Get by id
         *
         * @param value
         * @returns {T}
         */
        Array.prototype.getById = function (value) {
            return this.filter(function (x) {
                return x.id === value;
            })[0];
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
            vm.selected_statuses = [];
            projectFiltersService.addTicketFilter(vm.selected_statuses, 'agile_status', $stateParams.project_id);
            loadTickets();
            refreshCalendar();
        }

        function selectSprint(id) {
            if (id) {
                vm.selected_sprints = [id];
            }
            loadTickets();
            refreshCalendar();
            vm.sprintSearch = '';
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
            refreshCalendar();
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
            getSelectedDate();
            getSelectedView();
            $('#calendar').fullCalendar('destroy');
            $timeout(function () {
                if (!vm.selected_users || !vm.selected_users.length) {
                    refreshCalendar();
                } else {
                    refreshCalendar();
                    goToSelectedDate();
                    changeCalendarView(vm.selected_view)
                }

            }, 500);
        }

        function selectStatus(id) {
            if (id) {
                vm.selected_statuses = [id];
            }
            vm.statusSearch = '';
            projectFiltersService.addTicketFilter(vm.selected_statuses, 'agile_status', $stateParams.project_id);
            getSelectedDate();
            getSelectedView();
            $('#calendar').fullCalendar('destroy');
            $timeout(function () {
                if (!vm.selected_statuses || !vm.selected_statuses.length) {
                    refreshCalendar();
                } else {
                    refreshCalendar();
                    goToSelectedDate();
                    changeCalendarView(vm.selected_view)
                }

            }, 500);
        }

        function selectStatusLabel() {
            var label = transService.translate('OTHER.STATUSES');
            if (vm.selected_statuses.length) {
                label += ' (' + vm.selected_statuses.length + ')';
            }
            return label;
        }

        function selectStatusAll() {
            $mdSelect.hide();
            vm.selected_statuses = [];
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

        function sprintInBoard(sprint_id) {
            var found = false;
            for (var i in vm.sprints) {
                if (vm.sprints[i].id == sprint_id) {
                    found = true;
                    break;
                }
            }
            return found;
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

        function websocketEvents() {
            socket.on('change-statuses', refresh);
            socket.on('store-ticket', refreshIfIsSprint);
            socket.on('change-min-ticket', refreshIfIsSprint);
            socket.on('delete-ticket', function (data) {
                removeTicket(data.sprint_id, data.ticket_id);
            });
            socket.on('comment-ticket', refreshIfIsSprint);

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

        function closeCalendar() {
            if (!$stateParams.project_id) {
                console.log('Unable to get project id');
            } else {
                $location.path('/projects/' + $stateParams.project_id + '/agile');
            }
        }

        function renderCalendar(eventRender) {
            if (!eventRender) {
                eventRender = formatData();
            }
            //var events = 'https://fullcalendar.io/demo-events.json';
            $('#calendar').fullCalendar({
                header: {
                    left: '',
                    center: '',
                    right: ''
                },
                firstDay: '1',
                axisFormat: 'H:mm',
                allDayText: transService.translate('OTHER.ALL_DAY'),
                height: msUtils.isMobile() ? 'undefined' : 'auto',
                monthNames: translateNames("MONTHS.", 12),
                monthNamesShort: translateNames("MONTHS_SHORT.", 12),
                dayNames: translateNames("WEEK_DAYS.", 7),
                dayNamesShort: translateNames("WEEK_DAYS_SHORT.", 7),
                events: eventRender,
                nextDayThreshold: "00:00:01",
                eventRender: function (event, element, view) {
                    if (event.assigned_user.data) {
                        return getEventTemplate(event.title, event.name, event.assigned_user.data.avatar, event.short_name, event.id, event.status_name, event.start, event.end, event.files_count, event.comments_count, event.type_id, event.sprint_id);
                    } else {
                        return getEventTemplate(event.title, event.name, null, event.short_name, event.id, event.status_name, event.start, event.end, event.files_count, event.comments_count, event.type_id, event.sprint_id);
                    }

                },
                eventDurationEditable: false,
                editable: true,
                dayClick: function (date, jsEvent, view) {
                    addEditTicket(undefined, date.format());
                },
                eventClick: function (calEvent, jsEvent, view) {
                    vm.openSidenav(calEvent.id);
                },
                eventDrop: function (event, delta, revertFunc) {
                    updateTask(event);
                },
                eventTextColor: '#fff'
            });

            vm.tasks_calendar = $('#calendar').fullCalendar('getCalendar');
        }

        function getEventTemplate(event_title, event_name, user_avatar, event_short_name, event_id, event_status, event_start, event_end, event_files, event_comments, type_id, event_sprint_id) {
            var currentDate = moment().format().slice(0, 10);
            var token = localStorage.getItem('token');
            var title_color = 'event-title-blue';
            var apiUrl = window.__env.apiUrl;
            var avatar_href =  apiUrl + "/users/avatar/" + user_avatar + "?token=" + token;

            if (user_avatar == "") {
                avatar_href = "assets/images/avatars/profile.jpg";
            }
            var avatar_template = '<div class="list-card-member layout-align-end-center"><img src="' + avatar_href + '" ng-src="' + avatar_href + '" class="list-card-member-avatar"></div>';


            if (event_end) {
                event_end = event_end.format().slice(0,10);
                if (currentDate > event_end) {
                    title_color = 'event-title-red';
                } else if (currentDate == event_end) {
                    title_color = 'event-title-orange';
                } else {
                    title_color = 'event-title-green';
                }
            } else {
                event_start = event_start.format().slice(0,10);
                if (currentDate > event_start) {
                    title_color = 'event-title-red';
                } else if (currentDate == event_start) {
                    title_color = 'event-title-orange';
                } else {
                    title_color = 'event-title-green';
                }
            }

            // Get sprint data
            var event_sprint_name = '';
            var event_sprint_color = '';
            vm.sprints.forEach(function (sprint) {
                if (sprint.id === event_sprint_id) {
                    event_sprint_name = sprint.name;
                    switch (sprint.status) {
                        case 'active':
                            event_sprint_color = 'green-600-fg';
                            break;
                        case 'paused':
                            event_sprint_color = 'amber-700-fg';
                            break;
                        case 'inactive':
                            event_sprint_color = 'grey-400-fg';
                            break;
                    }
                }
            });


            var title_template = '<div class="list-card-code layout-align-start-center layout-row"><p class="layout-align-start-center event-title ' + title_color + '" ng-click="vm.openSidenav(' + event_id + ')">' + event_title + '</p>';

            var header_template = '<div class="list-card-header">' + title_template + avatar_template + '</div>';
            var name_template = '<p class="event-name">' + event_name + '</p>';
            var sprint_template = event_sprint_id ? '<p class="event-sprint"> <i class="icon-checkbox-blank-circle s10 ' + event_sprint_color + '"></i> ' + event_sprint_name + '</p>' : '';
            var status_template = '<p class="event-status">' + event_status + '</p>';
            var footer_attachment = '<span class="list-card-footer-item layout-align-start-center layout-row"> <i class="icon-attachment s14"></i><span class="value ng-binding">&nbsp;' + event_files + '</span></span>';
            var footer_comments = '<span class="list-card-footer-item layout-align-start-center layout-row"><i class="icon-comment s14"></i><span class="value ng-binding">&nbsp;' + event_comments + '</span></span>';
            var footer_bug = '<span class="list-card-footer-item ng-scope layout-align-start-center layout-row"><i class="icon-alert-circle s18 red-900-fg"></i></span>'
            if (type_id == 2) {
                footer_bug = '';
            }
            var footer_elements = '<div class="layout-align-start-center layout-row flex">' + status_template + footer_bug + footer_attachment + footer_comments + '</div>'
            var footer_template = '<div class="list-card-footer layout-align-space-between-center layout-row">' + footer_elements + '</div>'
            if (event_short_name) {
                name_template = '<p class="event-name">' + event_short_name + '</p>';
            }
            if (user_avatar != undefined) {
                return $('<div class="calendar-event list-card md-whiteframe-2dp">' + header_template + name_template + sprint_template + footer_template + '</div>');
            } else {
                return $('<div class="calendar-event list-card md-whiteframe-2dp"><div><p class="layout-align-start-center event-title event-title-padding ' + title_color + '">' + event_title + '</p></div>' + name_template + sprint_template + footer_template + '</div>');
            }
        }

        function nextCalendarPage() {
            vm.tasks_calendar.next();
            updateCalendarLabels();
            vm.tasks_calendar.option("height", "auto")
        }

        function prevCalendarPage() {
            vm.tasks_calendar.prev();
            updateCalendarLabels();
        }

        function changeCalendarView(view) {
            vm.tasks_calendar.changeView(view);
            updateCalendarLabels(view);
        }

        function switchToToday() {
            vm.tasks_calendar.today();
            updateCalendarLabels(vm.tasks_calendar.getView().name);
        }

        function refreshCalendar() {
            getSelectedDate();
            getSelectedView();
            $('#calendar').fullCalendar('destroy');
            $timeout(function () {
                if(vm.selected_users.length && vm.selected_statuses.length) {
                    renderCalendar(getTasksByUserAndStatus(vm.selected_users, vm.selected_statuses))
                } else if (vm.selected_users.length && !vm.selected_statuses.length) {
                    renderCalendar(getTasksByAssignedUser(vm.selected_users));
                } else if (!vm.selected_users.length && vm.selected_statuses.length) {
                    renderCalendar(getTasksByStatus(vm.selected_statuses))
                } else {
                    renderCalendar();
                }
                goToSelectedDate();
                changeCalendarView(vm.selected_view);
            }, 500);
            $timeout(updateCalendarLabels, 500);
        }

        function getSelectedDate() {
            vm.selected_date = vm.tasks_calendar.getDate()
        }

        function goToSelectedDate() {
            vm.tasks_calendar.gotoDate(vm.selected_date)
            updateCalendarLabels();
        }

        function goToSelectedView() {
            changeCalendarView(vm.selected_view);
        }

        function getSelectedView() {
            vm.selected_view = vm.tasks_calendar.getView().name;
        }

        function addEditTicket(id, start_time) {
            var sprint_id = getActiveSprintId();
            dialogService.customDialog(null, 'AddEditTicketDialogController', 'app/main/agile/add-edit-ticket/add-edit-ticket.html', {
                id: id,
                project_id: $stateParams.project_id,
                sprint_id: sprint_id,
                scheduled_time_start: start_time
            }, function (success) {
                if (typeof success == 'object') {
                    loadTickets();
                    vm.msg_success = transService.translate('BOARD.ADDED_TICKET') + '&nbsp; <a ng-click="vm.addEditTicket(' + success.id + ')">' + success.title + ' <md-icon md-font-icon="icon-pencil" class="s16 green-100-fg" style="line-height: 19px !important;"></md-icon></a>';
                    vm.msg_error = '';
                    refreshCalendar();
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
                    id = sprint.id;
                }
            });
            return id;
        }

        function getStoriesId(stories) {
            var stories_id = [];
            angular.forEach(stories.data, function (story) {
                stories_id.push(story.id)
            });
            return stories_id;
        }

        function updateCalendarLabels(view) {
            if (view) {
                $('.button-wrapper').css('background', 'transparent');
                if (view == "basicDay") {
                    $('.today').text(transService.translate('TASKS-CALENDAR.TODAY'));
                    $('.days').css('background', 'rgba(0,0,0,0.12)');
                } else if (view == "agendaWeek") {
                    $('.weeks').css('background', 'rgba(0,0,0,0.12)');
                    $('.today').text(transService.translate('TASKS-CALENDAR.CURRENT_WEEK'));
                } else if (view == "month") {
                    $('.months').css('background', 'rgba(0,0,0,0.12)');
                    $('.today').text(transService.translate('TASKS-CALENDAR.CURRENT_MONTH'));
                }
            }
            $('.calendar-title').text(vm.tasks_calendar.view.title);
        }

        function updateTask(event) {
            delete event.source; // caused parsing JSON object error

            var regexPattern = /(T)/;
            if (event.end) {
                var end = event.end.format().replace(regexPattern, " ")
            } else {
                event.end = null;
            }
            if (event.start) {
                var start = event.start.format().replace(regexPattern, " ")
                if (start.length == 10) start += ' 00:00:01';
            } else {
                event.start = null
            }

            var form = event;
            Object.assign(form, {
                scheduled_time_end: end,
                scheduled_time_start: start,
                story_id: getStoriesId(event.stories)
            });

            form.parent_ticket_ids = [];
            angular.forEach(event.parent_tickets.data, function (ticket) {
                form.parent_ticket_ids.push(ticket.id);
            });
            form.sub_ticket_ids = [];
            angular.forEach(form.sub_tickets.data, function (ticket) {
                form.sub_ticket_ids.push(ticket.id);
            });

            if (end == null) {
                form.scheduled_time_end = null;
            }
            if (start == null) {
                form.scheduled_time_end = null;
            }

            if (end == null && start == null) {
                return;
            }
            if (event.original_start == null && event.start && !event.end) {
                form.scheduled_time_end = start
                form.scheduled_time_start = null;
            }

            api.ticket.ticket.put(form, function () {
                if (vm.selected_ticket && form.id === vm.selected_ticket.id) {
                    scrumboardSidenav.refreshTicket();
                }
            });
        }

        function translateNames(date_name, length) {
            var translated_names = [];
            for (var i = 1; i < (length + 1); i++) {
                translated_names.push(transService.translate(date_name + i));
            }
            return translated_names;
        }


        function getTasksByAssignedUser(id_to_find) {
            var tasks = formatData();
            var tickets = [];
            angular.forEach(tasks, function (ticket) {
                if (ticket.assigned_user.data) {
                    for (var i = 0; i < id_to_find.length; i++) {
                        if (ticket.assigned_user.data.id == id_to_find[i]) {
                            tickets.push(ticket);
                        }
                    }
                }
            });
            return tickets;
        }

        function getTasksByStatus(status_id) {
            var tasks = formatData();
            var tickets = [];
            angular.forEach(tasks, function(ticket) {
                for (var i = 0; i < status_id.length; i++) {
                    if (ticket.status_id == status_id[i]) {
                        tickets.push(ticket)
                    }
                }
            });
            return tickets
        }

        function getTasksByUserAndStatus(user_id, status_id) {
            var tasks = formatData();
            var tickets = [];
            angular.forEach(tasks, function(ticket) {
                if (ticket.assigned_user.data) {
                    for (var i = 0; i < status_id.length; i++) {
                        if (ticket.status_id == status_id[i] && ticket.assigned_user.data.id == user_id[i]) {
                            tickets.push(ticket)
                        }
                    }
                }

            });
            return tickets
        }

        function initCalendar() {
            if(vm.selected_users.length && vm.selected_statuses.length) {
                renderCalendar(getTasksByUserAndStatus(vm.selected_users, vm.selected_statuses))
            } else if (vm.selected_users.length && !vm.selected_statuses.length) {
                renderCalendar(getTasksByAssignedUser(vm.selected_users));
            } else if (!vm.selected_users.length && vm.selected_statuses.length) {
                renderCalendar(getTasksByStatus(vm.selected_statuses))
            } else {
                renderCalendar();
            }
        }
    }
})();
