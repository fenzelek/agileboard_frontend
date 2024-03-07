(function ()
{
    'use strict';

    angular
        .module('app.backlog')
        .controller('AddEditTicketDialogController', AddEditTicketDialogController);

    /** @ngInject */
    function AddEditTicketDialogController($rootScope, transService, $mdDialog, $auth, $window, $timeout, api, $scope, apiErrorsService, projectsService, filesService, formService, project_id, id, sprint_id, scheduled_time_start)
    {
        var vm = this;
        var onSave = new $rootScope.Deferred();

        transService.loadFile('main/agile/add-edit-ticket');

        vm.msg_success = '';
        vm.msg_error = '';
        vm.request_sending = false;
        vm.edit = false;
        vm.sprints = [];
        vm.locked_sprint_ids = [];
        vm.stories = [];
        vm.parent_tickets = [];
        vm.sub_tickets = [];
        vm.types = [];
        vm.users = [];
        vm.assigned = null;
        vm.reporter = null;
        vm.estimate_time_text = '';
        vm.progress = 0;
        vm.request_file_sending = false;
        vm.files = [];
        vm.upload_files = null;
        vm.lang = transService.getLanguage();
        vm.tickets_datepicker_format = $rootScope.tickets_datepicker_format;

        vm.maxLength = 30000;

        vm.descriptionConfig = {
            ticketId: id,
            onSave: onSave.promise,
            mentions: [],
        };

        vm.form = {
            project_id: project_id,
            id: id,
            name: '',
            sprint_id: sprint_id,
            type_id: null,
            assigned_id: null,
            reporter_id: null,
            description: null,
            estimate_time: 0,
            scheduled_time_start: scheduled_time_start,
            scheduled_time_end: null,
            story_id: [],
            parent_ticket_ids: [],
            sub_ticket_ids: []
        };

        vm.form_file = {
            user_id: null,
            project_id: project_id,
            file: null,
            description: '',
            roles: [],
            users: [],
            stories: [],
            pages: []
        };

        vm.searchUser = projectsService.searchUser;
        vm.stripFormat = projectsService.stripFormat;
        vm.searchStories = searchStories;
        vm.searchTickets = searchTickets;
        vm.hide = hide;
        vm.addFile = addFile;
        vm.getSize = filesService.getSize;
        vm.getIcon = filesService.getIcon;
        vm.download = download;
        vm.getUrlFile = getUrlFile;
        vm.deleteFile = deleteFile;
        vm.send = send;

        init();


        filesService.dragAndDropFileInit($scope, vm, 'upload_files', '#drop-files', '#add-edit-ticket-dialog', function(dropped_items) {
            if(dropped_items) vm.upload_files = dropped_items;
            if(vm.upload_files) uploadFiles();
        });

        function init() {
            api.sprint.sprints.get({project_id:project_id, status:'not-closed'}, function (response) {
                angular.forEach(response.data, function(sprint) {
                    if (!sprint.locked) {
                        vm.sprints.push(sprint);
                    } else {
                        vm.locked_sprint_ids.push(sprint.id);
                    }
                });
            });
            api.ticket.types.get({}, function (response) {
                vm.types = response.data;
                if (!vm.edit) {
                    angular.forEach(vm.types, function (type) {
                        if (type.name == "Task") {
                            vm.form.type_id = type.id;
                        }
                    });
                }
            });

            //load edit
            if (typeof id != 'undefined') {
                vm.edit = true;
                api.ticket.ticket.get({project_id:project_id, id:id}, function (response) {
                    formService.generateForm(vm.form, response.data);
                    // load ticket files
                    vm.files = response.data.files.data;
                    // load ticket estimate time
                    vm.estimate_time_text = projectsService.formatEstimate(vm.form.estimate_time);
                    // load list of ticket stories
                    vm.stories = response.data.stories.data;
                    // load list of related to tickets
                    vm.parent_tickets = response.data.parent_tickets.data;
                    // load list of sub-tickets
                    vm.sub_tickets = response.data.sub_tickets.data;
                    // load assigned user if exists
                    if (vm.form.assigned_id) {
                        vm.assigned = response.data.assigned_user.data;
                    }
                    // load author of ticket if exists
                    if (vm.form.reporter_id) {
                        vm.reporter = response.data.reporting_user.data;
                    }
                });
            } else {
            // if new ticket
                $auth.getUser(function (user) {
                    vm.form.reporter_id = user.id;
                    vm.reporter = user;
                });
            }
        }

        function hide() {
            $mdDialog.hide();
        }

        function addFile() {
            $timeout(function() {
                angular.element('#file-to-upload').trigger('click');
            }, 100);
        }

        function uploadFiles() {

            var files = vm.upload_files;
            vm.upload_files = null;
            var ticket_id = vm.edit ? [id] : null;
            var temp_file = ticket_id ? false : true;

            $auth.getUser(function(user){
                filesService.uploadFile(files, temp_file, user.id, project_id, ticket_id, null, null,
                    function(items) {
                        // add new items into the view
                        vm.request_file_sending = false;
                        // mark new items to assign ticket id
                        angular.forEach(items, function(file) {
                            // if new ticket - mark files to assign
                            if (!ticket_id) file.to_assign = true;
                        });
                        vm.files = vm.files.concat(items);
                    }, function(error) {
                        // display errors
                        vm.request_file_sending = false;
                        vm.msg_error = transService.getErrorMassage(error);
                    }, function(progress) {
                        vm.request_file_sending = (progress > 0 && progress <= 100) ? true : false;
                        vm.progress = progress;
                    }
                );
            });
        }

        function download(id) {
            $window.open(
                __env.apiUrl + 'projects/' + project_id + '/files/' + id +
                '/download?token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany(),
                '_blank');
        }

        function getUrlFile(id) {
            var url =  __env.apiUrl + 'projects/' + project_id + '/files/' + id +
                '/download?token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany();

            return url;
        }

        function deleteFile(file_id) {
            // dialogService.confirm(null, 'ADD_EDIT_TICKET.DELETE_FILE_QUESTION', function() {
                api.file.delete({id:file_id, project_id:project_id}, function () {
                    // remove item from files array
                    angular.forEach(vm.files, function(file, index) {
                        if (file.id == file_id) {
                            vm.files.splice(index, 1);
                        }
                    });

                },function (response) {
                    vm.msg_error = transService.getErrorMassage(response);
                })
            // });
        }

        // search stories by 'name'
        function searchStories(query) {
            return api.stories.get({
                    project_id: project_id,
                    limit: 30,
                    name: query
                }
            ).$promise.then(function (response) {
                if (!response.data || !response.data.length) {
                    return [{
                        name: transService.translate('ADD_EDIT_TICKET.CREATE_NEW') + query,
                        id: 0
                    }];
                }
                return response.data;
            });
        }

        // search tickets by 'number or title'
        function searchTickets(query) {
            return api.ticket.tickets.get({
                    project_id: project_id,
                    limit: 10,
                    search: query
                }
            ).$promise.then(function (response) {
                return response.data;
            });
        }

        /**
         * Assign uploaded files to ticet
         *
         * @param {object} file
         * @param {object} ticket_id
         */
        function assignFileToTicket(file, ticket_id) {
            var params = {
                id: file.id,
                name: file.name,
                tickets: [ticket_id],
                project_id: project_id,
                temp: 0
            };
            api.file.put(params);
        }

        function createStories(callback) {
            var existingStories = [];
            var promises = [];
            angular.forEach(vm.stories, function (story) {
                if (story.id == 0) {
                    promises.push(api.stories.save({
                        name: story.name.replace(transService.translate('ADD_EDIT_TICKET.CREATE_NEW'), ''),
                        project_id: project_id
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
                vm.stories = existingStories.concat(newStories);
                callback();
            }).catch(function () {
                $timeout(function () {
                    vm.stories = existingStories;
                    vm.request_sending = false;
                });
            });
        }

        function createTicket() {
            vm.request_sending = true;
            apiErrorsService.clear('#addEditTicket', vm);

            vm.form.assigned_id = vm.assigned ? vm.assigned.id : null;
            vm.form.reporter_id = vm.reporter ? vm.reporter.id : null;

            //estimation
            vm.form.estimate_time = 0;
            var error_estimate = false;
            if (vm.estimate_time_text != '') {
                vm.form.estimate_time = projectsService.estimationToSeconds(vm.estimate_time_text);
                if(!vm.form.estimate_time) {
                    error_estimate = true;
                }
            }
            // fill ticket stories arrray with stories IDs
            vm.form.story_id = [];
            if (vm.stories.length) {
                angular.forEach(vm.stories, function (story) {
                    vm.form.story_id.push(story.id);
                });
            }

            // `releated to` tickets to IDs
            vm.form.parent_ticket_ids = [];
            if (vm.parent_tickets.length) {
                angular.forEach(vm.parent_tickets, function (ticket) {
                    vm.form.parent_ticket_ids.push(ticket.id);
                });
            }
            // `sub-tickets` to IDs
            vm.form.sub_ticket_ids = [];
            if (vm.sub_tickets.length) {
                angular.forEach(vm.sub_tickets, function (ticket) {
                    vm.form.sub_ticket_ids.push(ticket.id);
                });
            }

            // scheduled_time_start
            if (vm.form.scheduled_time_start && vm.form.scheduled_time_start != '') {
                vm.form.scheduled_time_start = moment(vm.form.scheduled_time_start).format('YYYY-MM-DD HH:mm:ss');
            } else {
                vm.form.scheduled_time_start = null;
            }

            // scheduled_time_end
            if (vm.form.scheduled_time_end && vm.form.scheduled_time_end != '') {
                vm.form.scheduled_time_end = moment(vm.form.scheduled_time_end).format('YYYY-MM-DD HH:mm:ss')
            } else {
                vm.form.scheduled_time_end = null;
            }

            vm.form.interactions = { data: angular.copy(vm.descriptionConfig.mentions) };

            if (error_estimate) {
                vm.msg_error = transService.translate('ADD_EDIT_TICKET.ESTIMATE_ERROR');
                vm.request_sending = false;
            } else {
                if (vm.edit) {
                    api.ticket.ticket.put(vm.form,
                        // success
                        function (response) {
                            onSave.resolve();
                            // assign files to the ticket
                            angular.forEach(vm.files, function(file) {
                                if(file.to_assign) {
                                    assignFileToTicket(file, response.data.id);
                                }
                            });
                            $mdDialog.hide(response.data);
                        },
                        // error
                        function (response) {
                            onSave.reject();
                            apiErrorsService.show('#addEditTicket', response, vm, []);
                            vm.request_sending = false;
                            vm.msg_error = transService.getErrorMassage(response);
                        }
                    );
                } else {
                    api.ticket.tickets.save(vm.form,
                        // success
                        function (response) {
                            onSave.resolve({ id: response.data.id, type: 'ticket' });
                            // assign files to this ticket
                            angular.forEach(vm.files, function(file) {
                                if(file.to_assign) {
                                    assignFileToTicket(file, response.data.id);
                                }
                            });
                            $mdDialog.hide(response.data);
                        },
                        // error
                        function (response) {
                            onSave.reject();
                            apiErrorsService.show('#addEditTicket', response, vm, []);
                            vm.request_sending = false;
                            vm.msg_error = transService.getErrorMassage(response);
                        }
                    );
                }
            }
        }

        function send() {
            vm.request_sending = true;
            createStories(function () {
                createTicket();
            });
        }
    }

})();
