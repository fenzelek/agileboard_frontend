(function () {
    'use strict';

    angular
        .module('app.core')
        .factory('$multipartForm', function () {
            var MultipartForm = function (url, $http) {
                this.url = url;
                this.http = $http;

                this.save = function (form, success, error, progress) {
                    request('POST', form, success, error, progress);
                };

                this.put = function (form, success, error, progress) {
                    request('PUT', form, success, error, progress);
                };

                function request(method, form, success, error, progress) {
                    var new_url = url;
                    angular.forEach(form, function (value, key) {
                        new_url = new_url.replace(':' + key, value);
                    });

                    form._method = method;
                    var fd = objectToFormData(form, new FormData());

                    $http({
                        method: "POST",
                        url: new_url,
                        data: fd,
                        transformRequest: angular.identity,
                        headers: {'Content-Type': undefined},
                        uploadEventHandlers: {
                            progress: function (e) {
                                if (progress != undefined) {
                                    progress((e.loaded / e.total) * 100);
                                }
                            }
                        }
                    }).then(
                        function (response) {
                            success(response.data, response.status);
                        },
                        function (response) {
                            error(response.data, response.status);
                        }
                    );
                }

                function objectToFormData(obj, form, namespace) {

                    var fd = form || new FormData();
                    var formKey;

                    for (var property in obj) {
                        if (obj.hasOwnProperty(property) && property != '$$hashKey') {

                            if (namespace) {
                                formKey = namespace + '[' + property + ']';
                            } else {
                                formKey = property;
                            }

                            if (typeof obj[property] === 'object' && !(obj[property] instanceof File)) {

                                objectToFormData(obj[property], fd, formKey);

                            } else {

                                var val = obj[property];

                                if (obj[property] === true) {
                                    val = 1;
                                } else if (obj[property] === false) {
                                    val = 0;
                                }

                                fd.append(formKey, val);
                            }
                        }
                    }

                    return fd;
                }
            };

            return {
                getInstance: function (url, $http) {
                    return new MultipartForm(url, $http);
                }
            };
        });
})();
