(function ()
{
    'use strict';

    var __env = {
        apiUrl: '',
        googleMapKey: '',
        enableDebug: false
    };

    // Import variables if present (from env.js)
    if(window){
        __env = window.__env; //ie ...
    }

    angular
        .module('app.core')
        .config(config)
        .constant('__env', __env);

    /** @ngInject */
    // uiGmapGoogleMapApiProvider
    function config($ariaProvider, $mdAriaProvider, $logProvider, msScrollConfigProvider, $translateProvider, $provide, fuseConfigProvider, __env)
    {
        // ng-aria configuration
        $ariaProvider.config({
            tabindex: false
        });

        // Globally disables all ARIA warnings.
        $mdAriaProvider.disableWarnings();

        // Enable debug logging
        $logProvider.debugEnabled(__env.enableDebug);

        // msScroll configuration
        msScrollConfigProvider.config({
            wheelPropagation: true
        });

        // toastr configuration
        toastr.options.timeOut = 3000;
        toastr.options.positionClass = 'toast-top-right';
        toastr.options.preventDuplicates = true;
        toastr.options.progressBar = true;

        // uiGmapgoogle-maps configuration
        // uiGmapGoogleMapApiProvider.configure({
        //     //    key: 'your api key',
        //     v        : '3.exp',
        //     libraries: 'weather,geometry,visualization'
        // });

        var last_build_angular = 0;
        if (typeof window.localStorage.last_build_angular != 'undefined') {
            last_build_angular = window.localStorage.last_build_angular;
        }

        // angular-translate configuration
        $translateProvider.useLoader('$translatePartialLoader', {
            urlTemplate: '{part}/i18n/{lang}.json?t=' + last_build_angular
        });

        if (localStorage.getItem('language')) {
            $translateProvider.preferredLanguage(localStorage.getItem('language'));
        } else {
            $translateProvider.preferredLanguage(__env.default_language);
        }
        $translateProvider.useSanitizeValueStrategy('sanitizeParameters');

        // Fuse theme configurations
        fuseConfigProvider.config({
            'disableCustomScrollbars'        : false,
            'disableCustomScrollbarsOnMobile': true,
            'disableMdInkRippleOnMobile'     : true
        });
    }
})();
