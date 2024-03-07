(function () {
    'use strict';

    angular
        .module('app.core')
        .factory('scrumboardSidenav', scrumboardSidenavService);

    /** @ngInject */
    function scrumboardSidenavService(textareaSanitizerService, $mdSidenav, api, $auth, $rootScope, transService, $window, $location, $timeout, $mdMedia, projectsService, filesService, dialogService, clipboardService, apiResolver) {
        var vm = {};
        var selected_id = 0;
        var refresh = null;

        var service = {
            setStructure: setStructure,
            refreshTicket: refreshTicket,
            closeSidenav: closeSidenav
        };

        return service;

        function setStructure(t_vm, t_refresh) {
            vm = t_vm;
            refresh = t_refresh;
            vm.loading = false;
            vm.selected_ticket = null;
            vm.current_user = {};
            vm.my_logged_time = 0;
            vm.all_logged_time = 0;
            vm.openSidenav = openSidenav;
            vm.closeSidenav = closeSidenav;
            vm.openTicket = openTicket;
            vm.copyLink = copyLink;
            vm.copyTitleAndName = copyTitleAndName;
            vm.edit = edit;
            vm.remove = remove;
            vm.sendComment = sendComment;
            vm.download = download;
            vm.getUrlFile = getUrlFile;
            vm.imagePreview = imagePreview;
            vm.getImageThumbnail = filesService.getImageThumbnail;
            vm.update = update;
            vm.updateDescription = updateDescription;
            vm.getSize = filesService.getSize;
            vm.getIcon = filesService.getIcon;
            vm.searchUser = projectsService.searchUser;
            vm.searchStories = searchStories;
            vm.searchTickets = searchTickets;
            vm.loading = false;
            vm.files = [];
            vm.progress = 0;
            vm.editName = false;
            vm.setEditName = setEditName;
            vm.allSprints = [];
            vm.allStatuses = [];
            vm.getAllSprints = getAllSprints;
            vm.getAllStatuses = getAllStatuses;
            vm.subtasksProgress = 0;


            $auth.getUser(function (user) {
                vm.current_user = user;
            });

            transService.loadFile('main/agile/sidenav');


            filesService.dragAndDropFileInit(null, null, null, '#file-upload-area', '#file-upload-area', function (dropped_items) {
                if (dropped_items) vm.files = dropped_items;
                uploadFiles();
            });
        }

        function refreshTicket(open, with_refresh_action) {
            setEditName(false);
            vm.loading = true;
            api.ticket.ticket.get({
                project_id: $rootScope.current_project_id,
                id: selected_id
            }, function (response) {
                vm.loading = false;
                vm.selected_ticket = response.data;
                vm.selected_ticket.trustedDescription = textareaSanitizerService.sanitizeHTML(vm.selected_ticket.description);
                vm.selected_ticket.comments.data.forEach(comment => comment.trustedText = textareaSanitizerService.sanitizeHTML(comment.text));
                vm.my_logged_time = 0;
                vm.all_logged_time = 0;
                vm.subtasksProgress = getSubtasksProgress();
                
                if (vm.selected_ticket.time_tracking_summary) {
                    $auth.getUser(function (user) {
                        angular.forEach(vm.selected_ticket.time_tracking_summary.data, function (value) {
                            if (user.id == value.user_id) {
                                vm.my_logged_time += value.tracked_sum;
                            }
                            vm.all_logged_time += value.tracked_sum;
                        });
                    });
                }

                if ($location.path() == '/projects/' + $rootScope.current_project_id + '/agile') {
                    vm.displayStatusOption = false;
                } else {
                    vm.displayStatusOption = true;
                }
                if (open === true && !$mdMedia('gt-md')) {
                    $timeout(function () {
                        $mdSidenav('preview-sidenav').toggle();
                    });
                }
                // refresh board size
                if (angular.isDefined(vm.resize) && vm.search == '') {
                    $timeout(function () {
                        vm.resize();
                    });
                }

                refresh(with_refresh_action, response.data);

            }, function () {
                closeSidenav();
            });
        }



        // search stories by 'name'
        function searchStories(query) {
            return api.stories.get({
                project_id: $rootScope.current_project_id,
                limit: 15,
                name: query
            }).$promise.then(function (response) {
                if (!response.data || !response.data.length) {
                    return [{
                        name: transService.translate('SIDANAV_PREVIEW.CREATE_NEW') + query,
                        id: 0
                    }];
                }
                return response.data;
            });
        }

        // search tickets by 'number or title'
        function searchTickets(query) {
            return api.ticket.tickets.get({
                    project_id: $rootScope.current_project_id,
                    limit: 10,
                    search: query
                }
            ).$promise.then(function (response) {
                return response.data;
            });
        }

        // create story if not existing selected
        function createStories(stories, callback) {
            var existingStories = [];
            var promises = [];
            angular.forEach(stories, function (story) {
                if (story.id == 0) {
                    promises.push(api.stories.save({
                        name: story.name.replace(transService.translate('SIDANAV_PREVIEW.CREATE_NEW'), ''),
                        project_id: $rootScope.current_project_id
                    }).$promise);
                } else {
                    existingStories.push(story);
                }
            });
            Promise.all(promises).then(function (resources) {
                var newStories = [];
                angular.forEach(resources, function (res) {
                    if (res.data) {
                        newStories = newStories.concat(res.data);
                    }
                });
                stories = existingStories.concat(newStories);
                callback(stories);
            }).catch(function () {
                $timeout(function () {
                    callback(existingStories);
                });
            });
        }

        // get all sprints for inline-edit "Sprint" select
        // run callback when data ready
        function getAllSprints(callback) {
            api.sprint.sprints.get({
                project_id: $rootScope.current_project_id,
                status: 'not-closed'
            }, function (response) {
                vm.allSprints = [];
                angular.forEach(response.data, function (sprint) {
                    if (!sprint.locked) {
                        vm.allSprints.push(sprint);
                    }
                });
                // add backlog and select it if sprint is not set
                var backlog = {
                    id: 0,
                    project_id: $rootScope.current_project_id,
                    name: 'Backlog',
                    status: 'none'
                };
                vm.allSprints.unshift(backlog);
                if (!vm.selected_ticket.sprint.data) vm.selected_ticket.sprint.data = backlog;
                if (callback && typeof callback == 'function') {
                    callback();
                }
            });
        }

        function getAllStatuses(callback) {
            var params = {
                project_id: $rootScope.current_project_id
            }
            apiResolver.resolve('agileStatuses@get', params).then(function (response) {
                vm.allStatuses = [];
                angular.forEach(response.data, function (status) {
                    vm.allStatuses.push(status)
                });
                if (callback && typeof callback == 'function') {
                    callback();
                }
                vm.subtasksProgress = getSubtasksProgress();
            })

        }

        function getSubtasksProgress() {
            if (!vm.selected_ticket ||
                !vm.selected_ticket.sub_tickets.data ||
                !vm.selected_ticket.sub_tickets.data.length ||
                !vm.allStatuses.length
            ) {
                return 1;
            }
            var doneStatusId = vm.allStatuses[vm.allStatuses.length - 1].id;
            var doneTickets = 0;
            angular.forEach(vm.selected_ticket.sub_tickets.data, function (ticket) {
                if (ticket.status_id === doneStatusId) {
                    doneTickets++;
                }
            });
            return Math.round(doneTickets/vm.selected_ticket.sub_tickets.data.length * 100);
        }

        function update(param, new_value, successCallback, apiErrorCallback) {
            var ticket = angular.copy(vm.selected_ticket);
            switch (param) {
                case 'assigned_user':
                    if (new_value && new_value.id)
                        ticket.assigned_id = new_value.id;
                    else
                        ticket.assigned_id = null;
                    break;
                case 'estimate_time':
                    ticket.estimate_time = projectsService.estimationToSeconds(new_value);
                    break;
                case 'stories':
                    ticket.stories.data = new_value;
                    break;
                case 'description':
                    ticket.description = new_value;
                    break;
                case 'name':
                    ticket.name = new_value;
                    break;
                case 'scheduled_time_start':
                    if (new_value && new_value != '')
                        ticket.scheduled_time_start = moment(new_value).format('YYYY-MM-DD HH:mm:ss');
                    else
                        ticket.scheduled_time_start = null;
                    break;
                case 'scheduled_time_end':
                    if (new_value && new_value != '')
                        ticket.scheduled_time_end = moment(new_value).format('YYYY-MM-DD HH:mm:ss');
                    else
                        ticket.scheduled_time_end = null;
                    break;
                case 'sprint':
                    ticket.sprint_id = new_value;
                    break;
                case 'parent_tickets':
                    ticket.parent_ticket_ids = new_value.map(function (t) {
                        return t.id;
                    });
                    break;
                case 'sub_tickets':
                    ticket.sub_ticket_ids = new_value.map(function (t) {
                        return t.id;
                    });
                    break;
                case 'status':
                    api.ticket.changePriority.put({
                        project_id: ticket.project_id,
                        id: ticket.id,
                        status_id: new_value,
                        before_ticket_id: ticket.status_id == new_value ? ticket_id : null
                        },
                        function () {
                            refreshTicket();
                            $rootScope.$emit('data-updated');
                            if(typeof successCallback != 'undefined') successCallback();
                        },
                        function(response) {
                            if(typeof apiErrorCallback != 'undefined') apiErrorCallback(response.data);
                        }
                    );
                    return;
            }

            handleTicketPut(ticket, successCallback, apiErrorCallback);
        }

        function handleTicketPut(ticket, successCallback, apiErrorCallback) {
            // Create new stories if need to
            // before updating ticket
            createStories(ticket.stories.data, function (stories) {
                convertStoriesToIds(ticket, stories);
                // send request to API
                api.ticket.ticket.put(ticket,
                    // refresh data on success
                    function () {
                        vm.editName = false;
                        refreshTicket(false, 'update');
                        $rootScope.$emit('data-updated');
                        if (successCallback) {
                            successCallback();
                        }
                    },
                    function (response) {
                        if (apiErrorCallback) {
                            apiErrorCallback(response.data);
                        }
                    }
                );
            });
        }

        function convertStoriesToIds(ticket, stories) {
            ticket.story_id = [];

            if (!stories.length) return;

            angular.forEach(stories, function (story) {
                ticket.story_id.push(story.id);
            });
        } 

        function updateDescription(data, successCallback, apiErrorCallback) {
            var ticket = angular.copy(vm.selected_ticket);

            ticket.description = data.value;
            ticket.interactions = { data: data.mentions };

            handleTicketPut(ticket, successCallback, apiErrorCallback);
        }

        function setEditName(value) {
            vm.editName = value;
        }

        function openSidenav(id) {
            selected_id = id;

            refreshTicket(true);
            getAllStatuses();
        }

        function closeSidenav() {
            if (vm.selected_ticket) {
                if (!$mdMedia('gt-md')) {
                    $timeout(function () {
                        $mdSidenav('preview-sidenav').toggle();
                    })
                }
                vm.selected_ticket = null;
            }
        }

        function openTicket($event) {
            var ticket = '/projects/' + $rootScope.current_project_id + '/ticket/' + vm.selected_ticket.title;
            if ($event.ctrlKey || $event.metaKey || $event.which === 2) {
                $window.open(ticket, '_blank');
            } else {
                $location.path(ticket);
            }
        }

        function copyLink() {
            var link = location.host + '/projects/' + $rootScope.current_project_id + '/ticket/' + vm.selected_ticket.title;
            clipboardService.copyText(link);
        }

        function copyTitleAndName() {
            var titleAndName = vm.selected_ticket.title + ' ' + vm.selected_ticket.name;
            clipboardService.copyText(titleAndName);
        }

        function edit() {
            dialogService.customDialog(null, 'AddEditTicketDialogController', 'app/main/agile/add-edit-ticket/add-edit-ticket.html', {
                id: vm.selected_ticket.id,
                project_id: $rootScope.current_project_id,
                scheduled_time_start: null,
                sprint_id: undefined
            }, function (success) {
                if (typeof success == 'object') {
                    refreshTicket(false, 'update');
                }
            }, undefined, undefined, false);
        }

        function remove() {
            dialogService.confirm(null, 'SIDANAV_PREVIEW.DELETE_QUESTION', function () {
                api.ticket.ticket.delete({
                    project_id: $rootScope.current_project_id,
                    id: vm.selected_ticket.id
                }, function () {
                    refresh('delete');
                    closeSidenav();
                }, function (response) {
                    vm.msg_success = '';
                    vm.msg_error = transService.getErrorMassage(response);
                })
            });
        }

        function sendComment(data, successCallback, apiErrorCallback) {
            const comment_id = parseInt(data.id);

            var comment = {
                project_id: vm.selected_ticket.project_id,
                text: data.value,
                interactions: { data: data.mentions },
            };

            const isNew = !data.id;

            if (isNew) {
                comment.ticket_id = vm.selected_ticket.id;

                api.ticket.comments.save(comment,
                    function () {
                        refresh('add-comment');
                        refreshTicket();
                        if (successCallback) successCallback();
                    },
                    function (response) {
                        if (apiErrorCallback) apiErrorCallback(response.data);
                    }
                );
            } else {
                comment.id = comment_id;

                api.ticket.comments.put(comment,
                    function () {
                        refreshTicket();
                        if (successCallback) successCallback();
                    },
                    function (response) {
                        if (apiErrorCallback) apiErrorCallback(response.data);
                    }
                );
            }
        }

        function download(id) {
            $window.open(
                __env.apiUrl + 'projects/' + $rootScope.current_project_id + '/files/' + id +
                '/download?token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany(),
                '_blank');
        }

        function getUrlFile(id) {

            var url = __env.apiUrl + 'projects/' + $rootScope.current_project_id + '/files/' + id +
                '/download?token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany();

            return url;
        }

        function imagePreview(id) {
            dialogService.customDialog(null, 'ImagePreviewController', 'app/main/pages/image-preview/image-preview.html', {
                url: vm.getUrlFile(id)
            });
        }


        function uploadFiles() {
            var files = vm.files;
            vm.files = null;

            $auth.getUser(function (user) {
                filesService.uploadFile(files, false, user.id, $rootScope.current_project_id, [vm.selected_ticket.id], null, null,
                    function (items) {
                        // add new items into the view
                        vm.request_file_sending = false;
                        vm.selected_ticket.files.data = vm.selected_ticket.files.data.concat(items);
                        //refresh board
                        refresh('upload-file');
                    },
                    function (error) {
                        // display errors
                        vm.request_file_sending = false;
                        vm.msg_error = transService.getErrorMassage(error);
                    },
                    function (progress) {
                        vm.request_file_sending = (progress > 0 && progress <= 100) ? true : false;
                        vm.progress = progress;
                    }
                );
            });
        }


    }
})();
