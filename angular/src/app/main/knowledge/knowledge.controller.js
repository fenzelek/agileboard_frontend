import EventEmitter from 'events';


(function ()
{
    'use strict';

    angular
        .module('app.knowledge')
        .controller('KnowledgeController', KnowledgeController);

    /** @ngInject */
    function KnowledgeController($element, $scope, $timeout, dialogService, $mdMedia, $window, $location, $auth, $filter,
        api, transService, projectsService, projectFiltersService, filesService, $stateParams, Directories, SinglePages, StoriesData, textareaSanitizerService)
    {
        var vm = this;

        transService.loadFile('main/knowledge');

        // Data
        projectsService.setCurrent($stateParams.project_id);

        vm.create_edit_permission = ['owner', 'admin', 'developer'];

        vm.user = null;

        vm.msg_error = '';
        vm.msg_success = '';
        vm.directories = Directories.data;
        vm.single_pages = SinglePages.data;
        vm.stories = StoriesData.data;
        vm.search = '';
        vm.storySearch = '';
        vm.filtered_pages = [];

        vm.selected_page_id = null;
        vm.selected_page = {};
        vm.selected_story = {};
        vm.page_loading = false;

        vm.responsiveReadPane = undefined;
        vm.activePaneIndex = 0;
        vm.dynamicHeight = false;

        vm.scrollPos = 0;
        vm.scrollEl = angular.element('#content');

        // vm.selected_pageShowDetails = false;

        vm.ee = new EventEmitter();

        // Methods
        vm.closeReadPane = closeReadPane;
        vm.addEditDirectoryModal = addEditDirectoryModal;
        vm.addEditPageModal = addEditPageModal;
        vm.deleteDir = deleteDir;
        vm.deletePage = deletePage;
        vm.selectPage = selectPage;
        vm.toggleDirectory = toggleDirectory;
        vm.download = download;
        vm.getUrlFile = getUrlFile;
        vm.getImageThumbnail = filesService.getImageThumbnail;
        vm.imagePreview = imagePreview;
        vm.getSize = filesService.getSize;
        vm.getIcon = filesService.getIcon;
        vm.selectStory = selectStory;
        vm.storyPageFilter = storyPageFilter;
        vm.storyDirectoryFilter = storyDirectoryFilter;
        vm.storySinglePagesInfoFilter = storySinglePagesInfoFilter;
        vm.hasAccess = projectsService.hasAccess;
        vm.getAvatar = $auth.getAvatar;
        vm.updateComment = updateComment;
        vm.addComment = addComment;
        vm.removeComment = removeComment;
        vm.toggleEdit = toggleEdit;
        vm.isMe = isMe;
        //////////

        // Watch screen size to activate responsive read pane
        $scope.$watch(function ()
        {
            return $mdMedia('gt-sm');
        }, function (current)
        {
            vm.responsiveReadPane = !current;
        });

        // Watch screen size to activate dynamic height on tabs
        $scope.$watch(function ()
        {
            return $mdMedia('xs');
        }, function (current)
        {
            vm.dynamicHeight = current;
        });

        // Watch search query
        $scope.$watch(function() { return vm.search; }, function(query) {
            searchFilter(query);
        });

        // The md-select directive eats keydown events for some quick select
        // logic. Since we have a search input here, we don't need that logic.
        $element.find('input.select-search').on('keydown', function(ev) {
            ev.stopPropagation();
        });

        init();

        /**
         * Close read pane
         */
        function closeReadPane()
        {
            if ( angular.isDefined(vm.responsiveReadPane) && vm.responsiveReadPane )
            {
                vm.activePaneIndex = 0;

                $timeout(function ()
                {
                    vm.scrollEl.scrollTop(vm.scrollPos);
                }, 650);
            }
        }

        function init() {

            // detect page from url
            var pageFromUrl;
            if($location.hash()) {
                pageFromUrl = getPageIdFromHash();
            }
            // load init page
            if(pageFromUrl) {
                selectPage(pageFromUrl);
            } else {
                loadIndexPage();
            }

            // list stories and select story from localStorage if exists
            vm.stories.unshift({
                id: 0,
                name: '',
                translate: 'KNOWLEDGE.ALL_STORIES'
            });
            // select default
            vm.selected_story = vm.stories[0];

            // select from localstorage info
            var ticket_filters = projectFiltersService.getTicketFilters('knowledge', $stateParams.project_id);
            if(typeof ticket_filters != 'undefined') {
                if(ticket_filters.story) {
                    var story_present = false;
                    angular.forEach(vm.stories, function(story) {
                        if(story.id == ticket_filters.story) {
                            selectStory(ticket_filters.story, true);
                            story_present = true;
                        }
                    });
                    if(!story_present) {
                        projectFiltersService.removeTicketFilter('knowledge_story', $stateParams.project_id);
                    }
                }
            }

            // load localstorage folders open/closed structure
            loadDirectoriesView();

            $auth.getUser(function (user) {
                vm.user = user;
            });
        }


        /**
         * Filters page through selected story
         *
         * @param {object} page
         * @returns {boolean} - filter passed?
         */
        function storyPageFilter(page) {
            if(vm.selected_story.id) {
                if(page.stories.data.length) {
                    var passed = false;
                    angular.forEach(page.stories.data, function (page_story) {
                        if (vm.selected_story.id === page_story.id) passed = true;
                    });
                    return passed;
                } else {
                    return false;
                }
            } else {
                return true;
            }
        }

        /**
         * Filters directories through filtered story
         * If there is any page with filtered story returns treue
         *
         * @param {object} directory
         * @returns {boolean} - filter passed?
         */
        function storyDirectoryFilter(directory) {
            if(vm.selected_story.id) {
                if(directory.pages.data.length) {
                    var passed = false;
                    angular.forEach(directory.pages.data, function (page) {
                        if(storyPageFilter(page)) passed = true;
                    });
                    return passed;
                } else {
                    return false;
                }
            } else {
                return true;
            }
        }

        /**
         * Filters single page information through filtered story
         * If there is any single page with filtered story returns true
         *
         * @returns {boolean} - filter passed?
         */
        function storySinglePagesInfoFilter() {
            if(vm.selected_story.id) {
                var passed = false;
                angular.forEach(vm.single_pages, function (page) {
                    if(storyPageFilter(page)) passed = true;
                });
                return passed;

            } else {
                return true;
            }
        }

        /**
         * Select story to filter knowledge
         *
         * @param {object} story
         */
        function selectStory(story_id) {
            angular.forEach(vm.stories, function(story) {
                if(story.id == story_id) {
                    vm.selected_story = story;
                }
            });
            // new localstorage structure
            projectFiltersService.addTicketFilter(story_id, 'knowledge_story', $stateParams.project_id);
        }

        function addEditDirectoryModal(item) {
            dialogService.customDialog(null, 'AddEditDirectoryKnowledgeDialogController', 'app/main/knowledge/add-edit-directory/add-edit-directory.html', {project_id:$stateParams.project_id, item:item}, function (success) {
                if (success == true) {
                    vm.msg_error = '';
                    vm.msg_success = transService.translate(item ? 'KNOWLEDGE.UPDATED': 'KNOWLEDGE.ADDED_DIR');
                    refreshDirectories();
                }
            });
        }

        function addEditPageModal(dir_id, id) {
            dialogService.customDialog(null, 'AddEditPageKnowledgeDialogController', 'app/main/knowledge/add-edit-page/add-edit-page.html', {project_id:$stateParams.project_id, directories: vm.directories, dir_id:dir_id, id:id}, function (page_id) {
                if (!isNaN(parseInt(page_id))) {
                    vm.msg_error = '';
                    vm.msg_success = transService.translate(id ? 'KNOWLEDGE.UPDATED_PAGE': 'KNOWLEDGE.ADDED_PAGE');
                    // show edited/created page
                    selectPage(page_id);
                }
            }, undefined, refreshAll, false, false);
        }

        function deleteDir(id) {
            dialogService.confirm(null, 'KNOWLEDGE.DELETE_DIR_QUESTION', function() {
                api.directory.delete({id:id, project_id:$stateParams.project_id}, function () {
                    vm.msg_success = transService.translate('KNOWLEDGE.DELETE_DIR');
                    vm.msg_error = '';
                    refreshAll();

                },function (response) {
                    vm.msg_error = transService.getErrorMassage(response);
                })
            });
        }

        function deletePage(id) {
            dialogService.confirm(null, 'KNOWLEDGE.DELETE_PAGE_QUESTION', function() {
                api.page.page.delete({id:id, project_id:$stateParams.project_id}, function () {
                    vm.msg_success = transService.translate('KNOWLEDGE.DELETE_PAGE');
                    vm.msg_error = '';
                    refreshAll();

                },function (response) {
                    vm.msg_error = transService.getErrorMassage(response);
                });
            });
        }

        function selectPage(page)
        {
            // if page is page_id (number)
            // refresh after edit page purposes
            if (!isNaN(parseFloat(page)) && isFinite(page) ) {
                vm.selected_page_id = page;
            } else {
                //if page is an object
                vm.selected_page_id = page.id;
            }

            // reset container size
            vm.selected_page = {};

            api.page.page.get({id:vm.selected_page_id, project_id:$stateParams.project_id}, function (response) {

                $timeout(function () {
                    vm.selected_page = response.data;
                    vm.selected_page.trustedContent = textareaSanitizerService.sanitizeHTML(vm.selected_page.content);
                    vm.selected_page.comments.data.forEach(comment => comment.trustedText = textareaSanitizerService.sanitizeHTML(comment.text));

                    // make sure that folder containing page is opened
                    angular.forEach(vm.directories, function(directory) {
                        if(response.data.knowledge_directory_id == directory.id) {
                            if(!directory.opened) {
                                directory.opened = true;
                                saveDirestoriesView();
                            }
                        }
                    });

                    // make a hash that link to the page
                    if (isASCII($filter('stringToUrl')(response.data.name, 50))) {
                        $location.hash(response.data.id + ',' + $filter('stringToUrl')(response.data.name, 50));
                    } else {
                        $location.hash(response.data.id);
                    }

                    // If responsive read pane is active, navigate to it
                    if ( angular.isDefined(vm.responsiveReadPane) && vm.responsiveReadPane )
                    {
                        vm.activePaneIndex = 1;
                    }

                    // Store the current scrollPos
                    vm.scrollPos = vm.scrollEl.scrollTop();

                    // Scroll to the top
                    vm.scrollEl.scrollTop(0);
                });
            }, function() {
                // if page not exists - url hash purposes
                vm.selected_page = { id: 0, name: transService.translate('KNOWLEDGE.PAGE_NOT_FOUND') };
            });
        }

        /**
         * Set vm.directory.opened = true when localstorage directory.id is provided
         *
         */
        function loadDirectoriesView() {
            if (typeof $window.localStorage.knowledge_opened_dirs != 'undefined') {

                var openedDirectories = JSON.parse($window.localStorage.knowledge_opened_dirs);

                if(openedDirectories.length) {
                    // set opened tags on vm.directories
                    angular.forEach(vm.directories, function (directory) {
                        if (openedDirectories.indexOf(directory.id) >= 0) {
                            directory.opened = true;
                        }
                    });
                }
            }
        }

        function saveDirestoriesView() {
            var openedDirectories = [];
            angular.forEach(vm.directories, function (directory) {
                if (directory.opened) {
                    openedDirectories.push(directory.id);
                }
            });
            $window.localStorage.knowledge_opened_dirs = JSON.stringify(openedDirectories);
        }


        function refreshDirectories() {
            // save current view
            saveDirestoriesView();

            api.directories.get({project_id:$stateParams.project_id}, function (response) {
                vm.directories = response.data;
                loadDirectoriesView();
            });
        }

        function refreshSinglePages() {
            api.pages.get({project_id:$stateParams.project_id, knowledge_directory_id:0}, function (response) {
                vm.single_pages = response.data;
            });
        }


        function refreshAll() {
            refreshDirectories();
            refreshSinglePages();
        }

        function toggleDirectory(dir) {
            dir.opened = !dir.opened;
            saveDirestoriesView();
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
         * Filters knowledge base pages through search query
         *
         * @param {string} query
         */
        function searchFilter(query) {
            if(query) {
                api.pages.get({ project_id: $stateParams.project_id, search: query },
                    function(response) {
                        vm.msg_error = '';
                        vm.filtered_pages = response.data;
                    }, function(response) {
                        vm.msg_error = transService.getErrorMassage(response);
                        vm.filtered_pages = [];
                    });
            }
        }

        /**
         * Loads 'index' page - first from singlePages, if nothing - from directories
         * only for desktop screen size
         */
        function loadIndexPage() {
            if (!vm.selected_page_id && !$mdMedia('sm')) {
                if (vm.single_pages.length) {
                    selectPage(vm.single_pages[0]);
                } else {
                    // get first page from directories
                    var index_page = {};
                    angular.forEach(vm.directories, function(directory) {
                        // check that directory have any pages and select first from present
                        if(directory.pages.data.length && typeof index_page.id == 'undefined') {
                            index_page = directory.pages.data[0];
                            directory.opened = true;
                        }
                    });
                    // load selected page if any
                    if (typeof index_page.id != 'undefined' && index_page.id) {
                        selectPage(index_page);
                    }
                }
            }
        }

        /**
         * Returns page id detected from hash
         */
        function getPageIdFromHash() {
            if($location.hash()) {
                return /^[1-9][0-9]{0,}/.exec($location.hash())[0];
            } else {
                return;
            }
        }

        /**
         * Are characters in string from ASCII table?
         * @param {string} str
         */
        function isASCII(str) {
            return /^[\x00-\x7F]*$/.test(str);
        }

        function updateComment(data, successCallback, apiErrorCallback) {
            const comment_id = parseInt(data.id);

            const comment = {
                project_id: $stateParams.project_id,
                text: data.value,
                comment_id: comment_id,
                interactions: { data: data.mentions },
            };

            api.page.comment.put(comment,
                function () {
                    updatePageComment(comment_id, data.value);
                    if (typeof successCallback != 'undefined') successCallback();
                },
                function (response) {
                    if (typeof apiErrorCallback != 'undefined') apiErrorCallback(response.data);
            });
        }

        function updatePageComment(comment_id, text) {
            const comment = vm.selected_page.comments.data.find(c => c.id === comment_id);
            if (!comment) return;

            comment.text = text;
            comment.trustedText = textareaSanitizerService.sanitizeHTML(comment.text);
            comment.updated_at = new Date();
        }

        function addComment(data, successCallback, apiErrorCallback) {
            const comment = {
                project_id: $stateParams.project_id,
                page_id: vm.selected_page_id,
                text: data.value,
                type: 'global',
                interactions: { data: data.mentions },
            };

            api.page.comments.post(comment,
                function (resp) {
                    addPageComment(resp, vm.selected_page.comments);
                    if (typeof successCallback != 'undefined') successCallback();
                },
                function (response) {
                    if (typeof apiErrorCallback != 'undefined') apiErrorCallback(response.data);
            });
        }

        function addPageComment(resp, comments) {
            if (!vm.user) {
                vm.user = {
                    first_name: 'Unknown',
                    last_name: 'User',
                }
            };

            const comment = resp.data;

            comment.user = { data: vm.user };
            comment.trustedText = textareaSanitizerService.sanitizeHTML(comment.text);

            comments.data.push(comment);
        }

        function removeComment(comment, $event) {
            const data = {
                comment_id: comment.id,
                project_id: $stateParams.project_id,
            };

            const comments = vm.selected_page.comments;
            const el = angular.element($event.target).parents('.comment');

            api.page.comment.delete(data, function() {
                el.addClass('animate:dissolve');
                $timeout(function() {
                    comments.data = comments.data.filter(function(c) {
                        return comment.id !== c.id;
                    });
                }, 200);
            }, function() {
                toastr.error(transService.translate('ERRORS.general.api_error'));
            });
        }

        function toggleEdit(comment_id) {
            vm.ee.emit('toggle-edit:' + comment_id);
        }

        function isMe(user) {
            return vm.user && vm.user.id === user.id;
        }

    }

    KnowledgeController.$inject = [
        '$element', '$scope', '$timeout', 'dialogService', '$mdMedia', '$window', '$location', '$auth', '$filter', 'api', 'transService', 
        'projectsService', 'projectFiltersService', 'filesService', '$stateParams', 'Directories', 'SinglePages', 'StoriesData', 'textareaSanitizerService'
    ];
})();
