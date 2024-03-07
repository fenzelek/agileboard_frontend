(function () {
    'use strict';

    angular
        .module('app.scrumboard-ticket')
        .controller('ScrumboardTicketController', ScrumboardTicketController);

    /** @ngInject */
    function ScrumboardTicketController(api, socket, $auth, $stateParams, msUtils, $rootScope, $window,
        projectsService, projectFiltersService, clipboardService, transService, dialogService,
        scrumboardSidenav, StatusesData, TicketData, textareaSanitizerService) {

        var vm = this;
        transService.loadFile('main/agile/scrumboard-ticket');

        projectsService.setCurrent($stateParams.project_id);
        vm.statuses = StatusesData.data;
        vm.ticket = TicketData.data;
        vm.ticket.trustedDescription = textareaSanitizerService.sanitizeHTML(vm.ticket.description);
        vm.source_statuses = {};
        vm.bug_id = 0;
        vm.search = '';
        vm.compact_view = false;
        vm.selected_ticket_id = 0;
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

                api.ticket.changePriority.put(form, function () {
                    refresh();
                }, function () {
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
        vm.searchFilter = searchFilter;
        vm.toggleCompactView = toggleCompactView;
        vm.copyToClipboard = clipboardService.copyText;
        vm.getStatusTicketsNumber = getStatusTicketsNumber;
        vm.getSubtasksProgress = getSubtasksProgress;
        vm.goBack = goBack;

        init();
        function init() {
            setTicketsToStatuses();

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

            // get filters info from localStorage
            var ticket_filters = projectFiltersService.getTicketFilters('agile', $stateParams.project_id);
            // set compact / standard view
            if(typeof ticket_filters != 'undefined') {
                if(ticket_filters.compact_view) {
                    vm.compact_view = true;
                }
            }
            websocketEvents();

            $auth.getUser(function(user) {
                vm.userId = user.id;
            });

        }

        function refresh() {
            var params = {
                project_id: $stateParams.project_id,
                id: $stateParams.ticket_title
            };
            api.ticket.ticket.get(params, function (response) {
                vm.ticket = response.data;
                setTicketsToStatuses();
            });
        }

        function setTicketsToStatuses() {
            vm.statuses.forEach(function (status) {
                status.tickets = { data: [] };
                // assign main ticket
                if (status.id === vm.ticket.status_id) {
                    status.tickets.data.push(vm.ticket);
                }
                // assign childs
                vm.ticket.sub_tickets.data.forEach(function (ticket) {
                    if (status.id === ticket.status_id) {
                        status.tickets.data.push(ticket);
                    }
                });
            });

        }

        function toggleCompactView() {
            vm.compact_view = !vm.compact_view;
            // save option in localStorage
            projectFiltersService.addTicketFilter(vm.compact_view, 'agile_compact_view', $stateParams.project_id);
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

        function addEditTicket(id) {
            dialogService.customDialog(null, 'AddEditTicketDialogController', 'app/main/agile/add-edit-ticket/add-edit-ticket.html', {id:id, project_id:$stateParams.project_id, sprint_id:null, scheduled_time_start: null}, function (success) {
                if (typeof success == 'object') {
                    refresh();
                    vm.msg_success = transService.translate('BOARD.ADDED_TICKET') + '&nbsp; <a ng-click="vm.addEditTicket('+success.id+')">' + success.title + ' <md-icon md-font-icon="icon-pencil" class="s16 green-100-fg" style="line-height: 19px !important;"></md-icon></a>';
                    vm.msg_error = '';
                }
            }, undefined, undefined, false);
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

        function goBack() {
            $window.history.back();
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

    }
})();
