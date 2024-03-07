(function ()
{
    'use strict';

    angular
        .module('CEP')
        .provider('api', api);

    /** @ngInject */
    function api()
    {
        this.driver = '';
        this.url = '';
        this.modulesJson = [];

        this.setDriver = function(driver) {
            this.driver = driver;
        };

        this.setUrl = function(url) {
            this.url = url;
        };

        this.setModulesJson = function(modulesJson) {
            this.modulesJson = modulesJson;
        };

        this.$get = function(apiJson, apiHttp) {
            var api = {};

            if (this.driver == 'http') {
                api = apiHttp;
                for (var i = 0; i < this.modulesJson.length; ++i) {
                    api[this.modulesJson[i]] = apiJson[this.modulesJson[i]];
                }
            } else {
                api = apiJson;
            }

            api['url'] = this.url;
            return api;
        }
    }
})();
