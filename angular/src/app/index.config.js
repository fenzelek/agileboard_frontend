(function ()
{
    'use strict';

    angular
        .module('CEP')
        .config(config);

    /** @ngInject */
    function config($httpProvider, apiProvider, $translatePartialLoaderProvider)
    {
        // Translation
        $translatePartialLoaderProvider.addPart('app');

        var config = {
            "url": {
                "mail": window.location.hostname + "/"
            },
            "dataSource": "http",
            "interceptors": ["authInterceptor", "contentInterceptor"],
            "modulesJSON": [ //if dataSource == http
            //    'calendar',
            ]
        };

        // set config values
        config.interceptors.forEach(function(interceptor) {
            $httpProvider.interceptors.push(interceptor);
        });
        apiProvider.setDriver(config.dataSource);
        apiProvider.setUrl(config.url.mail);
        apiProvider.setModulesJson(config.modulesJSON);

    }

})();