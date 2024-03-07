(function ()
{
    'use strict';

    angular
        .module('app.core')
        .factory('socket', socketService);

    /** @ngInject */
    function socketService($window, $rootScope)
    {
        var socket = null;
        var user_id = null;
        var events = [];

        return {
            connect:function (t_user_id) {
                if (!socket && __env.wsUrl) {
                    user_id = t_user_id;
                    socket = io.connect(__env.wsUrl, {query: 'jwt=' + $window.localStorage.token});
                }
            },
            clearAll: function () {
                if (socket) {
                    angular.forEach(events, function (event) {
                        socket.off(event);
                    })
                }
            },
            on: function (eventName, callback) {
                if (socket) {
                    events.push(eventName);

                    socket.on(eventName, function (data) {
                        if (user_id != data.sender_id || data.webbrowser_tab_id != $rootScope.webbrowser_tab_id) {
                            callback(data.data);
                        }
                    });
                }
            },
            emit: function (eventName, data, callback) {
                if (socket) {
                    socket.emit(eventName, data, function (data) {
                        callback(data);
                    })
                }
            }
        };

    }
})();
