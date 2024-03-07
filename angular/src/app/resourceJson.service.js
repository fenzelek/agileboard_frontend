(function ()
{
    'use strict';

    angular
        .module('CEP')
        .factory('$resourceJson', function ($resource) {
            var ResourceJson = function (url) {
                this.url = url;
                this.resource = $resource;

                this.get = function(form, success, error){

                    return $resource(url).get(
                        form,
                        function (response) {if (success != undefined) success(response)},
                        function (response) {if (error != undefined) error(response)}
                    );
                };

                this.save = function(form, success, error){
                    form = {};
                    return this.get(form, success, error);
                };

                this.put = function(form, success, error){
                    form = {};
                    return this.get(form, success, error);
                };

                this.delete = function(form, success, error){
                    return this.get(form, success, error);
                };
            };

            return {
                getInstance: function (url, $resource) {
                    return new ResourceJson(url, $resource);
                }
            };
        });
})();
