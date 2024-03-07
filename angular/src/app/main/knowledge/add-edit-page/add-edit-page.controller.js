(function ()
{
    'use strict';

    angular
        .module('app.knowledge')
        .controller('AddEditPageKnowledgeDialogController', AddEditPageKnowledgeDialogController);

    /** @ngInject */
    function AddEditPageKnowledgeDialogController($rootScope, $auth, transService, $mdDialog, api, apiErrorsService, formService, projectsService, filesService, $timeout, $scope, project_id, directories, dir_id, id)
    {
        var vm = this;

        var onSave = new $rootScope.Deferred();

        vm.msg_success = '';
        vm.msg_error = '';
        vm.request_sending = false;
        vm.roles = [];
        vm.edit = false;
        vm.form_users = [];
        vm.directories = directories;
        // vm.stripFormat = projectsService.stripFormat;
        vm.progress = 0;
        vm.request_file_sending = false;
        vm.files = [];
        vm.upload_files = null;
        vm.stories = [];

        vm.maxLength = 60000;

        vm.contentConfig = {
            pageId: id,
            onSave: onSave.promise,
            mentions: [],
        };

        vm.form = {
            id: null,
            knowledge_directory_id: dir_id ? dir_id : null,
            name: '',
            content: '',
            pinned: false,
            project_id: project_id,
            roles: [],
            users: [],
            stories: []
        };

        vm.hide = hide;
        vm.send = send;
        vm.searchUser = projectsService.searchUser;
        vm.addFile = addFile;
        vm.getSize = filesService.getSize;
        vm.deleteFile = deleteFile;
        vm.searchStories = searchStories;

        init();

        filesService.dragAndDropFileInit($scope, vm, 'upload_files', '#drop-files', '#add-edit-page-knowledge-md-dialog', function(dropped_items) {
            if(dropped_items) vm.upload_files = dropped_items;
            if(vm.upload_files) uploadFiles();
        });

        function init() {

            $auth.getUser(function (user) {
                vm.form.user_id = user.id;
            });

            api.rolesCompany.get({}, function (response) {
                vm.roles = response.data;
            });

            //edit
            if (id) {
                api.page.page.get({project_id: project_id, id:id}, function(response) {
                    vm.edit = true;
                    formService.generateForm(vm.form, response.data);
                    vm.form.id = response.data.id;
                    vm.form.knowledge_directory_id = vm.form.knowledge_directory_id ? vm.form.knowledge_directory_id : null,
                    vm.files = response.data.files.data;
                    vm.stories = response.data.stories.data;
                    vm.form.roles = [];
                    vm.form.users = [];
                    vm.form_users = [];
                    angular.forEach(response.data.roles.data, function (value) {
                        vm.form.roles.push(value.id);
                    });
                    angular.forEach(response.data.users.data, function (value) {
                        value.avatar = $auth.getAvatar(value.avatar);
                        value.name = value.first_name + ' ' + value.last_name;
                        vm.form_users.push(value);
                    });
                });
            }
        }

        function addFile() {
            $timeout(function() {
                angular.element('#file-to-upload').trigger('click');
            }, 100);
        }

        function deleteFile(file_id) {
            // dialogService.confirm(null, 'ADD_EDIT_TICKET.DELETE_FILE_QUESTION', function() {
            api.file.delete({id:file_id, project_id:project_id}, function () {
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

        function hide() {
            $mdDialog.hide();
        }

        // search stories by 'name'
        function searchStories(query) {
            return api.stories.get({
                    project_id: project_id,
                    limit: 15,
                    name: query
                }
            ).$promise.then(function (response) {
                return response.data;
            });
        }

        /**
         * Upload file using service with temporary flag and page_id
         * 
         */
        function uploadFiles() {
            var files = vm.upload_files;
            vm.upload_files = null;

            var page_id = vm.edit ? [id] : null;
            var temp_file = page_id ? false : true;

            $auth.getUser(function(user){
                filesService.uploadFile(files, temp_file, user.id, project_id, null, page_id, null, 
                    function(items) {
                        // add new items into the view
                        vm.request_file_sending = false;
                        // mark new items to assign ticket id
                        angular.forEach(items, function(file) {
                            // if new ticket - mark files to assign
                            if (!page_id) file.to_assign = true;
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

        /**
         * Assign uploaded files to the page and set temp flag to 0
         * 
         * @param {object} file 
         * @param {object} page_id
         */
        function assignFileToPage(file, page_id) {
            var params = {
                id: file.id,
                name: file.name,
                pages: [page_id],
                project_id: project_id,
                temp: 0
            };
            api.file.put(params);
        }


        /**
         * Create/edit page
         */
        function send() {

            vm.request_sending = true;
            apiErrorsService.clear('#addEditPage', vm);

            vm.form.users = [];
            angular.forEach(vm.form_users, function (obj) {
                vm.form.users.push(obj.id);
            });

            // fill ticket stories arrray with stories IDs
            vm.form.stories = [];
            if(vm.stories.length) {
                angular.forEach(vm.stories, function (story) {
                    vm.form.stories.push(story.id);
                });
            }

            vm.form.interactions = { data: angular.copy(vm.contentConfig.mentions) };

            if (vm.edit) {
                api.page.page.put(vm.form,
                    // success
                    function(response) {
                        onSave.resolve();
                        // assign uploaded files to page
                        angular.forEach(vm.files, function(file) {
                            if(file.to_assign) {
                                assignFileToPage(file, response.data.id);
                            }
                        });
                        // send edited item id
                        $mdDialog.hide(response.data.id);
                    },
                    // error
                    function(response) {
                        onSave.reject();
                        apiErrorsService.show('#addEditPage', response, vm, []);
                        vm.request_sending = false;
                        vm.msg_error = transService.getErrorMassage(response);
                    }
                );
            } else {
                api.pages.save(vm.form,
                    // success
                    function(response) {
                        onSave.resolve({ id: response.data.id, type: 'page' });
                        // assign uploaded files to page
                        angular.forEach(vm.files, function(file) {
                            if(file.to_assign) {
                                assignFileToPage(file, response.data.id);
                            }
                        });
                        // send saved item id
                        $mdDialog.hide(response.data.id);
                    },
                    // error
                    function(response) {
                        onSave.reject();
                        apiErrorsService.show('#addEditPage', response, vm, []);
                        vm.request_sending = false;
                        vm.msg_error = transService.getErrorMassage(response);
                    }
                );
            }
        }

        
    }

})();
