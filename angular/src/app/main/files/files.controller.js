(function ()
{
    'use strict';

    angular
        .module('app.files')
        .controller('FilesController', FilesController);

    /** @ngInject */
    function FilesController(__env, $scope, $window, $auth, $stateParams, $timeout, $mdSidenav, api, transService, tableService, projectsService, projectFiltersService, filesService, dialogService)
    {
        var vm = this;
        transService.loadFile('main/files');

        // Data
        vm.showDetails = true;
        vm.roles = [];

        // Methods
        vm.select = select;
        vm.toggleDetails = toggleDetails;
        vm.getSize = filesService.getSize;
        vm.getIcon = filesService.getIcon;
        vm.editModal = editModal;
        vm.download = download;
        vm.getUrlFile = getUrlFile;
        vm.deleteFile = deleteFile;
        vm.addModal = addModal;
        vm.getFiles = getFiles;
        vm.imagePreview = imagePreview;
        vm.getImageThumbnail = filesService.getImageThumbnail;
        vm.update = update;
        vm.searchStories = searchStories;
        vm.searchUsers = projectsService.searchUser;
        vm.getRoles = getRoles;
        vm.selectType = selectType;     
        vm.types = [];
        vm.selected_type = {};   
        vm.search = '';

        init();
        //////////

        function init() {
            tableService.setVariables(vm);
            projectsService.setCurrent($stateParams.project_id);

            filesService.getFileTypes( function(types) {
                // fill in vm.types array and select default
                setTypes(types);
                
                // select from localstorage info
                var files_filters = projectFiltersService.getTicketFilters('files', $stateParams.project_id);
                if(typeof files_filters != 'undefined') {
                    if(files_filters.type) {
                        var type_present = false;
                        angular.forEach(vm.types, function(type) {
                            if(type.id == files_filters.type) {
                                selectType(files_filters.type, true);
                                type_present = true;
                            }
                        });
                        if(!type_present) {
                            projectFiltersService.removeTicketFilter('files_type', $stateParams.project_id);
                        }
                    }
                }

                getFiles();
                getRoles();
            });
        }

        // Watch search variable
        $scope.$watch(function() { return vm.search; }, function() {
            getFiles();
        });

        function getFiles(edit) {
            vm.files = null;
            vm.pagination = null;
            // set project id
            vm.query.project_id = $stateParams.project_id;
            // defile search query param
            if (vm.search || vm.search != '') vm.query.search = vm.search;
            else vm.query.search = null;
            // defile type filter query param            
            if (vm.selected_type.id) vm.query.file_type = vm.selected_type.name;
            else vm.query.file_type = null;

            vm.promise = api.files.get(vm.query, function (response) {
                vm.files = response.data;
                vm.pagination = response.meta.pagination;

                if (edit === true) {
                    select(vm.selected);
                } else if (vm.files.length) {
                    select(vm.files[0]);
                }
            }).$promise;
        }

        /**
         * Select an item
         *
         * @param item
         */
        function select(item)
        {
            if (item.id) {
                vm.selected = null;
                api.file.get({id:item.id, project_id:$stateParams.project_id}, function (response) {
                    vm.selected = response.data;
                    // values for inline edit purposes (object match)
                    angular.forEach(vm.selected.users.data, function (user) {
                        user.avatar = $auth.getAvatar(user.avatar);
                        user.name = user.first_name + ' ' + user.last_name;
                        user.activated = true;
                        user.deleted = false;
                    });
                });
            }
        }

        /**
         * Toggle details
         *
         * @param item
         */
        function toggleDetails(item)
        {
            select(item);
            $mdSidenav('details-sidenav').toggle();
        }

        function download() {
            $window.open(
                __env.apiUrl + 'projects/' + $stateParams.project_id + '/files/' + vm.selected.id +
                '/download?token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany(),
                '_blank');
        }

        function getUrlFile() {

            var url =  __env.apiUrl + 'projects/' + $stateParams.project_id + '/files/' + vm.selected.id +
                '/download?token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany();

            return url;
        }

        function deleteFile() {
            dialogService.confirm(null, 'FILES.DELETE_QUESTION', function() {
                api.file.delete({id:vm.selected.id, project_id:$stateParams.project_id}, function () {
                    vm.msg_success = transService.translate('FILES.DELETE_SUCCESS');
                    vm.msg_error = '';
                    getFiles();

                },function (response) {
                    vm.msg_error = transService.getErrorMassage(response);
                })
            });
        }

        function addModal() {
            dialogService.customDialog(null, 'AddEditFileDialogController', 'app/main/files/add-edit-file/add-edit-file.html', {project_id:$stateParams.project_id, item:null}, function (success) {
                if (success == true) {
                    vm.msg_error = '';
                    vm.msg_success = transService.translate('FILES.ADDED_FILE');
                    getFiles();
                }
            });
        }

        function editModal() {
            dialogService.customDialog(null, 'AddEditFileDialogController', 'app/main/files/add-edit-file/add-edit-file.html', {project_id:$stateParams.project_id, item:vm.selected}, function (success) {
                if (success == true) {
                    vm.msg_error = '';
                    vm.msg_success = transService.translate('FILES.UPDATED_FILE');
                    getFiles(true);
                }
            });
        }

        function imagePreview() {
            dialogService.customDialog(null, 'ImagePreviewController', 'app/main/pages/image-preview/image-preview.html', {url:vm.getUrlFile()});
        }

        // search stories by 'name'
        // for inline input
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

        /**
         * Select type filter
         * 
         * @param {object} type 
         */
        function selectType(type_id, block_request) {
            // select clicked type
            angular.forEach(vm.types, function(type) {
                if(type.id == type_id) {
                    vm.selected_type = type;
                }
            });
            // get files
            if(!block_request) {
                $timeout( getFiles() );
            }
            // save filter type into localStorage
            projectFiltersService.addTicketFilter(type_id, 'files_type', $stateParams.project_id);
        }

        /**
         * Fill in array of types with default, from api and 'other'
         * @param {object} types 
         */
        function setTypes(types) {
            vm.types = [];
            // default type
            vm.types.push({ id: 0, name: 'all_types' });
            // types from api
            angular.forEach(types, function(type, index) {
                vm.types.push({ id: vm.types.length, name: index });
            });
            // default type
            vm.types.push({ id: vm.types.length, name: 'other' });

            // select default
            vm.selected_type = vm.types[0];
        }

        
        // get project roles
        function getRoles() {
            api.rolesCompany.get({}, function (response) {
                vm.roles = response.data;
            });
        }

        /**
         * Update file from inline edits
         * 
         * @param {string} param 
         */
        function update(param, newValue, successCallback, errorCallback) {
            var edited_file = angular.copy(vm.selected);
            // clear arrayof of objects - wee need ids
            edited_file.pages = [];
            edited_file.roles = [];
            edited_file.stories = [];
            edited_file.tickets = [];
            edited_file.users = [];

            //present params
            angular.forEach(vm.selected.pages.data, function (value) {
                edited_file.pages.push(value.id);
            });
            angular.forEach(vm.selected.roles.data, function (value) {
                edited_file.roles.push(value.id);
            });
            angular.forEach(vm.selected.stories.data, function (value) {
                edited_file.stories.push(value.id);
            });
            angular.forEach(vm.selected.tickets.data, function (value) {
                edited_file.tickets.push(value.id);
            });
            angular.forEach(vm.selected.users.data, function (value) {
                edited_file.users.push(value.id);
            });

            // edited param
            switch(param) {
                case 'description': 
                edited_file.description = newValue;
                    break;
                case 'stories':
                    // convert stories objects into stories ids
                    edited_file.stories = [];
                    if(newValue.length) {
                        angular.forEach(newValue, function (story) {
                            edited_file.stories.push(story.id);
                        });
                    }
                    break;
                case 'roles':
                    edited_file.roles = newValue;
                    break;
                case 'users':
                    // convert users objects into users ids
                    edited_file.users = [];
                    if(newValue.length) {
                        angular.forEach(newValue, function (user) {
                            edited_file.users.push(user.id);
                        });
                    }
                    break;
            }

            // send request to API
            api.file.put(edited_file,
                // refresh data on success
                function (response) {
                    // refresh data
                    select(response.data);
                    if (typeof successCallback != 'undefined') {
                        successCallback();
                    }
                },
                function (response) {
                    if (typeof errorCallback != 'undefined') {
                        errorCallback(response.data);
                    }
                }
            );
        }


    }
})();
