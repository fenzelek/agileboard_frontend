(function ()
{
    'use strict';

    angular
        .module('app.core')
        .factory('filesService', filesService);

    /** @ngInject */
    function filesService($rootScope, $auth, $timeout, $window, $stateParams, api)
    {
        var file_types = null;

        var service = {
            getSize: getSize,
            getIcon: getIcon,
            getImageThumbnail: getImageThumbnail,
            uploadFile: uploadFile,
            dragAndDropFileInit: dragAndDropFileInit,
            getFileTypes: getFileTypes,
            refreshFileTypes: refreshFileTypes,
        };
        return service;


        // METHODS:

        /**
         * format bytes to string
         *
         * @param size
         * @returns {string}
         */
        function getSize(size) {
            //KB
            size = size / 1024;
            if (size < 100) {
                return Math.round(size) + 'KB';
            }
            //MB
            size = size / 1024;
            return size.toFixed(2) + 'MB';
        }

        /**
         * Refresh file types data
         *
         * @param closure
         */
        function refreshFileTypes(closure) {
            return api.filesTypes.get({}, function (response) { 
                file_types = response.data;
                if (typeof closure != 'undefined') {
                    closure(file_types);
                }
            });
        }

        

        /**
         * Get file types
         *
         * @param closure
         */
        function getFileTypes(closure) {
            if (file_types == null) {
                refreshFileTypes(closure);
            } else {
                if (typeof closure != 'undefined') {
                    closure(file_types);
                }
            }
        }

        /**
         * get icon for file extension
         *
         * @param extension
         * @returns {*}
         */
        function getIcon(extension) {
            extension = extension.toLowerCase();

            if (file_types['images'].indexOf(extension) > -1) {
                return 'icon-file-image';
            }
            if (file_types['pdf'].indexOf(extension) > -1) {
                return 'icon-file-pdf';
            }
            if (file_types['documents'].indexOf(extension) > -1) {
                return 'icon-file-document';
            }
            if (file_types['spreadsheets'].indexOf(extension) > -1) {
                return 'icon-file-excel';
            }

            return 'icon-file';
        }

        function getImageThumbnail(file_id, width, projectId) {
            if (!projectId) projectId = $stateParams.project_id;

            var url =  __env.apiUrl + 'projects/' + projectId + '/files/' + file_id +
                '/download?token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany();

            if (width) url += '&width=' + width;

            return url;
        }


        /**
         * Adds events for drag&drop and ctrl+v file upload 
         * 
         * @param {object} scope 
         * @param {object} vm
         * @param {string} filesContainer name in vm
         * @param {string} dropFilesArea 
         * @param {string} pasteImageArea 
         * @param {function} callback 
         */
        function dragAndDropFileInit($scope, vm, filesContainer, dropFilesArea, pasteImageArea, callback) {
            
            // watching array of files and upload if any 
            // used only if 'Upload' button present
            if($scope && vm && filesContainer) {
                $scope.$watchCollection(function () {
                    return vm[filesContainer];
                }, callback);
            }

            $timeout(function () {
                $(dropFilesArea).on('dragover', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                });
                $(dropFilesArea).on('dragenter', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                });
                $(dropFilesArea).on('drop', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    callback(e.originalEvent.dataTransfer.files);
                });

                // add classes to viasualize drag and drop
                $(dropFilesArea).on('dragover dragenter', function() {
                    $(dropFilesArea).addClass('is-dragover');
                })
                .on('dragleave dragend drop', function() {
                    $(dropFilesArea).removeClass('is-dragover');
                });


                // Upload pasted (Ctrl+V) image / screenshot
                $(pasteImageArea).on('paste', function (e) {
                    var items = (e.clipboardData || e.originalEvent.clipboardData).items;
                    for (var i in items) {
                        var item = items[i];
                        if (item.kind === 'file') {
                            callback(item.getAsFile());
                        }
                    }
                });
            }, 1000);
        }

        /**
         * Drag & drop files upload service
         * 
         * @param {array of objects} files to upload
         * @param {int} user_id 
         * @param {int} project_id 
         * @param {array of int} tickets 
         * @param {array of int} pages 
         * @param {array of int} stories 
         * @param {callback} success
         * @param {callback} error
         * @param {callback} progress
         */
        function uploadFile(files, temp, user_id, project_id, tickets, pages, stories, success, error, progress) {
            var form_file = {
                user_id: user_id,
                project_id: project_id,
                files: files,
                file: null,
                description: '',
                tickets: tickets ? tickets : [],
                roles: [],
                users: [],
                stories: stories ? stories : [],
                pages: pages ? pages : [],
                temp: temp
            };
            var form_files = [];
            var uploaded_files = [];

            if (form_file.files) {
                if (form_file.files.constructor.name != 'FileList') {
                    form_file.files = [form_file.files];
                }
                form_files = form_file.files;
                form_file.files = null;
                var count_success = 0;

                for(var i in form_files) {

                    if (!isNaN(i)) {

                        form_file.file = form_files[i];

                        api.fileUpload.save(form_file,
                            // success
                            function (response) {
                                // add file to files list
                                // ticket.files.data.push(response.data);
                                uploaded_files.push(response.data);

                                // all files uploaded?
                                ++count_success;
                                if (count_success == form_files.length) {
                                    form_files = null;
                                    success(uploaded_files);
                                }
                            },
                            // error
                            function (response) {
                                error(response);
                            },
                            // progress
                            function (prog) {
                                progress(prog);
                            }
                        );
                    }
                }
            }
        }

        //

    }
})();
