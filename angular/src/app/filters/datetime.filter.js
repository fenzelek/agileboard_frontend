(function ()
{
    'use strict';

    angular
        .module('CEP')
        .filter('utcToLocal', utcToLocal)
        .filter('localToUtc', localToUtc)
        .filter('toTimestamp', toTimestamp)
        .filter('datetime', datetime);

    /**
     * convert utc time to localtime
     *
     * @param $filter
     * @returns {Function}
     */
    function utcToLocal($filter) {
        return function (utcDateString, format) {

            if (!utcDateString) {
                return;
            }

            utcDateString = utcDateString.replace(' ', 'T') + 'Z';

            if (format == undefined) {
                format = "yyyy-MM-dd HH:mm:ss";
            }

            return $filter('date')(utcDateString, format);
        };
    }

    /**
     * convert local time to utc time
     *
     * @param $filter
     * @returns {Function}
     */
    function localToUtc($filter) {
        return function (dateString, format) {

            if (!dateString) {
                return;
            }

            dateString = dateString.replace(/-/g, '/');

            dateString = (new Date(dateString)).toUTCString();
            dateString = (new Date(dateString)).toISOString();
            dateString = dateString.replace('T', ' ');
            dateString = dateString.replace('Z', '');
            dateString = dateString.split('.')[0];

            if (format == undefined) {
                format = "yyyy-MM-dd HH:mm:ss";
            }

            return $filter('date')(dateString, format);
        };
    }

    function datetime($filter) {
        return function(input, format) {
            if (input == null || typeof input == 'undefined') return '';
            // get timestamp to valid date parsing by angular
            var date = typeof input == 'string' ? new Date(input.replace(/-/g, '/')) : input;
            return $filter('date')(date.getTime(), format ? format : 'yyyy-MM-dd HH:mm');
        };
    }

    /**
     * conver time to timestamp
     *
     * @returns {Function}
     */
    function toTimestamp() {
        return function (dateString) {
            return (new Date(dateString.replace(/-/g, '/'))).getTime();
        }
    }
})();
