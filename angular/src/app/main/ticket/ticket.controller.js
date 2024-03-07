(function ()
{
    'use strict';

    angular
        .module('app.ticket-show')
        .controller('TicketShowController', TicketShowController);

    /** @ngInject */
    function TicketShowController($rootScope, transService, api, $stateParams, projectsService, filesService, $auth, $scope, $timeout,
        dialogService, tableService, $window, $location, TicketData, textareaSanitizerService)
    {
        var vm = this;
        transService.loadFile('main/ticket');
        // translations for ticket edit modal
        transService.loadFile('main/files');

        // Data
        vm.msg_error = '';
        vm.msg_success = '';
        vm.project = {};
        vm.ticket = TicketData.data;
        vm.ticket.trustedDescription = textareaSanitizerService.sanitizeHTML(vm.ticket.description);
        vm.ticket.comments.data.forEach(comment => comment.trustedText = textareaSanitizerService.sanitizeHTML(comment.text));

        vm.my_logged_time = 0;
        vm.all_logged_time = 0;
        vm.history = {
            rows: null,
            pagination: null
        };
        vm.sprints = [];
        vm.types = [];
        vm.statuses = [];
        vm.files = null;
        vm.progress = 0;
        vm.request_file_sending = false;
        vm.userId = null;

        tableService.setVariables(vm.history);
        vm.history.query.project_id = $stateParams.project_id;
        vm.history.query.id = $stateParams.id;

        vm.getAvatar = $auth.getAvatar;
        vm.getSize = filesService.getSize;
        vm.getIcon = filesService.getIcon;
        vm.formatEstimate = projectsService.formatEstimate;
        vm.hasAccess = projectsService.hasAccess;
        vm.addEditTicket = addEditTicket;
        vm.loadHistory = loadHistory;
        vm.hideTicket = hideTicket;
        vm.showTicket = showTicket;
        vm.deleteTicket = deleteTicket;
        vm.deleteComment = deleteComment;
        vm.download = download;
        vm.getUrlFile = getUrlFile;
        vm.imagePreview = imagePreview;
        vm.getImageThumbnail = filesService.getImageThumbnail;
        vm.addFile = addFile;
        vm.deleteFile = deleteFile;
        vm.editFile = editFile;
        vm.searchUser = projectsService.searchUser;
        vm.searchStories = searchStories;
        vm.searchTickets = searchTickets;
        vm.update = update;
        vm.updateDescription = updateDescription;
        vm.sendComment = sendComment;
        vm.openTicket = openTicket;


        init();

        function init() {
            projectsService.setCurrent($stateParams.project_id, function (project) {
                vm.project = project;
                vm.tickets_datepicker_format = $rootScope.tickets_datepicker_format;
            });
            // files watcher
            filesService.dragAndDropFileInit($scope, vm, 'files', '#drop-files', '#ticket-show', function(items) {
                if(items) vm.files = items;
                uploadFiles();
            });
            // data for inline-inputs
            api.sprint.sprints.get({project_id:$stateParams.project_id, status:'not-closed'}, function (response) {
                angular.forEach(response.data, function(sprint) {
                    if (!sprint.locked) {
                        vm.sprints.push(sprint);
                    }
                });
                // add backlog and select it if sprint is not set
                var backlog = { id: 0, project_id: $stateParams.project_id, name: 'Backlog', status: 'none' };
                vm.sprints.unshift(backlog);
                if(!vm.ticket.sprint.data) vm.ticket.sprint.data = backlog;
            });
            api.ticket.types.get({}, function (response) {
                vm.types = response.data;
            });
            api.agileStatuses.get({project_id:$stateParams.project_id}, function (response) {
                vm.statuses = response.data;
            });

            getTimeLogged();

            $auth.getUser(function(user) {
                vm.userId = user.id;
            });

        }

        function loadTicket() {
            api.ticket.ticket.get({project_id:$stateParams.project_id, id:$stateParams.id}, function (response) {
                vm.ticket = response.data;
                vm.ticket.trustedDescription = textareaSanitizerService.sanitizeHTML(vm.ticket.description);
                vm.ticket.comments.data.forEach(comment => comment.trustedText = textareaSanitizerService.sanitizeHTML(comment.text));

                // select backlog if sprint is not set
                if(!vm.ticket.sprint.data) vm.ticket.sprint.data = vm.sprints[0];
                getTimeLogged();
            });
        }

        function getTimeLogged() {
            vm.my_logged_time = 0;
            vm.all_logged_time = 0;
            if (vm.ticket.time_tracking_summary) {
                $auth.getUser(function (user) {
                    angular.forEach(vm.ticket.time_tracking_summary.data, function (value) {
                        if (user.id == value.user_id) {
                            vm.my_logged_time += value.tracked_sum;
                        }
                        vm.all_logged_time += value.tracked_sum;
                    });
                });
            }
        }

        function addEditTicket() {
            dialogService.customDialog(null, 'AddEditTicketDialogController', 'app/main/agile/add-edit-ticket/add-edit-ticket.html', {id:vm.ticket.id, project_id:$stateParams.project_id, sprint_id:0, scheduled_time_start: null}, function (success) {
                if (typeof success == 'object') {
                    vm.msg_success = transService.translate('TICKET_SHOW.UPDATED_TICKET');
                    vm.msg_error = '';
                }
            }, undefined, loadTicket, false);
        }

        function loadHistory() {
            vm.promise = api.ticket.history.get(vm.history.query, function (response) {
                vm.history.rows = response.data;
                vm.history.pagination = response.meta.pagination;
            }).$promise;
        }

        function hideTicket() {
            dialogService.confirm(null, 'TICKET_SHOW.HIDDEN_QUESTION', function() {
                api.ticket.hide.put({project_id:$stateParams.project_id, id:$stateParams.id}, function () {
                    vm.msg_success = transService.translate('TICKET_SHOW.HIDDEN_TICKET');
                    vm.msg_error = '';
                    loadTicket();

                },function (response) {
                    vm.msg_success = '';
                    vm.msg_error = transService.getErrorMassage(response);
                })
            });
        }

        function showTicket() {
            dialogService.confirm(null, 'TICKET_SHOW.SHOWN_QUESTION', function() {
                api.ticket.show.put({project_id:$stateParams.project_id, id:$stateParams.id}, function () {
                    vm.msg_success = transService.translate('TICKET_SHOW.SHOWN_TICKET');
                    vm.msg_error = '';
                    loadTicket();

                },function (response) {
                    vm.msg_success = '';
                    vm.msg_error = transService.getErrorMassage(response);
                })
            });
        }

        function deleteTicket() {
            dialogService.confirm(null, 'TICKET_SHOW.DELETE_QUESTION', function() {
                api.ticket.ticket.delete({project_id:$stateParams.project_id, id:$stateParams.id}, function () {
                    $location.path('/projects/' + $stateParams.project_id + '/agile');
                },function (response) {
                    vm.msg_success = '';
                    vm.msg_error = transService.getErrorMassage(response);
                })
            });
        }

        function deleteComment(id) {
            dialogService.confirm(null, 'TICKET_SHOW.DELETE_COMMENT_QUESTION', function() {
                api.ticket.comments.delete({project_id:$stateParams.project_id, id:id}, function () {
                    vm.msg_success = transService.translate('TICKET_SHOW.DELETE_COMMENT');
                    vm.msg_error = '';
                    loadTicket();
                },function (response) {
                    vm.msg_success = '';
                    vm.msg_error = transService.getErrorMassage(response);
                })
            });
        }

        function download(id) {
            $window.open(
                __env.apiUrl + 'projects/' + $stateParams.project_id + '/files/' + id +
                '/download?token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany(),
                '_blank');
        }

        function getUrlFile(id) {

            var url =  __env.apiUrl + 'projects/' + $stateParams.project_id + '/files/' + id +
                '/download?token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany();

            return url;
        }

        function imagePreview(id) {
            dialogService.customDialog(null, 'ImagePreviewController', 'app/main/pages/image-preview/image-preview.html', {url:vm.getUrlFile(id)});
        }

        /**
         * Update ticket
         *
         * @param {any} param
         * @param {any} new_value
         * @param {any} successCallback
         * @param {any} apiErrorCallback
         */
        function update(param, new_value, successCallback, apiErrorCallback) {
            switch(param) {
                case 'name':
                    vm.ticket.name = new_value;
                    break;
                case 'assigned_user':
                    vm.ticket.assigned_id = (new_value && new_value.id) ? new_value.id : null;
                    break;
                case 'reporting_user':
                    vm.ticket.reporter_id = (new_value && new_value.id) ? new_value.id : null;
                    break;
                case 'estimate_time':
                    vm.ticket.estimate_time = projectsService.estimationToSeconds(new_value);
                    break;
                case 'scheduled_time_start':
                    if (new_value && new_value != '')
                        vm.ticket.scheduled_time_start = moment(new_value).format('YYYY-MM-DD HH:mm:ss');
                    else
                        vm.ticket.scheduled_time_start = null;
                    break;
                case 'scheduled_time_end':
                    if (new_value && new_value != '')
                        vm.ticket.scheduled_time_end = moment(new_value).format('YYYY-MM-DD HH:mm:ss');
                    else
                        vm.ticket.scheduled_time_end = null;
                    break;
                case 'stories':
                    vm.ticket.stories.data = new_value;
                    break;
                case 'description':
                    vm.ticket.description = new_value;
                    break;
                case 'type':
                    vm.ticket.type_id = new_value;
                    break;
                case 'sprint':
                    vm.ticket.sprint_id = new_value;
                    break;
                case 'parent_tickets':
                    vm.ticket.parent_ticket_ids = new_value.map(function (t) {
                        return t.id;
                    });
                    break;
                case 'sub_tickets':
                    vm.ticket.sub_ticket_ids = new_value.map(function (t) {
                        return t.id;
                    });
                    break;
                case 'status':
                    api.ticket.changePriority.put( {
                            project_id: vm.ticket.project_id,
                            id: vm.ticket.id,
                            status_id: new_value,
                            before_ticket_id: vm.ticket.status_id == new_value ? vm.ticket.id : null
                        },
                        function () {
                            loadTicket();
                            if (typeof successCallback != 'undefined') successCallback();
                        },
                        function (response) {
                            if (typeof apiErrorCallback != 'undefined') apiErrorCallback(response.data);
                        }
                    );
                    return;
            }

            convertStoriesToIds();

            // send request to API
            api.ticket.ticket.put(vm.ticket,
                // refresh data on success
                function () {
                    loadTicket();
                    if (typeof successCallback != 'undefined') successCallback();
                },
                function (response) {
                    console.error(response);
                    if (typeof apiErrorCallback != 'undefined') apiErrorCallback(response.data);
                }
            );
        }

        /**
         * @description Convert stories objects into stories ids
         */
        function convertStoriesToIds() {
            vm.ticket.story_id = [];

            if (!vm.ticket.stories.data.length) return;

            angular.forEach(vm.ticket.stories.data, function (story) {
                vm.ticket.story_id.push(story.id);
            });
        }

        function updateDescription(data, successCallback, apiErrorCallback) {
            vm.ticket.description = data.value;
            vm.ticket.interactions = { data: data.mentions };

            convertStoriesToIds();

            api.ticket.ticket.put(vm.ticket, onSaveSuccess, onSaveError);

            function onSaveSuccess() {
                loadTicket();
                if (typeof successCallback != 'undefined') successCallback();
            }

            function onSaveError(response) {
                console.error(response);
                if (typeof apiErrorCallback != 'undefined') apiErrorCallback(response.data);
            }
        }

        function sendComment(data, successCallback, apiErrorCallback) {
            const comment = {
                project_id: vm.ticket.project_id,
                text: data.value,
                interactions: { data: data.mentions },
            };

            const isNew = !data.id;
            let method;

            if (isNew) {
                comment.ticket_id = vm.ticket.id;
                method = 'save';
            } else {
                comment.id = data.id;
                method = 'put';
            }

            api.ticket.comments[method](comment, onSaveSuccess, onSaveError);

            function onSaveSuccess() {
                loadTicket();
                if (successCallback) successCallback();
            }

            function onSaveError(response) {
                if (apiErrorCallback) apiErrorCallback(response.data);
            }
        }

        // search stories by 'name'
        function searchStories(query) {
            return api.stories.get({
                    project_id: $stateParams.project_id,
                    limit: 15,
                    name: query
                }
            ).$promise.then(function (response) {
                return response.data;
            });
        }

        // search tickets by 'number or title'
        function searchTickets(query) {
            return api.ticket.tickets.get({
                    project_id: $stateParams.project_id,
                    limit: 10,
                    search: query
                }
            ).$promise.then(function (response) {
                return response.data;
            });
        }

        /**
         * Upload files
         */
        function uploadFiles() {
            var files = vm.files;
            vm.files = null;

            $auth.getUser(function(user){
                filesService.uploadFile(files, false, user.id, $stateParams.project_id, [vm.ticket.id], null, null,
                    function(items) {
                        // add new items into the view
                        vm.request_file_sending = false;
                        vm.ticket.files.data = vm.ticket.files.data.concat(items);
                    }, function(error) {
                        // display errors
                        vm.request_file_sending = false;
                        vm.msg_error = transService.getErrorMassage(error);
                        $location.hash('error');
                    }, function(progress) {
                        vm.request_file_sending = (progress > 0 && progress <= 100) ? true : false;
                        vm.progress = progress;
                    }
                );
            });
        }
        // "Add file" button button event
        function addFile() {
            $timeout(function() {
                angular.element('#file-to-upload').trigger('click');
            }, 100);
        }


        function deleteFile(file_id) {
            dialogService.confirm(null, 'TICKET_SHOW.DELETE_FILE_QUESTION', function() {
                api.file.delete({id:file_id, project_id: $stateParams.project_id}, function () {
                    // remove item from files array
                    angular.forEach(vm.ticket.files.data, function(file, index) {
                        if (file.id == file_id) {
                            vm.ticket.files.data.splice(index, 1);
                        }
                    });

                },function (response) {
                    vm.msg_error = transService.getErrorMassage(response);
                })
            });
        }

        function editFile(file_id) {
            // get ticket full data
            api.file.get({ project_id: $stateParams.project_id, id:file_id }, function(response) {
                    // open edit modal
                    dialogService.customDialog(null, 'AddEditFileDialogController', 'app/main/files/add-edit-file/add-edit-file.html', {project_id: $stateParams.project_id, item: response.data}, function (success) {
                        if (success == true) {
                            // HAPPINESS!!! ...nothing to update
                        }
                    });
            });
        }

        function openTicket(ticket) {
            var ticket = '/projects/' + $stateParams.project_id + '/ticket/' + ticket.title;
            $window.open(ticket, '_blank');
        }


        //////////
    }
})();
