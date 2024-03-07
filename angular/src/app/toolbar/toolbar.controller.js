(function ()
{
    'use strict';

    angular
        .module('app.toolbar')
        .controller('ToolbarController', ToolbarController);

    /** @ngInject */
    function ToolbarController($rootScope, $mdSidenav, $translate, $auth, $window, transService, dialogService)
    {
        var vm = this;

        // Data
        // $rootScope.global = {
        //     search: ''
        // };

        vm.bodyEl = angular.element('body');
        // vm.userStatusOptions = [
        //     {
        //         'title': 'Online',
        //         'icon' : 'icon-checkbox-marked-circle',
        //         'color': '#4CAF50'
        //     },
        //     {
        //         'title': 'Away',
        //         'icon' : 'icon-clock',
        //         'color': '#FFC107'
        //     },
        //     {
        //         'title': 'Do not Disturb',
        //         'icon' : 'icon-minus-circle',
        //         'color': '#F44336'
        //     },
        //     {
        //         'title': 'Invisible',
        //         'icon' : 'icon-checkbox-blank-circle-outline',
        //         'color': '#BDBDBD'
        //     },
        //     {
        //         'title': 'Offline',
        //         'icon' : 'icon-checkbox-blank-circle-outline',
        //         'color': '#616161'
        //     }
        // ];
        vm.languages = {
            pl: {
                'title'      : 'Polish',
                'translation': 'TOOLBAR.POLISH',
                'code'       : 'pl',
                'flag'       : 'pl'
            },
            en: {
                'title'      : 'English',
                'translation': 'TOOLBAR.ENGLISH',
                'code'       : 'en',
                'flag'       : 'us'
            }
            // es: {
            //     'title'      : 'Spanish',
            //     'translation': 'TOOLBAR.SPANISH',
            //     'code'       : 'es',
            //     'flag'       : 'es'
            // },
            // tr: {
            //     'title'      : 'Turkish',
            //     'translation': 'TOOLBAR.TURKISH',
            //     'code'       : 'tr',
            //     'flag'       : 'tr'
            // }
        };
        vm.currentUser = {};
        vm.current_avatar = '';

        // Methods
        vm.toggleSidenav = toggleSidenav;
        vm.changeLanguage = changeLanguage;
        vm.setUserStatus = setUserStatus;
        vm.toggleHorizontalMobileMenu = toggleHorizontalMobileMenu;
        vm.cloneProject = cloneProject;

        //////////

        init();

        /**
         * Initialize
         */
        function init()
        {
            // Select the first status as a default
            // vm.userStatus = vm.userStatusOptions[0];

            // Get the selected language directly from angular-translate module setting
            if (typeof $window.localStorage.language != 'undefined') {
                vm.selectedLanguage = vm.languages[$window.localStorage.language];
            } else {
                vm.selectedLanguage = vm.languages[$translate.preferredLanguage()];
            }

            moment.locale(vm.selectedLanguage.code);

            $auth.getUser(function (user) {
                vm.currentUser = user;
                vm.current_avatar = $auth.getAvatar(user.avatar);
            });

        }


        /**
         * Toggle sidenav
         *
         * @param sidenavId
         */
        function toggleSidenav(sidenavId)
        {
            $mdSidenav(sidenavId).toggle();
        }

        /**
         * Sets User Status
         * @param status
         */
        function setUserStatus(status)
        {
            vm.userStatus = status;
        }

        /**
         * Change Language
         */
        function changeLanguage(lang)
        {
            $rootScope.$emit('language-changed');
            vm.selectedLanguage = lang;
            transService.changeLanguage(lang.code);
        }

        /**
         * Toggle horizontal mobile menu
         */
        function toggleHorizontalMobileMenu()
        {
            vm.bodyEl.toggleClass('ms-navigation-horizontal-mobile-menu-active');
        }

        function cloneProject() {
            dialogService.customDialog(
                null,
                'cloneProjectDialogController',
                'app/main/projects/clone-dialog/clone-dialog.html',
                {
                    project_id: $rootScope.current_project_id,
                    project_name: $rootScope.current_project_name
                }
            );
        }
    }

})();
